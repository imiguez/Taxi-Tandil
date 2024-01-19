import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  async createRide(@Body() createRideDto: CreateRideDto) {
    return await this.ridesService.createRide(createRideDto);
  }

  @Get()
  async findAll() {
    return await this.ridesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    return await this.ridesService.findById(id);
  }
}