import { Injectable, NotFoundException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { LoginDto } from "../dtos/login.dto";
import { UserDto } from "../dtos/user.dto";
import { User } from "src/users/user.entity";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }
  
  // builds the req.user field for our controllers
  async validate(loginDto: LoginDto): Promise<User> { // Can be change to an AuthLoginDto
    const user = await this.authService.validateUser(loginDto);
    return user; // { username: user.username, email: loginDto.email, roles: user.roles };
  }
}