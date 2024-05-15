import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Ticket } from "../entities/ticket.entity";
import { IsNotEmpty } from "class-validator";

export class CreateTicketDto extends PartialType(
    OmitType(Ticket, ['active'] as const),
) {
    @IsNotEmpty()
    issuer_id: string;
}
