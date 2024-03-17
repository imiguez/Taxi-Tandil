import { FC, useContext, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { RideMap } from "../../components/NewRide/RideMap";
import { RideSelectLocations } from "../../components/NewRide/RideSelectLocations";
import { SocketContext } from "../../hooks/useSocketContext";
import { LinearGradient } from "expo-linear-gradient";
import NewRideBtn from "../../components/NewRide/NewRideBtn";
import TaxiCantRequestRidePopUp from "../../components/Common/TaxiCantRequestRidePopUp";

export const NewRide: FC = () => {

    const {setSelectInMap} = useMapDispatchActions();
    const {socket} = useContext(SocketContext)!;
    
    useEffect(() => {
        return () => {
            setSelectInMap(false);
        }
    }, []);


    return (
        <>
            {socket == undefined ? <Text>Problema de conexion..</Text>
            : (
                (socket.auth.role == 'taxi') ? 
                <TaxiCantRequestRidePopUp />
                :
                <View style={styles.container}>
                    <RideSelectLocations />
                    <LinearGradient style={{width: '100%', height: 15, marginTop: 110, position: "absolute", zIndex: 2}}
                        locations={[0, 0.6]}
                        colors={['#0000004b', 'transparent']}
                    />
                    <RideMap />
                    <NewRideBtn />
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});