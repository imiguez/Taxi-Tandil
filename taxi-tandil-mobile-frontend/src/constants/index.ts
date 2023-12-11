import { Dimensions } from "react-native";

const constants = {
    tandilLocation: {
        latitude: -37.32167,
        longitude: -59.13316,
    },
    rndLocation1: {
        location: {
            latitude: -37.32427812304469,
            longitude: -59.14159633219242,
        },
        shortStringLocation: 'Avenida España 375',
        longStringLocation: 'Avenida España 375, Tandil, Provincia de Buenos Aires, Argentina',
    },
    rndLocation2: {
        location: {
            latitude: -37.331554819241205,
            longitude: -59.12714827805757,
        },
        shortStringLocation: 'Avenida Avellaneda 960',
        longStringLocation: 'Avenida Avellaneda 960, Tandil, Provincia de Buenos Aires, Argentina',
    },
    rndLocation3: {
        location: {
            latitude: -37.3225135, 
            longitude: -59.14239970000001
        }, 
        longStringLocation: "Garibaldi 388, Tandil, Provincia de Buenos Aires, Argentina", 
        shortStringLocation: "Garibaldi 388"
    },
    screenWidth: Dimensions.get("screen").width,
    screenHeight: Dimensions.get("screen").height,
    windowWidth: Dimensions.get("window").width,
    windowHeight: Dimensions.get("window").height,
};

export const API_BASE_URL = "http://192.168.0.187:3000";
export const WS_URL = "http://192.168.0.187:2000";
export const BACKGROUND_LOCATION_TASK_NAME = "BACKGROUND_LOCATION_TASK";
export const CHECK_LOCATION_ACTIVE = "CHECK_LOCATION_ACTIVE";

export default constants;