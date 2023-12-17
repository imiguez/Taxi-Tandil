import { Injectable, NotFoundException } from '@nestjs/common';
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

  async createRide(createRideDto: CreateRideDto) {
    let ride = {...createRideDto, ...{acceptedTimestamp: new Date()}};
    let user = await this.usersRepository.findOneBy({id: ride.user_id});
    if (user == null) throw new NotFoundException(`User with id ${ride.user_id} wasn't found.`)
    let driver = await this.usersRepository.findOneBy({id: ride.driver_id});
    if (driver == null) throw new NotFoundException(`User with id ${ride.driver_id} wasn't found.`)
    let rideCreated = this.ridesRepository.create(ride);
    rideCreated.user = user;
    rideCreated.driver = driver;
    return await this.ridesRepository.save(rideCreated);
  }

  async findAll() {
    return await this.ridesRepository.find();
  }
}