export type notificationKeyType = 'User cancelled ride' | 'Taxi cancelled ride' | 'Taxi connection failed';

export type initialCommonSliceStateType = {
    error: boolean,
    errorMessage: string | undefined,
    notifications: notificationKeyType[], 
}