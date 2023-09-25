import { FC, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { AutoCompleteAddressInput } from "./AutoCompleteAddressInput";
import { useDispatch, useSelector } from 'react-redux';
import { setOrigin, setDestination, selectOrigin, selectDestination, Location, selectCurrentComponent } from '../../slices/rideSlice';
import constants from '../constants';
import {LinearGradient} from 'expo-linear-gradient';
import { useMapDispatchActions } from "../hooks/useMapDispatchActions";

type stateProps = {
    currentState: 'origin' | 'destination' | 'confirming',
}

export const RideMap: FC = () => {

    const {origin, destination, setLocation} = useMapDispatchActions();


    return (
        <View style={styles.mapContainer}>
            {/* <View style={styles.inputContainer}> */}
                
                {/* {currentComponent == 'origin' && false && <AutoCompleteAddressInput
                 placeholder="Punto de partida..." set='origin' />}
                
                {currentComponent == 'destination' && false && <AutoCompleteAddressInput
                 placeholder="A dónde te dirigís?..." set='destination' />} */}

                {/* {currentComponent == 'confirming' && 
                <ConfirmRideCard 
                
                />} */}

                {/* <LinearGradient style={styles.shadow}
                    start={{ x: 0.0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    locations={[0, 0.6]}
                    colors={['#0000004b', '#00000000']}
                /> */}
            {/* </View> */}
            <MapView style={styles.map} provider="google" mapType="mutedStandard"
                toolbarEnabled={false}
                initialRegion={{
                    latitude: constants.tandilLocation.latitude,
                    longitude: constants.tandilLocation.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}>
                {origin?.location && <Marker coordinate={{
                    latitude: origin.location.lat,
                    longitude: origin.location.lng,
                }} title={origin.shortStringLocation}/>}

                {destination?.location && <Marker coordinate={{
                    latitude: destination.location.lat,
                    longitude: destination.location.lng,
                }} title={destination.shortStringLocation}/>}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        width: constants.screenWidth,
        height: '100%',
        margin: 0,
        padding: 0,
    },
    map: {
        zIndex: -1,
        width: '100%',
        height: '100%',
    },
    inputContainer: {
        position: 'absolute',
        // zIndex: 1,
        width: '100%',
    },
    shadow: {
        width: '100%',
        height: 15,
    }
});