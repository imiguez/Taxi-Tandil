import { FC, useContext, useState } from "react";
import { Platform, StyleSheet, Text, TouchableHighlight, View } from "react-native";
import { SocketContext } from "../../hooks/useSocketContext";
import { useExpoTaskManager } from "../../hooks/useExpoTaskManager";
import { useTaxiDispatchActions } from "../../hooks/useTaxiDispatchActions";
import * as ExpoLocation from 'expo-location';
import { io } from "socket.io-client";
import { useAuthDispatchActions } from "../../hooks/useAuthDispatchActions";

type AvailableBtnProps = {
    setShowPopUp: (show: boolean) => void
}

export const AvailableBtn: FC<AvailableBtnProps> = ({setShowPopUp}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const {socket} = useContext(SocketContext)!;
    const {stopBackgroundUpdate} = useExpoTaskManager();
    const {available, setAvailable} = useTaxiDispatchActions();
    const {accessToken, id} = useAuthDispatchActions();
    const {setSocket} = useContext(SocketContext)!;

    /**
     * @see link https://docs.expo.dev/versions/latest/sdk/location/#locationreversegeocodeasynclocation-options
     */
    const handleDisp = async (available: boolean) => {
        setLoading(true);

        if (!available) {
            socket!.on('disconnect', () => {
                setAvailable(false)
                setLoading(false);
            });
            socket!.disconnect();
            await stopBackgroundUpdate();
            return;
        }
        
        if (Platform.OS === 'android') { // Checks only in android.
            const fgPermissions = await ExpoLocation.getForegroundPermissionsAsync();
            if (!fgPermissions.granted) {
                if (!fgPermissions.canAskAgain) {
                    setShowPopUp(true);
                    setLoading(false);
                    return;
                }
                
                const newFgPermissions = await ExpoLocation.requestForegroundPermissionsAsync();
                if (!newFgPermissions.granted) {
                    setShowPopUp(true);
                    setLoading(false);
                    return;
                }
            }
            const bgPermissions = await ExpoLocation.requestBackgroundPermissionsAsync();
            if (!bgPermissions.granted) {
                if (!bgPermissions.canAskAgain) {
                    setShowPopUp(true);
                    setLoading(false);
                    return;
                }
                
                const newBgPermissions = await ExpoLocation.requestBackgroundPermissionsAsync();
                if (!newBgPermissions.granted) {
                    setShowPopUp(true);
                    setLoading(false);
                    return;
                }
            }
            
        } else { // If Platform.IOS
            let fgPermissions = await ExpoLocation.requestForegroundPermissionsAsync();
            let bgPermissions = await ExpoLocation.requestBackgroundPermissionsAsync();
            if (!fgPermissions.granted || !bgPermissions.granted) {
                setShowPopUp(true);
                setLoading(false);
                return;
            }
        }
        try {
            let currentLocation;
            // Check if gps is activated
            let provider = await ExpoLocation.hasServicesEnabledAsync();
            if (!provider) {
                // Trigger the Android pop up for gps. If its set off, it will throw an error
                currentLocation = await ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Highest});
                setShowPopUp(true);
                setLoading(false);
                return;
            }
            setShowPopUp(false);

            if (currentLocation == undefined)
                currentLocation = await ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Highest});

            let location = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            };

            const socket = io(process.env.EXPO_PUBLIC_WS_URL!, {
                auth: {
                    token: `Bearer ${accessToken}`,
                    apiId: id,
                    role: 'taxi',
                    location: location,
                },
                transports: ['websocket'],
            });
            socket.on('connect_error', (error) => {
                console.log('Error from socket.');
                console.log(error);
                setAvailable(false);
                setLoading(false);
                throw error;
            });
            socket.on('connect', () => {
                // Socket connection established, update socket context.
                setSocket(socket);
                setAvailable(true);
                setLoading(false);
                console.log('socket setted: '+ socket != undefined);
            });
        } catch (error) {
            setShowPopUp(true);
            setLoading(false);
            console.log(error);
        }
    }

    return (
        <View style={styles.container}>
            <TouchableHighlight style={[styles.btn, {
                backgroundColor: available ? '#f95959' :  '#a5a5a5', //: '#42b883',
            }]} onPress={() => handleDisp(!available)} disabled={loading}>
                <Text>{loading ? 'Cargando...' : 'Disponible'}</Text>
            </TouchableHighlight>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        width: '70%', 
        left: '15%',
    },
    btn: {
        width: '100%', 
        minHeight: 80,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'blue'
    },
});