import { FC, useContext } from "react";
import { StyleSheet, View } from "react-native";
import constants from "../../constants";
import { ConfirmedRideMap } from "../../components/ConfirmedRide/ConfirmedRideMap";
import { ConfirmedRideCard } from "../../components/ConfirmedRide/ConfirmedRideCard";
import { LinearGradient } from "expo-linear-gradient";
import { SocketContext } from "../../hooks/useSocketContext";


export const ConfirmedRide: FC = () => {
    const {socket} = useContext(SocketContext)!;
    // <LinearGradient style={styles.shadow}
    //     locations={[0, 1]}
    //     colors={['transparent', '#0000006b']}
    // />
    return (
        <View style={styles.mainContainer}>
            {(socket != undefined) && 
                <>
                    <ConfirmedRideMap />
                    <ConfirmedRideCard />
                </>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    shadow: {
        width: '100%', 
        height: 40, 
        position: 'absolute', 
        bottom: (constants.windowHeight*.45) - 30,
    }
});