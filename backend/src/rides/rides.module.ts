import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ride])],
  exports: [RidesService, TypeOrmModule],
  controllers: [RidesController],
  providers: [RidesService],
})
export class RidesModule {}