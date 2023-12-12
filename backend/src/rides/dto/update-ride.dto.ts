import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateRideDto {
    @IsNotEmpty() @IsBoolean()
    wasCanceled: boolean;
}