import { FC } from "react";
import { RideSelectLocations } from "../components/RideSelectLocations";
import { RideMap } from "../components/RideMap";
import { Button, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";


export const Ride: FC = () => {

    const navigation = useNavigation();

    
    return (
        <>
            <RideSelectLocations />
            <LinearGradient style={{width: '100%', height: 15, marginTop: 110, position: "absolute", zIndex: 2}}
                start={{ x: 0.0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={[0, 0.6]}
                colors={['#0000004b', 'transparent']}
            />
            <RideMap />
        </>
    )
}