import { Controller, Post, Body, Req, Get, Param } from '@nestjs/common';
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
    return await this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Get('logout')
  async logout(@Req() req: Request) {
    await this.authService.logout(req.user);
  }

  @Public()
  @Post('verify-account/:email')
  async verifyAccount(@Param('email') email: string) {
    await this.authService.verifyAccount(email);
  }

  @Public()
  @Get('account-verified/:code')
  async validateCode(@Param('code') code: string) {
    await this.authService.validateCode(code);
  }

  @Post('refresh-jwt-token')
  async refreshJwtToken(@Req() req: Request, @Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshJwtToken(refreshToken, req.user);
  }
}