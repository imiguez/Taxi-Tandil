import { Body, Controller, Delete, Get, Render } from '@nestjs/common';
import { Public } from './custom-decorators';
import { LoginDto } from './auth/dto/login.dto';
import { AuthService } from './auth/auth.service';
@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Get('private-policy')
  @Render('private-policy')
  getPrivatePolicy() {}

  @Public()
  @Get('delete-account')
  @Render('delete-account')
  getDeleteAccount() {}

  @Public()
  @Delete('delete-account')
  async deleteAccount(@Body() loginDto: LoginDto) {
    let user = await this.authService.validateUser(loginDto);
    return await this.authService.deleteAccount(user);
  }
}