import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  async createRide(@Body() createRideDto: CreateRideDto) {
    return await this.ridesService.insert(createRideDto);
  }
  
  @Put(':id')
  async updateRide(@Param('id') id: string, @Body() updateRideDto: UpdateRideDto) {
    return await this.ridesService.update(id, updateRideDto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.ridesService.findById(id);
  }
}