import { Module } from '@nestjs/common';
import { MainGateway } from './monolithic-gateway';
// import { MainGateway } from './gateway';
// import { MainGateway } from './main-gateway';

@Module({
  providers: [MainGateway],
  exports: [MainGateway],
})
export class MainGatewayModule {}