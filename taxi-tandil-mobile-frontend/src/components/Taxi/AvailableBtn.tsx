import { FC, useContext, useEffect, useMemo, useState } from "react";
import { Button, Linking, PermissionsAndroid, StyleSheet, Text, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { SocketContext } from "../../hooks/useSocketContext";
import { useExpoTaskManager } from "../../hooks/useExpoTaskManager";
import * as ExpoLocation from 'expo-location';
import constants from "../../constants";


export const AvailableBtn: FC = () => {
    
    const [needPermissions, setNeedPermissions] = useState<boolean>(false);
    const [available, setAvailable] = useState<boolean>(false);
    const socket = useContext(SocketContext);
    const {checkForegroundPermissions, checkBackgroundPermissions, startBackgroundUpdate, stopBackgroundUpdate,
        startLocationCheck} = useExpoTaskManager();

    useEffect(() => {
        const onTaxiLocationChecked = async () => {
            setNeedPermissions(false);
            socket.emit('join-room', 'taxis-available');
        }
        socket.on('taxi-has-location-activated', onTaxiLocationChecked);
        return () => {
            socket.off('taxi-has-location-activated', onTaxiLocationChecked);
        }
    }, []);

    const handleDisp = async (available: boolean) => {
        if (!available) {
            await stopBackgroundUpdate();
            return;
        }
        setNeedPermissions(true);
        const fgPermissions = await ExpoLocation.requestForegroundPermissionsAsync();
        const bgPermissions = await ExpoLocation.requestBackgroundPermissionsAsync();
        if (fgPermissions.granted && bgPermissions.granted) {
            if (await ExpoLocation.hasStartedLocationUpdatesAsync(constants.CHECK_LOCATION_ACTIVE)) {
                console.log('startLocationCheck already started');
                await ExpoLocation.stopLocationUpdatesAsync(constants.CHECK_LOCATION_ACTIVE);
            }
            await startLocationCheck();
        }
    }

    return (
        <View>
            <TouchableHighlight style={[styles.touch, {
                backgroundColor: available ? '#f95959' :  '#a5a5a5' //: '#42b883',
            }]} 
            onPress={() => handleDisp(!available)}
            >
                <Text>Disponible</Text>
            </TouchableHighlight>
            { needPermissions &&
                <View>
                    <Text>Para estar disponible debes tener la ubicación activada y haber permitido el permiso 'Allow All the Time'.</Text>
                    <Button title="Checkear Permisos" onPress={() => Linking.openSettings()}/>
                </View>
            }
            <Button title="Foreground State" onPress={async () => console.log(await checkForegroundPermissions())} />
            <Button title="Background State" onPress={async () => console.log(await checkBackgroundPermissions())} />
        </View>
    );
}

const styles = StyleSheet.create({
    touch: {
        width: '70%', 
        height: 80, 
        elevation: 5,
        borderRadius: 5,
        borderTopWidth: 0,
        borderStyle: 'solid',
        borderColor: 'red',
        marginLeft: '15%',
        justifyContent: 'center',
        alignItems: 'center'
    }
});