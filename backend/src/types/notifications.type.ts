import * as OneSignal from '@onesignal/node-onesignal';

export type TemplateNames = 'Email:Sign up';

export type AndroidChannels = 'Ride state' | 'Login detection';




export interface NotifiationRecipients {
    external_ids?: string[],
    subscription_ids?: string[],
}

interface BaseNotification  {
    recipients: NotifiationRecipients, 
    template_name?: TemplateNames,
}

export interface PushNotification extends BaseNotification {
    title: OneSignal.LanguageStringMap, 
    content?: OneSignal.LanguageStringMap,
    android_channel: AndroidChannels,
    data?: object | undefined,
    app_url?: string,
}

export interface EmailNotification extends BaseNotification {
    custom_data: object | undefined,
}