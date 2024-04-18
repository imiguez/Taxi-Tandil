import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { MainGateway } from 'src/sockets/monolithic-gateway';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService, private gateway: MainGateway) {}

  @Post()
  async createRide(@Body() createRideDto: CreateRideDto) {
    const response = await this.ridesService.insert(createRideDto);
    this.gateway.updateRideId(response.user_id+'', response.driver_id+'', response.id);
    return response;
  }
  
  @Put(':id')
  async updateRide(@Param('id') id: number, @Body() updateRideDto: UpdateRideDto) {
    return await this.ridesService.update(id, updateRideDto);
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    return await this.ridesService.findById(id);
  }
}