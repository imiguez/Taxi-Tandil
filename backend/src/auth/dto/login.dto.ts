import { PickType } from "@nestjs/mapped-types";
import { SignUpDto } from "./sign-up.dto";
import { IsNotEmpty } from "class-validator";

export class LoginDto extends PickType(SignUpDto, ['email'] as const) {
    @IsNotEmpty()
    password: string;
}