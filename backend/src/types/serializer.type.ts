import { Role } from "src/users/entities/role.entity";


export interface UserToSerialize {
    firstName: string,
    lastName: string,
    roles: Role[];
    email: string;
}

export interface Session {
    user: UserToSerialize | null,
    access_token: string | null,
    refresh_token: string | null,
    exp_date_in_ms: number | null,
}

export const EmptySession: Session = {
    user: null,
    access_token: null,
    refresh_token: null,
    exp_date_in_ms: null
}