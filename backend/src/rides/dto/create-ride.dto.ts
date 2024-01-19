import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateRideDto {
    @IsNotEmpty() @IsNumber()
    originLatitude: number;
    @IsNotEmpty() @IsNumber()
    originLongitude: number;
    @IsNotEmpty() @IsNumber()
    destinationLatitude: number;
    @IsNotEmpty() @IsNumber()
    destinationLongitude: number;

    @IsNotEmpty() @IsNumber()
    user_id: number;
    @IsNotEmpty() @IsNumber()
    driver_id: number;
}