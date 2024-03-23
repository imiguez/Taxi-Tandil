import { OmitType, PartialType } from "@nestjs/mapped-types";
import { User } from "../entities/user.entity";

export class UserDto extends PartialType(
    OmitType(User, ['password'] as const),
) {}
