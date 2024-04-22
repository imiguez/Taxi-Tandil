export type notificationKeyType = 'User cancelled ride' | 'Taxi cancelled ride';

export type initialCommonSliceStateType = {
    error: boolean,
    errorMessage: string | undefined,
    notifications: notificationKeyType[] | undefined, 
}