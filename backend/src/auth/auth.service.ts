import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { jwtConstants } from './constants';

//useguard
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(username);
        if (user && user.password === pass) {
          const { password, ...result } = user;
          return result;
        }
        return null;
    }
    
    async login(user: any) {
        const payload = { username: user.username};//, sub: user.userId };
        return {
          access_token: this.jwtService.sign({exp: Math.floor(Date.now() / 1000) + (10), data: payload}, jwtConstants),
        };
    }
}
