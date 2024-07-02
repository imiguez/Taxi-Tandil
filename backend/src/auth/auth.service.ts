import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtUtils } from './utils/jwt.util';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { passwordsMatch, passwordEncoder } from './utils/password.util';
import { Role } from 'src/users/entities/role.entity';
import { redisClient } from 'src/main';
import { Serializer } from '../utils/serializer.util';
import { OneSignalStaticClass } from 'src/OneSignalStaticClass';
import { EmailNotification, PushNotification } from 'src/types/notifications.type';
import { EmptySession, Session } from 'src/types/serializer.type';
const otpGenerator = require('otp-generator');


@Injectable()
export class AuthService {
  private sessionExpDateInSeconds: number = process.env.DEVELOPMENT_ENV ? 60*50 : 60*60*24*30;
  private accessTokenTime: string = process.env.DEVELOPMENT_ENV ? '15s' : '15m';
  private refreshTokenTime: string = process.env.DEVELOPMENT_ENV ? '50m' : '30d';
  private iss = ''; // TODO: set to backend url.

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    signUpDto.password = passwordEncoder(signUpDto.password);

    const result = await this.usersRepository
    .createQueryBuilder().insert().into(User)
    .values({
      firstName: signUpDto.firstName,
      lastName: signUpDto.lastName,
      email: signUpDto.email,
      password: signUpDto.password,
    }).execute().catch((reason) => {
      let msg = '';
      if (reason && reason.driverError) {
        if (reason.driverError.detail.includes('Key') && reason.driverError.detail.includes('already exists')) msg = 'duplicate key value';
        else msg = reason.driverError.detail;
      }
      throw new HttpException(msg, HttpStatus.CONFLICT);
    });
    
    if (result.generatedMaps[0] == null) throw new Error('Cant insert user into database.');
    
    const userRole = await this.rolesRepository.findOneBy({name: 'user'});
    if (!userRole) throw new HttpException('User role was not found.', HttpStatus.NOT_FOUND);

    await this.usersRepository
    .createQueryBuilder()
    .relation(User, "roles")
    .of(result.generatedMaps[0].id)
    .add(userRole);

    let user = await this.usersRepository.findOneBy({id: result.generatedMaps[0].id});
    if (!user) throw new HttpException('Error returning the created entity.', HttpStatus.CREATED);
    
    let {password, rides, tickets, ...cleanedUser} = user;
    return cleanedUser;
  }

  async verifyAccount(email: string) {
    const user = await this.usersRepository.findOneBy({email: email});
    if (!user) throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    if (user.accountVerified) throw new HttpException('The account is already verified.', HttpStatus.CONFLICT);

    const otp = otpGenerator.generate(12, { specialChars: false });

    const expTime = 60*60;

    await redisClient.setex(`code:${otp}`, expTime, user.id);

    const emailConfigs: EmailNotification = {
      recipients: {external_ids: [user.id]},
      template_name: 'Email:Sign up',
      custom_data: {
        user: {first_name: user.firstName},
        exp_time: expTime/60,
        verify: {URL:  !!process.env.DEVELOPMENT_ENV ? `http://192.168.0.187:2000/auth/account-verified/${otp}` : `https://www.ride-company.com/auth/account-verified/${otp}`}
      }
    };

    await OneSignalStaticClass.createEmailNotification(emailConfigs);
  }

  async validateCode(code: string) {
    const userId = await redisClient.get(`code:${code}`);
    if (!userId) throw new HttpException('The verification code has expired or has never existed.', HttpStatus.UNAUTHORIZED);
    await this.usersRepository
      .createQueryBuilder()
      .update()
      .set({accountVerified: true})
      .where({id: userId})
      .execute();
  }

  async authenticate(loginDto: LoginDto) {
    // Get user from db.
    const user = await this.usersRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.roles", "roles")
      .select(["user.id", "user.firstName", "user.lastName", "user.email", "user.accountVerified", "user.password", "roles"])
      .where("user.email = :email", { email: loginDto.email })
      .getOne();
    // Check user exists.
    if (!user) throw new HttpException('Could not find any User with the email provided.', HttpStatus.NOT_FOUND);
    // Check account was verified.
    if (!user.accountVerified) throw new HttpException('Your account is not verified.', HttpStatus.UNAUTHORIZED);
    // Check passwords match.
    if (!passwordsMatch(loginDto.password, user.password)) throw new HttpException('Incorrect password.', HttpStatus.BAD_REQUEST);
    let {password, ...cleanedUser} = user;
    return cleanedUser;
  }

  async login(loginDto: LoginDto) {
    // Authenticate user.
    const user = await this.authenticate(loginDto);
    // Extract data from user.
    let {id, firstName, lastName, email, roles} = user;
    // Check user doesnt have an active ride.
    const socketSession = await redisClient.get(`socket:${id}`);
    if (socketSession) throw new HttpException('The user has a socket session active, user can not login during an active socket session.', HttpStatus.FORBIDDEN);
    // Notify all subscribers with the external id equlas to user id about the login.
    const notification: PushNotification = {
      recipients: {external_ids: [id]},
      title: {es: 'Se ha detectado un nuevo inicio de sesión', en: 'A new login was detected'},
      content: {es: 'Si usted no reconoce el inicio de sesión, por favor inicie sesión y registre su inconveniente en la sección de Configuraciones.', en: 'If you do not recognize the login, please login and register the issue in the Settings.'},
      android_channel: 'Login detection'
    };
    await OneSignalStaticClass.createPushNotification(notification);
    // Generate tokens.
    const access_token = sign({user: user, isRefreshToken: false}, `${process.env.JWT_SECRET}`, {expiresIn: this.accessTokenTime, issuer: this.iss, subject: id+''});
    const refresh_token = sign({user: user, isRefreshToken: true}, `${process.env.JWT_SECRET}`, {expiresIn: this.refreshTokenTime, issuer: this.iss, subject: id+''});
    // Get user's session.
    let serializedSession = await redisClient.get(`session:${id}`);
    let session: Session = EmptySession;
    // If session exists, then deserialize user session.
    if (serializedSession) session = Serializer.deserializeSession(serializedSession);
    // Else, fill the user property.
    else session.user = {firstName, lastName, email, roles};
    // Add common properties to the session.
    session.access_token = access_token;
    session.refresh_token = refresh_token;
    session.exp_date_in_ms = Date.now() + (this.sessionExpDateInSeconds*1000);
    // Create/Update session.
    await redisClient.setex(`session:${id!}`, this.sessionExpDateInSeconds, Serializer.serializeSession(session));
    
    return {
      user,
      access_token: access_token,
      refresh_token: refresh_token
    }
  }

  async refreshJwtToken(token: string, user: any | undefined) {
    try {
      let refreshPayload = await JwtUtils.validateToken(token, false);
      if (!refreshPayload.isRefreshToken) {
        throw new UnauthorizedException({
          message: 'Not a refresh token',
          error: 'JsonWebTokenError',
          statusCode: 403
        });
      }
      // Check user is not undefined.
      if (!user || !user.id) throw new HttpException('User or user id from Express is undefined.', HttpStatus.INTERNAL_SERVER_ERROR);
      // Get user's session and check if it is undefined.
      let serializedSession = await redisClient.get(`session:${user.id}`);
      if (!serializedSession) throw new HttpException('User session does not exists.', HttpStatus.UNAUTHORIZED);
      // Create access token.
      const access_token = sign({user: user, isRefreshToken: false}, `${process.env.JWT_SECRET}`, {expiresIn: this.accessTokenTime, issuer: this.iss, subject: user.id+''});
      // Deserialize session and update access token.
      let session = Serializer.deserializeSession(serializedSession);
      session.access_token = access_token;
      // Calculate the new expiration time and update session.
      let timeInMsToExpire = Math.floor((session.exp_date_in_ms! - Date.now()) / 1000);
      await redisClient.setex(`session:${user.id}`, timeInMsToExpire, Serializer.serializeSession(session));
      
      return { access_token: access_token };
    } catch (error) {
      // To differentiate between expired access token and expired refresh token.
      if (error.message == 'jwt expired')
        throw new HttpException('refresh jwt expired', HttpStatus.UNAUTHORIZED);
      throw error;
    }
  }

  async logout(user: any | undefined) {
    if (!user || !user.id) throw new HttpException('User or user id from Express is undefined.', HttpStatus.INTERNAL_SERVER_ERROR);
    await redisClient.del(`session:${user.id}`);
    await redisClient.del(`socket:${user.id}`);
  }

  async deleteAccount(loginDto: LoginDto) {
    // Authenticate user.
    const user = await this.authenticate(loginDto);
    // Delete user.
    const response = await this.usersRepository
      .createQueryBuilder("user")
      .delete()
      .from(User)
      .where("id = :id", { id: user.id })
      .execute();

    await OneSignalStaticClass.deleteUserByExternalId(user.id);
    return response.affected != null && response.affected != undefined;
  }
}