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
      }).returning("*").execute();
      return result.raw[0];
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  async update(id: string, ride: UpdateRideDto) {
    try {
      const result = await this.ridesRepository
      .createQueryBuilder()
      .update(Ride)
      .set(ride)
      .where("id = :id", { id: id })
      .returning("*")
      .execute();
      return result.raw[0];
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  async findById(id: string) {
    try {
      return await this.ridesRepository.findOneByOrFail({id: id});
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  async findRidesByUserId(userId: string, page: number) { // Check leftJoinAndMapMany
    try {
      const result = await this.ridesRepository
      .createQueryBuilder("rides")
      .leftJoinAndSelect("rides.user", "user")
      .leftJoinAndSelect("rides.driver", "driver")
      .where("user.id = :userId", { userId: userId })
      .orWhere("driver.id = :driverId", { driverId: userId })
      .orderBy("rides.created_at", "DESC")
      .offset(page*10)
      .limit(10)
      .getMany().then((rides) => {
        // Optional: Map the results to a desired structure
        return rides.map((ride) => ({
          ...ride,
          user: { id: ride.user.id, firstName: ride.user.firstName +' '+ ride.user.lastName },
          driver: { id: ride.driver.id, firstName: ride.driver.firstName +' '+ ride.user.lastName },
        }));
      });
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  async countRidesByUserId(userId: string) { // Check leftJoinAndMapMany
    try {
      const result = await this.ridesRepository
      .createQueryBuilder("rides")
      .leftJoin("rides.user", "user")
      .leftJoin("rides.driver", "driver")
      .where("user.id = :userId", { userId: userId })
      .orWhere("driver.id = :driverId", { driverId: userId })
      .getCount();
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

}