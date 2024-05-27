import * as OneSignal from '@onesignal/node-onesignal';
import { DefaultApi } from '@onesignal/node-onesignal';
import { AndroidChannels, PushNotification } from './Types/Notifications.type';


export class OneSignalStaticClass {
    // Singleton
    private static client: DefaultApi | undefined;
    private static androidChannels: Map<AndroidChannels, string> = new Map();


    public static init = () => {
        this.setClient();
        this.androidChannels.set('Ride state', process.env.ONE_SIGNAL_ANDROID_CHANNEL_RIDE_STATE!);
    }

    public static setClient = () => {
        const configuration = OneSignal.createConfiguration({
            userAuthKey: process.env.ONE_SIGNAL_APP_ID!,
            restApiKey: process.env.ONE_SIGNAL_REST_API_ID!,
        });
        return this.client = new OneSignal.DefaultApi(configuration);
    }

    public static getClient = () => {
        return this.client ?? this.setClient();
    }

    public static createNotification = async (configs: PushNotification) => {
        let notification = new OneSignal.Notification();
        notification.app_id = process.env.ONE_SIGNAL_APP_ID!;
        
        notification.include_aliases = {"external_id": [configs.to]};
        notification.target_channel = "push";
        notification.android_channel_id = this.androidChannels.get(configs.android_channel);

        notification.headings = configs.title;
        if (configs.content) notification.contents = configs.content;

        notification.is_android = true;
        notification.is_ios = true;

        return await this.getClient().createNotification(notification);
    }

}