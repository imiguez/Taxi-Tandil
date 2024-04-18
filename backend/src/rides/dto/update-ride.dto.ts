import { Ride } from '../entities/ride.entity';
import { PartialType, PickType } from '@nestjs/mapped-types';

export class UpdateRideDto extends PartialType(
    PickType(Ride, ['wasCancelled', 'cancellationReason', 'arrivedTimestamp', 'finishedTimestamp'] as const),
) {}