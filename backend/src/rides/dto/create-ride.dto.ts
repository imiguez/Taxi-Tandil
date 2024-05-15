import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Ride } from "../entities/ride.entity";
import { IsNotEmpty } from "class-validator";

export class CreateRideDto extends PartialType(
    OmitType(Ride, ['wasCancelled', 'arrivedTimestamp', 'finishedTimestamp', 'updated_at'] as const),
) {
    @IsNotEmpty()
    user_id: string;
    @IsNotEmpty()
    driver_id: string;
}