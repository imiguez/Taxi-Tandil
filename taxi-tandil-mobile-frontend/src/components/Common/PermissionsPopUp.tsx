import { Button, Linking, Platform, StyleSheet, Text, View } from 'react-native'
import * as ExpoLocation from 'expo-location';
import { useMapDispatchActions } from '../../hooks/useMapDispatchActions';
import { AppState, AppStateStatus } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';


/**
 * @see link https://github.com/expo/expo/issues/16701#issuecomment-1270111253
 */
const PermissionsPopUp = () => {
    const {setPopUp} = useMapDispatchActions();
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
        let fgPermissions = await ExpoLocation.getForegroundPermissionsAsync();
        if (fgPermissions.granted) 
            setPopUp(false);
    }, [locationStatus]);

  return (
    <View style={styles.cardContainer}>
        <Text style={styles.text}>Se requiere permiso a la locación para esta funcionalidad.</Text>
        <Button title='Ir a permisos' onPress={async () => await Linking.openSettings()}></Button>
    </View>
  )
}

export default PermissionsPopUp

const styles = StyleSheet.create({
    cardContainer: {
        width: '80%',
        height: '50%',
        position: 'absolute',
        top: '20%',
        left: '10%',
        backgroundColor: 'white',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'space-around'
    },
    text: {
        fontSize: 18,
        padding: 20,
    },
});