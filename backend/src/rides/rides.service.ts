import { Injectable } from '@nestjs/common';
import { CreateRideDto } from './dto/create-ride.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RidesService {

  constructor(
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>
  ) {}

  async createRide(createRideDto: CreateRideDto) {
    return await this.ridesRepository.save(createRideDto);
  }

  async findAll() {
    return await this.ridesRepository.find();
  }
}