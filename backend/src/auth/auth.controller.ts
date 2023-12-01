import { Controller, Post, UseGuards, Get, Body, Req } from '@nestjs/common';
import { Public } from 'src/custom-decorators';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Request as RequestExpress } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private jwtService: JwtService) //private gateway: EventsGateway
  {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: RequestExpress) {
    return this.authService.login(req.user);
  }

  @Post('refresh-jwt-token')
  async refreshJwtToken(@Req() req: RequestExpress) {
    return this.authService.refreshJwtToken(req.user);
  }
}