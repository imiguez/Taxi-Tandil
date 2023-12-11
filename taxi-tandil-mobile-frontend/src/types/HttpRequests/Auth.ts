import { Roles } from "../slices/authSliceTypes"

type LoginPayload = {
    username: string,
    email: string,
    roles: Roles[],
}

export type LoginResponseType = {
    payload: LoginPayload,
    access_token: string,
    refresh_token: string,
}