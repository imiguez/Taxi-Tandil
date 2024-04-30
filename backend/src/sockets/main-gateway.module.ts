import { Module } from '@nestjs/common';
import { MainGateway } from './monolithic-gateway';
import { RidesModule } from 'src/rides/rides.module';
// import { MainGateway } from './gateway';
// import { MainGateway } from './main-gateway';

@Module({
  imports: [RidesModule],
  providers: [MainGateway],
  exports: [MainGateway],
})
export class MainGatewayModule {}