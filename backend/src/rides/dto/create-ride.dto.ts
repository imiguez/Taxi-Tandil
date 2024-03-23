import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Ride } from "../entities/ride.entity";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateRideDto extends PartialType(
    OmitType(Ride, ['wasCanceled', 'arrivedTimestamp', 'finishedTimestamp', 'updated_at'] as const),
) {
    @IsNotEmpty() @IsNumber()
    user_id: number;
    @IsNotEmpty() @IsNumber()
    driver_id: number;
}