import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { Public } from 'src/custom-decorators';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        //private gateway: EventsGateway
    ) {}

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req: any) {
      return this.authService.login(req.user);
    }
}
