import { FC, useContext } from "react";
import { StyleSheet, View } from "react-native";
import { ConfirmedRideMap } from "../../components/ConfirmedRide/ConfirmedRideMap";
import { ConfirmedRideCard } from "../../components/ConfirmedRide/ConfirmedRideCard";
import { SocketContext } from "../../hooks/useSocketContext";


export const ConfirmedRide: FC = () => {
    const {socket} = useContext(SocketContext)!;
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
});