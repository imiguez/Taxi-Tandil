export const Roles = {
    User: {
        id: 1,
        name: 'user',
    },
    Taxi: {
        id: 2,
        name: 'taxi',
    },
}

export type RolesType = {
    'id': number,
    'name': string,
}

export type initialAuthSliceStateType = {
    id: string | undefined,
    firstName: string | undefined,
    lastName: string | undefined,
    email: string | undefined,
    roles: RolesType[],
    access_token: string | undefined,
    refresh_token: string | undefined,
}