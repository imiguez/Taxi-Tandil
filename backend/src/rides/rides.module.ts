import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { User } from 'src/users/entities/user.entity';
import { MainGatewayModule } from 'src/sockets/main-gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ride, User]), MainGatewayModule],
  exports: [RidesService, TypeOrmModule],
  controllers: [RidesController],
  providers: [RidesService],
})
export class RidesModule {}