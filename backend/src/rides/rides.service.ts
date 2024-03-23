import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRideDto } from './dto/create-ride.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { Repository } from 'typeorm';
import { UpdateRideDto } from './dto/update-ride.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class RidesService {

  constructor(
    @InjectRepository(Ride)
    private ridesRepository: Repository<Ride>,
  ) {}

  async insert(ride: CreateRideDto) {
    try {
      const user = new User();
      user.id = ride.user_id;
      const driver = new User();
      driver.id = ride.driver_id;
      const {user_id, driver_id, ...cleanedRide} = ride;
      cleanedRide.user = user;
      cleanedRide.driver = driver;
      const result = await this.ridesRepository
      .createQueryBuilder().insert().into(Ride)
      .values({
        ...cleanedRide, acceptedTimestamp: new Date()
      }).returning([
        'id', 'accepted_timestamp', 'origin_lat', 'origin_lng', 'destination_lat', 'destination_lng'
      ]).execute();
      return result.generatedMaps[0];
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  async update(ride: UpdateRideDto) {
    try {
      const result = await this.ridesRepository
      .createQueryBuilder()
      .update(Ride)
      .set(ride)
      .where("id = :id", { id: ride.id })
      .returning(['was_canceled', 'arrived_timestamp', 'finished_timestamp', 'updated_at'])
      .execute();
      return result.generatedMaps[0];
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  async findById(id: number) {
    try {
      return await this.ridesRepository.findOneByOrFail({id: id});
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}