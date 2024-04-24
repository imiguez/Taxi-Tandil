import { FC, useContext, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View,  } from "react-native";
import { SocketContext } from "../../../hooks/useSocketContext";
import { useExpoTaskManager } from "../../../hooks/useExpoTaskManager";
import { useTaxiDispatchActions } from "../../../hooks/slices/useTaxiDispatchActions";
import * as ExpoLocation from 'expo-location';
import { useSocketConnectionEvents } from "../../../hooks/useSocketConnectionEvents";
import { LocationPermissions } from "../../../utils/LocationPermissions";
import { useCommonSlice } from "../../../hooks/slices/useCommonSlice";

type AvailableBtnProps = {
    setShowPopUp: (show: boolean) => void
}

export const AvailableBtn: FC<AvailableBtnProps> = ({setShowPopUp}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const {socket, setSocket} = useContext(SocketContext)!;
    const {stopBackgroundUpdate} = useExpoTaskManager();
    const {available, setAvailable} = useTaxiDispatchActions();
    const { connectAsTaxi } = useSocketConnectionEvents();
    const { addNotification } = useCommonSlice();

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
            setSocket(undefined);
            await stopBackgroundUpdate();
            return;
        }

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
                                setLoading(false);
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
            
                        connectAsTaxi(location, () => {
                            setAvailable(true);
                            setLoading(false);
                        }, () => {
                            setAvailable(false);
                            setLoading(false);
                        });

                        return;
                    }
                }
            }
            setShowPopUp(true);
            setLoading(false);

        } catch (error) {
            setShowPopUp(true);
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={[styles.btn, {
                backgroundColor: available ? '#f95959' :  '#a5a5a5', //: '#42b883',
            }]} onPress={() => handleDisp(!available)} disabled={loading}>
                <Text>{loading ? 'Cargando...' : 'Disponible'}</Text>
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