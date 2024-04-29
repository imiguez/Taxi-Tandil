import { Dimensions } from "react-native";
import { LatLngDelta, LocationWithName } from "types/Location";
import { notificationKeyType } from "types/slices/commonSliceTypes";

export const tandilLocation: LatLngDelta = {
    latitude: -37.32167,
    longitude: -59.13316,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
}

export const rndLocation1: LocationWithName = {
    location: {
        latitude: -37.32427812304469,
        longitude: -59.14159633219242,
    },
    shortStringLocation: 'Avenida España 375',
    longStringLocation: 'Avenida España 375, Tandil, Provincia de Buenos Aires, Argentina',
}
export const rndLocation2: LocationWithName = {
    location: {
        latitude: -37.331554819241205,
        longitude: -59.12714827805757,
    },
    shortStringLocation: 'Avenida Avellaneda 960',
    longStringLocation: 'Avenida Avellaneda 960, Tandil, Provincia de Buenos Aires, Argentina',
}
export const rndLocation3: LocationWithName = {
    location: {
        latitude: -37.3225135, 
        longitude: -59.14239970000001
    }, 
    longStringLocation: "Garibaldi 388, Tandil, Provincia de Buenos Aires, Argentina", 
    shortStringLocation: "Garibaldi 388"
};

export const screenWidth = Dimensions.get("screen").width;
export const screenHeight = Dimensions.get("screen").height;
export const windowWidth = Dimensions.get("window").width;
export const windowHeight = Dimensions.get("window").height;

export const NotificationsMap: Map<notificationKeyType, string> = new Map<notificationKeyType, string>([
    ['User cancelled ride', 'El usuario canceló el viaje' ],
    ['Taxi cancelled ride', 'El taxi/remis canceló el viaje.'],
    ['Taxi connection failed', 'Hubo un error, intente nuevamente.'],
]);

export const BACKGROUND_LOCATION_TASK_NAME = "BACKGROUND_LOCATION_TASK";

export const SecureStoreItems = [
    'id',
    'firstName',
    'lastName',
    'email',
    'roles',
    'access_token',
    'refresh_token',
];

export const GOOGLE_REVERSE_GEOCODE_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json?';