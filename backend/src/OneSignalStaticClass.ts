import * as OneSignal from '@onesignal/node-onesignal';
import { DefaultApi } from '@onesignal/node-onesignal';
import { AndroidChannels, EmailNotification, NotifiationRecipients, PushNotification, TemplateNames } from './types/notifications.type';


export class OneSignalStaticClass {
    // Singleton
    private static client: DefaultApi | undefined;
    private static androidChannels: Map<AndroidChannels, string> = new Map();
    private static templates: Map<TemplateNames, string> = new Map();


    public static init = () => {
        this.setClient();
        this.androidChannels.set('Ride state', process.env.ONE_SIGNAL_ANDROID_CHANNEL_RIDE_STATE!);
        this.androidChannels.set('Login detection', process.env.ONE_SIGNAL_ANDROID_CHANNEL_LOGIN_DETECTION!);
        this.templates.set('Email:Sign up', process.env.ONE_SIGNAL_SIGN_UP_EMAIL_TEMPLATE!);
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

    private static handleNotificationRecipients = (notification: OneSignal.Notification, recipients: NotifiationRecipients) => {
        if (recipients.external_ids) notification.include_aliases = {"external_id": recipients.external_ids};
        if (recipients.subscription_ids) notification.include_subscription_ids = recipients.subscription_ids;
    }

    public static createPushNotification = async (configs: PushNotification) => {
        let notification = new OneSignal.Notification();
        notification.app_id = process.env.ONE_SIGNAL_APP_ID!;
        
        OneSignalStaticClass.handleNotificationRecipients(notification, configs.recipients);

        notification.target_channel = "push";
        notification.android_channel_id = this.androidChannels.get(configs.android_channel);

        notification.headings = configs.title;
        if (configs.content) notification.contents = configs.content;

        notification.is_android = true;
        notification.is_ios = true;

        return await this.getClient().createNotification(notification);
    }

    public static createEmailNotification = async (configs: EmailNotification) => {
        let notification = new OneSignal.Notification();
        notification.app_id = process.env.ONE_SIGNAL_APP_ID!;
        
        OneSignalStaticClass.handleNotificationRecipients(notification, configs.recipients);

        notification.target_channel = "email";
        notification.include_unsubscribed = true;
        notification.template_id = configs.template_name ? this.templates.get(configs.template_name) : undefined;
        notification.custom_data = configs.custom_data;
        
        return await this.getClient().createNotification(notification);
    }

    public static getSubscriptionsFromUserByExternalId = async (id: string): Promise<OneSignal.Subscription[] | undefined> => {
        const user = await this.getClient().getUser(process.env.ONE_SIGNAL_APP_ID!, 'external_id', id);
        return user.subscriptions;
    }

    /**
     * Should be used only when deleting the account.
     * @param id 
     */
    public static deleteUserByExternalId = async(id: string) => {
        await this.getClient().deleteUser(process.env.ONE_SIGNAL_APP_ID!, 'external_id', id);
    }
    
    /**
     * Should be used only when deleting the account.
     * @param id
     * @param exceptions 
     */
    public static deleteSubscriptionsFromUserByExternalId = async (id: string, exceptions?: string[]) => {
        const subs = (await this.getSubscriptionsFromUserByExternalId(id)) ?? [];
        subs.forEach(async (sub) => {
            if (sub.id) {
                if (!exceptions || !exceptions.find((e) => e === sub.id)) await this.deleteSubscriptionById(sub.id);
            }
        });
    }

    public static deleteSubscriptionById = async(id: string) => {
        await this.getClient().deleteSubscription(process.env.ONE_SIGNAL_APP_ID!, id);
    }
}