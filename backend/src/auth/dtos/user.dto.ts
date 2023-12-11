import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Roles } from "src/Types/User.type";

export class UserDto {
    @IsNotEmpty() @IsNumber()
    id: number;
    @IsNotEmpty() @IsEmail()
    email: string;
    @IsNotEmpty() @IsString()
    firstName: string;
    @IsNotEmpty() @IsString()
    lastName: string;
    @IsNotEmpty() @IsArray()
    roles: Roles[];
}