import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { Public } from 'src/custom-decorators';
import { AuthService } from './auth.service';
import { Request as RequestExpress } from 'express';
import { SignUpDto } from './dto/sign-up.dto';
import { LoginDto } from './dto/login.dto';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) //private gateway: EventsGateway
  {}

  @Public()
  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    let user = await this.authService.validateUser(loginDto);
    let {password, rides, ...cleanedUser} = user;
    return await this.authService.login(cleanedUser);
  }

  @Post('refresh-jwt-token')
  async refreshJwtToken(@Req() req: RequestExpress, @Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshJwtToken(refreshToken, req.user);
  }

  // Only for dev purposes
  @Get('prueba')
  async prueba(@Req() req: RequestExpress) {
    return {message:'paso prueba'};
  }
}