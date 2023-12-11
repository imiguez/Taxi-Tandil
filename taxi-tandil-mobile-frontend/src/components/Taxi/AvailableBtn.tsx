import { FC, useContext, useEffect, useState } from "react";
import { Button, Linking, StyleSheet, Text, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { SocketContext } from "../../hooks/useSocketContext";
import { useExpoTaskManager } from "../../hooks/useExpoTaskManager";
import { useTaxiDispatchActions } from "../../hooks/useTaxiDispatchActions";

export const AvailableBtn: FC = () => {
    
    const [needPermissions, setNeedPermissions] = useState<boolean>(false);
    const {socket} = useContext(SocketContext);
    const {requestForegroundPermissions, requestBackgroundPermissions,
        stopBackgroundUpdate, startLocationCheck} = useExpoTaskManager();
    const {available, setAvailable} = useTaxiDispatchActions();

    useEffect(() => {
        const onTaxiLocationChecked = async () => {
            setNeedPermissions(false);
            setAvailable(true);
            socket!.emit('join-room', 'taxis-available');
        }
        socket!.on('taxi-has-location-activated', onTaxiLocationChecked);
        return () => {
            socket!.off('taxi-has-location-activated', onTaxiLocationChecked);
        }
    }, []);

    const handleDisp = async (available: boolean) => {
        if (!available) {
            await stopBackgroundUpdate();
            return;
        }
        setNeedPermissions(true);
        const fgPermissions = await requestForegroundPermissions();
        const bgPermissions = await requestBackgroundPermissions();
        if (fgPermissions && fgPermissions.granted && 
            bgPermissions && bgPermissions.granted) {
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