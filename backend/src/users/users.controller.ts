import { Body, Controller, Get, Param, Put, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/user-update.dto';
import { Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    //private gateway: EventsGateway
  ) {}

  @Get(':id')
  async getUser(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return await this.usersService.findById(id);
  }

  @Put(':id')
  async updateUser(@Res({ passthrough: true }) res: Response, @Param('id') id: string, @Body() userDto: UpdateUserDto) {
    return await this.usersService.updateById(id, userDto);
  }
}