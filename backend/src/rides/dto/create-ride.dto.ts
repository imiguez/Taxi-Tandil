import { IsDate, IsNotEmpty, IsNumber } from "class-validator";

export class CreateRideDto {
    @IsNotEmpty() @IsNumber()
    originLatitude: number;
    @IsNotEmpty() @IsNumber()
    originLongitude: number;
    @IsNotEmpty() @IsNumber()
    destinationLatitude: number;
    @IsNotEmpty() @IsNumber()
    destinationLongitude: number;
    @IsNotEmpty() @IsDate()
    acceptedTimestamp: Date;
    
    // Can be added a timestamp when driver arrives and finishes the ride.

    @IsNotEmpty() @IsNumber()
    user_id: number;
    @IsNotEmpty() @IsNumber()
    driver_id: number;
}