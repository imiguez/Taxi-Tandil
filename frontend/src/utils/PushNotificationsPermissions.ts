import { OneSignal } from 'react-native-onesignal';


export class PushNotificationsPermissions {

    public static requestPermissions = async () =>  {
        // Check the push notification permission
        const hasPushNotificationPermissions = await OneSignal.Notifications.getPermissionAsync();
        
        if (hasPushNotificationPermissions) OneSignal.User.pushSubscription.optIn();
        else OneSignal.InAppMessages.addTrigger("request_push_permissions", "true");
    }

}