import { Button, Linking, Modal, StyleSheet, Text, View } from 'react-native'
import * as ExpoLocation from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import GenericCancelBtn from './GenericCancelBtn';
import PermissionsBtn from './PermissionsBtn';

type PermissionsPopUpProps = {
    close: () => void,
    text: string,
    permissionType: 'foreground' | 'background'
}

/**
 * @see link https://github.com/expo/expo/issues/16701#issuecomment-1270111253
 */
const PermissionsPopUp: FC<PermissionsPopUpProps> = ({close, text, permissionType}) => {
    const appState = useRef(AppState.currentState);
    const [locationStatus, setLocationStatus] = useState<ExpoLocation.LocationPermissionResponse>();

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
          subscription.remove();
        };
    }, []);

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            setLocationStatus(await ExpoLocation.getForegroundPermissionsAsync());
        }
        appState.current = nextAppState;
    };

    useMemo(async () => {
        let gpsActivated = await ExpoLocation.hasServicesEnabledAsync();
        if (!gpsActivated)
            return;
        let fgPermissions = await ExpoLocation.getForegroundPermissionsAsync();
        if (fgPermissions.granted && permissionType == 'foreground')
            close();
        if (fgPermissions.granted && permissionType == 'background') {
            let bgPermissions = await ExpoLocation.getBackgroundPermissionsAsync();
            if (bgPermissions.granted)
                close();
        }
    }, [locationStatus]);

  return (
    <Modal animationType='slide' transparent onRequestClose={close}>
        <View style={styles.cardContainer}>
            <Text style={styles.text}>{text}</Text>
            <View style={styles.btnsContainer}>
                <GenericCancelBtn onPress={close}/>
                <PermissionsBtn onPress={async () => {
                    try {
                        let gpsActivated = await ExpoLocation.hasServicesEnabledAsync();
                        if (gpsActivated)
                            await Linking.openSettings()
                        else
                            await ExpoLocation.getCurrentPositionAsync().catch();
                    } catch(e) {}
                }} text='Activar permisos'/>
            </View>
        </View>
    </Modal>
  )
}

export default PermissionsPopUp

const styles = StyleSheet.create({
    cardContainer: {
        width: '80%',
        height: '50%',
        position: 'absolute',
        top: '25%',
        left: '10%',
        backgroundColor: 'white',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderColor: 'gray',
        borderStyle: 'solid',
        borderWidth: 1,
        padding: 10,
    },
    text: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingTop: 40
    },
    btnsContainer: {
        width: '90%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 20,
    }
});