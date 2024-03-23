import { IsNotEmpty, IsNumber } from 'class-validator';
import { Ride } from '../entities/ride.entity';
import { PartialType, PickType } from '@nestjs/mapped-types';

export class UpdateRideDto extends PartialType(
    PickType(Ride, ['wasCanceled', 'arrivedTimestamp', 'finishedTimestamp'] as const),
) {
    @IsNotEmpty() @IsNumber()
    id: number
}