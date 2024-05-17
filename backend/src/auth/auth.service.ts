import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtUtils } from './utils/jwt.util';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { passwordsMatch, passwordEncoder } from './utils/password.util';
import { UserDto } from 'src/users/dtos/user.dto';
import { Role } from 'src/users/entities/role.entity';

@Injectable()
export class AuthService {
  private accessTokenTime: string = process.env.DEVELOPMENT_ENV ? '1m' : '15m';
  private refreshTokenTime: string = process.env.DEVELOPMENT_ENV ? '5m' : '7d';
  private iss = ''; // TODO: set to backend url.

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      signUpDto.password = passwordEncoder(signUpDto.password);

      const userRole = await this.rolesRepository.findOneByOrFail({name: 'user'});
      
      const result = await this.usersRepository
      .createQueryBuilder().insert().into(User)
      .values({
        firstName: signUpDto.firstName,
        lastName: signUpDto.lastName,
        email: signUpDto.email,
        password: signUpDto.password,
      }).execute();

      if (result.generatedMaps[0] == null) throw new Error('Cant insert user into database.');

      await this.usersRepository
      .createQueryBuilder()
      .relation(User, "roles")
      .of(result.generatedMaps[0].id)
      .add(userRole);

      return await this.usersRepository.findOneByOrFail({id: result.generatedMaps[0].id});

    } catch (error) {
      if (error.message.includes('Could not find any entity'))
        throw new HttpException(`Error returning the created entity. ${error.message}`, HttpStatus.CREATED);
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  async validateUser(loginDto: LoginDto): Promise<UserDto> {
    // TODO: verify if the email var its actually a valid email
    try {
      const user = await this.usersRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.roles", "roles")
        .addSelect("user.password")
        .where("user.email = :email", { email: loginDto.email })
        .getOneOrFail();
      if (!passwordsMatch(loginDto.password, user.password)) throw new HttpException('Incorrect password.', HttpStatus.BAD_REQUEST);
      let {password, rides, ...cleanedUser} = user;
      return cleanedUser;
    } catch (error) {
      if (error.message.includes('Incorrect password')) throw error;
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  async login(user: any) {
    return {
      user,
      access_token: sign({user: user, isRefreshToken: false}, `${process.env.JWT_SECRET}`, {expiresIn: this.accessTokenTime, issuer: this.iss, subject: user.id+''}),
      refresh_token: sign({user: user, isRefreshToken: true}, `${process.env.JWT_SECRET}`, {expiresIn: this.refreshTokenTime, issuer: this.iss, subject: user.id+''})
    }
  }

  async refreshJwtToken(token: string, user: any) {
    try {
      let refreshPayload = await JwtUtils.validateToken(token, false);
      if (!refreshPayload.isRefreshToken) {
        throw new UnauthorizedException({
          message: 'Not a refresh token',
          error: 'JsonWebTokenError',
          statusCode: 403
        });
      }
    } catch (error) {
      // To differentiate between expired access token and expired refresh token.
      if (error.message == 'jwt expired')
        throw new HttpException('refresh jwt expired', HttpStatus.UNAUTHORIZED);
      throw error;
    }
    return {
      access_token: sign({user: user, isRefreshToken: false}, `${process.env.JWT_SECRET}`, {expiresIn: this.accessTokenTime, issuer: this.iss, subject: user.id+''}),
    };
  }

  async deleteAccount(user: UserDto) {
    try {
      const response = await this.usersRepository
        .createQueryBuilder("user")
        .delete()
        .from(User)
        .where("id = :id", { id: user.id })
        .execute();
      return response.affected != null && response.affected != undefined;
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}