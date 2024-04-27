import * as ExpoLocation from 'expo-location';

export class LocationPermissions {
    
    /**
     * Get the permission, if its not granted but can ask again then it will request the permission. Then it returns the permissions.
     * @returns {ExpoLocation.LocationPermissionResponse}
     */
    public static requestForegroundPermissions: () => Promise<ExpoLocation.LocationPermissionResponse> = async () => {
        let fgPermissions = await ExpoLocation.getForegroundPermissionsAsync();

        if (!fgPermissions.granted && fgPermissions.canAskAgain)
            fgPermissions = await ExpoLocation.requestForegroundPermissionsAsync();

        return fgPermissions;
    }
    
    /**
     * Get the permission, if its not granted but can ask again then it will request the permission. Then it returns the permissions.
     * @returns {ExpoLocation.LocationPermissionResponse}
     */
    public static requestBackgroundPermissions: () => Promise<ExpoLocation.LocationPermissionResponse> = async () => {
        let bgPermissions = await ExpoLocation.getBackgroundPermissionsAsync();
        
        if (!bgPermissions.granted && bgPermissions.canAskAgain)
            bgPermissions = await ExpoLocation.requestBackgroundPermissionsAsync();

        return bgPermissions;
    }

    public static requestGpsEnable: () => Promise<boolean> = async () => {
        // Check if gps is activated
        let provider = await ExpoLocation.hasServicesEnabledAsync();
        if (!provider) {
            // Trigger the Android pop up for gps. If its set off, it will throw an error
            await ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Highest});
        }
        return provider ?? await ExpoLocation.hasServicesEnabledAsync();
    }
}