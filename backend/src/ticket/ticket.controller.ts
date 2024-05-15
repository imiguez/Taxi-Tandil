import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  async createTicket(@Body() createTicketDto: CreateTicketDto) {
    return await this.ticketService.insert(createTicketDto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.ticketService.findById(id);
  }

  @Put(':id')
  async updateTicket(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return await this.ticketService.update(id, updateTicketDto);
  }

}
