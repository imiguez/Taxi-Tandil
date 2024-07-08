import { FC, useContext, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View,  } from "react-native";
import * as ExpoLocation from 'expo-location';
import { useCommonSlice } from "hooks/slices/useCommonSlice";
import { useTaxiDispatchActions } from "hooks/slices/useTaxiDispatchActions";
import { useExpoTaskManager } from "hooks/useExpoTaskManager";
import { useSocketConnectionEvents } from "hooks/useSocketConnectionEvents";
import { SocketContext } from "hooks/useSocketContext";
import { LocationPermissions } from "utils/LocationPermissions";
import { PushNotificationsPermissions } from "@utils/PushNotificationsPermissions";

type AvailableBtnProps = {
    setShowPopUp: (show: boolean) => void
}

export const AvailableBtn: FC<AvailableBtnProps> = ({setShowPopUp}) => {
    const {socket, setSocket} = useContext(SocketContext)!;
    const {stopBackgroundUpdate} = useExpoTaskManager();
    const {setRide, rideStatus} = useTaxiDispatchActions();
    const { connectAsTaxi } = useSocketConnectionEvents();
    const { addNotification, removeNotification } = useCommonSlice();

    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useMemo(() => {
        setIsConnected(socket != undefined);
    }, [socket]);

    /**
     * @see link https://docs.expo.dev/versions/latest/sdk/location/#locationreversegeocodeasynclocation-options
     */
    const handleDisp = async (available: boolean) => {
        setIsLoading(true);

        if (!available) {
            let timeout = setTimeout(() => {
                if (!available) {
                    addNotification('Taxi connection failed');
                    return;
                }
            }, 10000);
            socket!.on('disconnect', () => {
                setSocket(undefined);
                setIsLoading(false);
            });
            setRide(null, null, null);
            socket!.disconnect();
            await stopBackgroundUpdate();
            clearTimeout(timeout);
            removeNotification('Taxi connection failed');
            return;
        }
        
        await PushNotificationsPermissions.requestPermissions();

        try {
            const fgPermissions = await LocationPermissions.requestForegroundPermissions();
            if (fgPermissions.granted) {
                const bgPermissions = await LocationPermissions.requestBackgroundPermissions();
                if (bgPermissions.granted) {
                    if (await LocationPermissions.requestGpsEnable()) {
                        setShowPopUp(false);
                        
                        let currentLocation: ExpoLocation.LocationObject | undefined;
                        
                        let timeout = setTimeout(() => {
                            if (currentLocation === undefined) {
                                addNotification('Taxi connection failed');
                                return;
                            }
                        }, 10000);
                        
                        currentLocation = await ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Highest});
                        clearTimeout(timeout);

                        const location = {
                            latitude: currentLocation.coords.latitude,
                            longitude: currentLocation.coords.longitude,
                        };
            
                        connectAsTaxi(location);
                        return;
                    }
                }
            }

        } catch (error) {
            console.log(`error from AvailableBtn: ${error}`);
        } finally {
            setShowPopUp(true);
            setIsLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={[styles.btn, {
                backgroundColor: isConnected ? '#f95959' :  '#a5a5a5', //: '#42b883',
            }]} onPress={async () => handleDisp(!isConnected)} disabled={isLoading || rideStatus === 'accepted' || rideStatus === 'arrived'}>
                <Text>{isLoading ? 'Cargando...' : 'Disponible'}</Text>
            </TouchableOpacity>
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