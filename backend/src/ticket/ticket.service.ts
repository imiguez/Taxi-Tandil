import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class TicketService {

  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
  ) {}

  async insert(ticket: CreateTicketDto) {
    try {
      const issuer = new User();
      issuer.id = ticket.issuer_id;
      const {issuer_id, ...cleanedTicket} = ticket;
      cleanedTicket.issuer = issuer;
      const result = await this.ticketsRepository
      .createQueryBuilder().insert().into(Ticket)
      .values(cleanedTicket).returning("*").execute();
      return result.raw[0];
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  async update(id: string, ticket: UpdateTicketDto) {
    try {
      const result = await this.ticketsRepository
      .createQueryBuilder()
      .update(Ticket)
      .set(ticket)
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
      return await this.ticketsRepository.findOneByOrFail({id: id});
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
