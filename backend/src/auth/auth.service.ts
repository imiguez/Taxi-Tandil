import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtUtils } from './utils/jwt.util';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  private accessTokenTime: string = '2s';
  private refreshTokenTime: string = '2s';
  private iss = ''; // TODO: set to backend url.

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    return await this.usersRepository.save(signUpDto);
  }

  async validateUser(loginDto: LoginDto): Promise<User> {
    // TODO: verify if the email var its actually a valid email
    const user = await this.usersRepository.findOneBy({'email': loginDto.email}); // TODO: query to a db
    // TODO: compare the password with the encrypted in the db
    if (user == null) throw new NotFoundException();
    if (user.password !== loginDto.password) throw new BadRequestException();
    user.password = undefined; // Check if this update user password in db.
    return user;
  }

  async login(user: any) {
    const payload = { 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
    };
    return {
      payload,
      access_token: this.jwtService.sign({payload, isRefreshToken: false}, {expiresIn: this.accessTokenTime, issuer: this.iss, subject: user.id+''}), 
      refresh_token: this.jwtService.sign({payload, isRefreshToken: true}, {expiresIn: this.refreshTokenTime, issuer: this.iss, subject: user.id+''}),
    };
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
    const {payload} = user;
    return {
      access_token: this.jwtService.sign({payload, isRefreshToken: false}, {expiresIn: this.accessTokenTime, issuer: this.iss}),
    };
  }
}