import { Controller, Post, Body, Req } from '@nestjs/common';
import { Public } from 'src/custom-decorators';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) //private gateway: EventsGateway
  {}

  @Public()
  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    const user = await this.authService.signUp(signUpDto);
    return await this.authService.login(user);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    let user = await this.authService.validateUser(loginDto);
    return await this.authService.login(user);
  }

  @Post('refresh-jwt-token')
  async refreshJwtToken(@Req() req: Request, @Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshJwtToken(refreshToken, req.user);
  }
}