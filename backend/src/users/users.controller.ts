import { Controller, Get, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from 'src/custom-decorators';

@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService,
        //private gateway: EventsGateway
    ) {}

    @Get('profile')
    getProfile(@Request() req: any) {
      return req.user;
    }
  
    @Public()
    @Get('findAll')
    getAllUsers(@Request() req: any) {
      return this.usersService.findAll();
    }
}
