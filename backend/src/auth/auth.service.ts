import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

//useguard
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // TODO: receive a DTO as a parameter
  async validateUser(email: string, password: string): Promise<any> {
    // TODO: verify if the email var its actually a valid email
    const user = await this.usersService.findByEmail(email); // TODO: query to a db
    // TODO: compare the password with the encrypted in the db
    if (user && user.password === password) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) { // TODO: use a DTO
    const payload = { 
      email: user.email,
      //username: user.username
    }; //, sub: user.userId };
    return {
      payload,
      // TODO: change the issuear to an actual id of the user
      access_token: this.jwtService.sign({payload, isRefreshToken: false}, {issuer: '1', subject: user.email}), 
      refresh_token: this.jwtService.sign({payload, isRefreshToken: true}, {expiresIn: '7d', issuer: '1', subject: user.email}),
    };
  }

  async refreshJwtToken(user: any) { // TODO: use a DTO
    if (!user.isRefreshToken) {
      throw new UnauthorizedException({
        message: 'Not a refresh token',
        error: 'JsonWebTokenError',
        statusCode: 401
      });
    }

    const {payload} = user;
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
