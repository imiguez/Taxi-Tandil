export type notificationKeyType = 'User cancelled ride' | 'Taxi cancelled ride' | 'Taxi connection failed' | 'Taxi disconnected' | 'User disconnected';

export type initialCommonSliceStateType = {
    error: boolean,
    errorMessage: string | undefined,
    notifications: notificationKeyType[], 
}