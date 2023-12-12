import { IsNotEmpty, IsEmail, IsStrongPassword, IsString } from "class-validator";

export class SignUpDto {
    @IsNotEmpty() @IsEmail()
    email: string;
    @IsNotEmpty() @IsStrongPassword({minLength: 8, minNumbers: 1, minUppercase: 1, minLowercase: 1, minSymbols: 0})
    password: string;
    @IsNotEmpty() @IsString()
    firstName: string;
    @IsNotEmpty() @IsString()
    lastName: string;
}