import { FC } from "react";
import { Keyboard, Linking, StyleSheet, Text, TouchableHighlight } from "react-native";
import * as ExpoLocation from 'expo-location';
import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";
import { Coords } from "utils/Coords";

type CurrentLocationInBetweenCompoProps = {
    set: 'origin' | 'destination',
}

export const CurrentLocationInBetweenCompo: FC<CurrentLocationInBetweenCompoProps> = ({
    set,
}) => {

    const {setLocation} = useMapDispatchActions();
    const [status, requestPermission, getForegroundPermissions] = ExpoLocation.useForegroundPermissions();

    const onPressedBtn = async () => {
        Keyboard.dismiss();
        // If the status is denied then the user has to choose an option from location settings
        let permissions = await getForegroundPermissions();
        if (permissions.status == 'denied') {
            Linking.openSettings();
            return;
        }

        try {
            let permissionsResponse = await requestPermission();
            if (permissionsResponse.status !== 'granted') {
            console.log('Permission to access location was denied');
            return;
            }
            let location = await Coords.getFullCurrentPosition();
            if (location == null) {
                console.log(`Error: Current Location is null`);
                return;
            }
            setLocation(location, set);
        } catch (e) {
            console.log("RequestPermissions: "+e);
        };
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