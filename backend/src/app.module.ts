import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { MainGatewayModule } from './sockets/main-gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { Role } from './users/entities/role.entity';
import { RidesModule } from './rides/rides.module';
import { Ride } from './rides/entities/ride.entity';
import { TicketModule } from './ticket/ticket.module';
import { Ticket } from './ticket/entities/ticket.entity';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot(), // This module permit using .env variables in the TypeOrmModule.
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: ((!process.env.DEVELOPMENT_ENV && process.env.POSTGRES_DB) ? process.env.POSTGRES_DB : 'ride-dev-env'),
      autoLoadEntities: true,
      entities: [User, Role, Ride, Ticket],
      // synchronize: process.env.DEVELOPMENT_ENV, // Set to false in production env.
    }),
    UsersModule, AuthModule, MainGatewayModule, RidesModule, TicketModule],
  controllers: [AppController],
  providers: [AppService, AuthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    }
  ],
})
export class AppModule {}