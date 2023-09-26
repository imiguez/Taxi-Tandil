import { FC } from "react";
import { Linking, StyleSheet, Text, TouchableHighlight } from "react-native";
import { useMapDispatchActions } from "../hooks/useMapDispatchActions";
import * as ExpoLocation from 'expo-location';

type CurrentLocationInBetweenCompoProps = {
    set: 'origin' | 'destination',
}

export const CurrentLocationInBetweenCompo: FC<CurrentLocationInBetweenCompoProps> = ({
    set,
}) => {

    const {setLocation} = useMapDispatchActions();
    const [status, requestPermission, getForegroundPermissions] = ExpoLocation.useForegroundPermissions();

    const onPressedBtn = async () => {
        // If the status is denied then the user has to choose an option from location settings
        let permissions = await getForegroundPermissions();
        if (permissions.status == 'denied') {
            Linking.openSettings();
            return;
        }

        requestPermission().then((permissionsResponse) => {
            if (permissionsResponse.status !== 'granted') {
              console.log('Permission to access location was denied');
              return;
            }
            ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Highest}).then((currentLocation) => {
                let param: Pick<ExpoLocation.LocationGeocodedLocation, "latitude" | "longitude"> = {
                    latitude: currentLocation.coords.latitude, 
                    longitude: currentLocation.coords.longitude
                };

                ExpoLocation.reverseGeocodeAsync(param).then((value) => {
                    let longStringLocationValue = `${value[0].street} ${value[0].streetNumber}, ${value[0].city}, ${value[0].region}, ${value[0].country}`;
                    console.log(longStringLocationValue);
                    console.log(currentLocation.coords.latitude +", "+currentLocation.coords.longitude);
                    let location = {
                        location: {
                            lat: currentLocation.coords.latitude,
                            lng: currentLocation.coords.longitude,
                        },
                        longStringLocation: longStringLocationValue,
                        shortStringLocation: "Ubicación actual",
                    }

                    setLocation(location, set);
                }).catch((e) => console.log("reverseGeocodeAsync: "+e));
            }).catch((e) => console.log("getCurrentPositionAsync: "+e));
        }).catch((e) => console.log("RequestPermissions: "+e));
    }

    return (
        <TouchableHighlight style={styles.container} onPress={onPressedBtn} >
            <Text style={styles.text}>Ubicación actual</Text>
        </TouchableHighlight>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 13,
        alignItems: 'center',
        minHeight: 70,
        // minHeight: 44,
        flexDirection: 'row',
        width: '100%',
        borderBottomWidth: 1,
        borderColor: '#c8c7cc',
        borderStyle: 'solid',
    },
    text: {
        fontSize: 18,
        fontWeight: '700',
    }
});