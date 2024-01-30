import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './custom-decorators';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    //private gateway: EventsGateway
  ) {}

  @Public()
  @Get()
  base() {
    //this.gateway.prueba();
    return {message: 'connected to the base url!'}
  }

  @Public()
  @Get('prueba')
  prueba() {
    //this.gateway.prueba();
    return {message: 'connected!'}
  }
}