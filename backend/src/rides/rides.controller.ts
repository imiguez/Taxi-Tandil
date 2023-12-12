import { Controller, Get, Post, Body } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  createRide(@Body() createRideDto: CreateRideDto) {
    return this.ridesService.createRide(createRideDto);
  }

  @Get()
  findAll() {
    return this.ridesService.findAll();
  }
}