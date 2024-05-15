import { PickType } from '@nestjs/mapped-types';
import { Ticket } from '../entities/ticket.entity';

export class UpdateTicketDto extends PickType(Ticket, ['active'] as const) {}