import { FC, useContext, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View,  } from "react-native";
import * as ExpoLocation from 'expo-location';
import { useCommonSlice } from "hooks/slices/useCommonSlice";
import { useTaxiDispatchActions } from "hooks/slices/useTaxiDispatchActions";
import { useExpoTaskManager } from "hooks/useExpoTaskManager";
import { useSocketConnectionEvents } from "hooks/useSocketConnectionEvents";
import { SocketContext } from "hooks/useSocketContext";
import { LocationPermissions } from "utils/LocationPermissions";
import { OneSignal } from "react-native-onesignal";

type AvailableBtnProps = {
    setShowPopUp: (show: boolean) => void
}

export const AvailableBtn: FC<AvailableBtnProps> = ({setShowPopUp}) => {
    const {socket, setSocket} = useContext(SocketContext)!;
    const {stopBackgroundUpdate} = useExpoTaskManager();
    const {available, setAvailable, setRide, rideStatus} = useTaxiDispatchActions();
    const { connectAsTaxi } = useSocketConnectionEvents();
    const { addNotification, removeNotification, pushNotificationsPermissionAlreadyRequested, setPushNotificationsPermissionAlreadyRequested } = useCommonSlice();

    useEffect(() => {
        setAvailable(socket != undefined);
    }, [socket]);

    const beforeHandleDisp = async (available: boolean) => {
        setAvailable('loading');
        if (!available) {
            await handleDisp(available);
            return;
        }
        // Check the push notification permission
        let hasPushNotificationPermissions = await OneSignal.Notifications.getPermissionAsync();
        console.log(hasPushNotificationPermissions, pushNotificationsPermissionAlreadyRequested, available);
        if (!hasPushNotificationPermissions && !pushNotificationsPermissionAlreadyRequested) {
          OneSignal.InAppMessages.addTrigger("driver_attempt_being_available", "true");
          setPushNotificationsPermissionAlreadyRequested(true);
          OneSignal.InAppMessages.addEventListener('click', (event) => {
            setAvailable(false);
          });
        } else {
          if (hasPushNotificationPermissions) {
            OneSignal.User.pushSubscription.optIn();
          } else {
            OneSignal.User.pushSubscription.optOut();
          }
          await handleDisp(available);
        }
    }

    /**
     * @see link https://docs.expo.dev/versions/latest/sdk/location/#locationreversegeocodeasynclocation-options
     */
    const handleDisp = async (available: boolean) => {
        if (!available) {
            let timeout = setTimeout(() => {
                if (!available) {
                    setAvailable(false);
                    addNotification('Taxi connection failed');
                    return;
                }
            }, 10000);
            socket!.on('disconnect', () => {
                setSocket(undefined);
                setAvailable(false)
            });
            setRide(null, null, null);
            socket!.disconnect();
            await stopBackgroundUpdate();
            clearTimeout(timeout);
            removeNotification('Taxi connection failed');
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
                                setAvailable(false)
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
                        }, () => {
                            setAvailable(false);
                        });
                        removeNotification('Taxi connection failed');
                        return;
                    }
                }
            }
            setShowPopUp(true);
            setAvailable(!available);

        } catch (error) {
            setShowPopUp(true);
            setAvailable(!available);
        }
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={[styles.btn, {
                backgroundColor: available === true ? '#f95959' :  '#a5a5a5', //: '#42b883',
            }]} onPress={() => beforeHandleDisp(!available)} disabled={available==='loading' || rideStatus != null}>
                <Text>{available==='loading' ? 'Cargando...' : 'Disponible'}</Text>
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