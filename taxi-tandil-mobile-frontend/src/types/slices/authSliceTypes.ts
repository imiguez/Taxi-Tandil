export enum Roles {
    User,
    Taxi,
    Admin,
}

export type initialAuthSliceStateType = {
    username: string | null,
    email: string | null,
    roles: Roles[],
    access_token: string | null,
    refresh_token: string | null,
}

export type authData = {
    username: string,
    email: string,
    roles: Roles[],
    access_token: string,
    refresh_token: string,
}