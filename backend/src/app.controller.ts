import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './custom-decorators';
import { UsersService } from './users/users.service';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private authService: AuthService,
    private usersService: UsersService,
    //private gateway: EventsGateway
    ) {}

  @Public()
  @Post('auth/login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Public()
  @Get('findAll')
  getAllUsers(@Request() req: any) {
    return this.usersService.findAll();
  }

  //@Public()
  @Post('prueba')
  prueba(@Body() body: any) {
    //this.gateway.prueba();
  }
}
