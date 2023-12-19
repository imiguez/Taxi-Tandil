import { Injectable } from '@nestjs/common';
import { CreateRideDto } from './dto/create-ride.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class RidesService {

  constructor(
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createRide(ride: CreateRideDto) {
    return await this.ridesRepository.query(`INSERT INTO rides (
      origin_lat, origin_lng, destination_lat, destination_lng, driver_id, user_id, accepted_timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
      ride.originLatitude, ride.originLongitude, ride.destinationLatitude, ride.destinationLongitude,
      ride.driver_id, ride.user_id, new Date()
    ]);
  }

  async findAll() {
    return await this.ridesRepository.find();
  }

  async findById(id: number) {
    return await this.ridesRepository.findOneBy({id: id});
  }
}