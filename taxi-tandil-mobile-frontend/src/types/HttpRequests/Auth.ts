import { RolesType } from "../slices/authSliceTypes";

type LoginPayload = {
    username: string,
    email: string,
    roles: RolesType[],
}

export type LoginResponseType = {
    payload: LoginPayload,
    access_token: string,
    refresh_token: string,
}