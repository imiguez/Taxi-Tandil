import * as OneSignal from '@onesignal/node-onesignal';

export type AndroidChannels = 'Ride state';

export type PushNotification = {
    to: string, 
    title: OneSignal.LanguageStringMap, 
    content?: OneSignal.LanguageStringMap,
    android_channel: AndroidChannels,
    data?: object,
    app_url?: string,
}