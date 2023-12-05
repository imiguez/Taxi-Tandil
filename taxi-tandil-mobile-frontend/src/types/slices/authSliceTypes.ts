export enum Roles {
    User = 'user',
    Taxi = 'taxi',
    Admin = 'admin',
}

export type initialAuthSliceStateType = {
    username: string | undefined,
    email: string | undefined,
    roles: Roles[],
    access_token: string | undefined,
    refresh_token: string | undefined,
}