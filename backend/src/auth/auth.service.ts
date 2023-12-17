import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtUtils } from './utils/jwt.util';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private accessTokenTime: string = '10s';
  private refreshTokenTime: string = '1h';
  private iss = ''; // TODO: set to backend url.

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    return await this.usersRepository.save(signUpDto);
  }

  async validateUser(loginDto: LoginDto): Promise<any> {
    // TODO: verify if the email var its actually a valid email
    const user = await this.usersRepository.findOneBy({'email': loginDto.email}); // TODO: query to a db
    // TODO: compare the password with the encrypted in the db
    if (user == null) throw new NotFoundException();
    if (user.password !== loginDto.password) throw new BadRequestException('Invalid password.');
    let {password, rides, ...cleanedUser} = user;
    return cleanedUser;
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
}