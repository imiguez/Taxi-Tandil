import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './custom-decorators';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    //private gateway: EventsGateway
  ) {}

  //@Public()
  @Post('prueba')
  prueba(@Body() body: any) {
    //this.gateway.prueba();
  }
}
