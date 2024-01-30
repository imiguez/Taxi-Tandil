import { FC, useContext, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { SocketContext } from "../../hooks/useSocketContext";
import { useExpoTaskManager } from "../../hooks/useExpoTaskManager";
import { useTaxiDispatchActions } from "../../hooks/useTaxiDispatchActions";
import * as ExpoLocation from 'expo-location';

type AvailableBtnProps = {
    showPopUp: boolean,
    setShowPopUp: (show: boolean) => void
}

export const AvailableBtn: FC<AvailableBtnProps> = ({showPopUp, setShowPopUp}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const {socket} = useContext(SocketContext)!;
    const {stopBackgroundUpdate} = useExpoTaskManager();
    const {available, setAvailable} = useTaxiDispatchActions();

    /**
     * @see link https://docs.expo.dev/versions/latest/sdk/location/#locationreversegeocodeasynclocation-options
     */
    const handleDisp = async (available: boolean) => {
        setLoading(true);

        if (!available) {
            socket!.emit('leave-room', 'taxis-available');
            await stopBackgroundUpdate();
            setAvailable(false);
            setLoading(false);
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
            // Check if gps is activated
            let provider = await ExpoLocation.hasServicesEnabledAsync();
            if (!provider) {
                // Trigger the Android pop up for gps. If its set off, it will throw an error
                await ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Highest});
                setShowPopUp(true);
                setLoading(false);
                return;
            }
            setLoading(false);
            setShowPopUp(false);
            setAvailable(true);
            socket!.emit('join-room', 'taxis-available');
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
            }]} onPress={() => handleDisp(!available)}>
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