import { Injectable } from '@nestjs/common';
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

  async login(user: any) {
    const payload = { username: user.username }; //, sub: user.userId };
    return {
      access_token: this.jwtService.sign(
        payload
        // { exp: Math.floor(Date.now() / 1000) + 60, data: payload },
        // jwtConstants,
      ),
    };
  }
}
