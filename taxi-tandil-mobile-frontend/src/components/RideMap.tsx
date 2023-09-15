import { FC } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { AutoCompleteAddressInput } from "./AutoCompleteAddressInput";
import { useDispatch, useSelector } from 'react-redux';
import { setOrigin, setDestination, selectOrigin } from '../../slices/rideSlice.js';
import constants from '../constants';

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

export const RideMap: FC = () => {

    const dispatch = useDispatch();
    const origin = useSelector(selectOrigin);

    return (
        <View style={styles.mapContainer}>
            <AutoCompleteAddressInput 
             dispatchAction={(location) => dispatch(setOrigin({location: location}))}
             />

            <MapView style={styles.map} provider="google" mapType="mutedStandard"
            initialRegion={{
                latitude: constants.tandilLocation.latitude,
                longitude: constants.tandilLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }}>
                {origin?.location && <Marker coordinate={{
                    latitude: origin.location.lat,
                    longitude: origin.location.lng,
                }}/>}
            </MapView>
        </View>
    );
}


const styles = StyleSheet.create({
    mapContainer: {
        width: windowWidth,
        height: '100%',
        margin: 0,
        padding: 0,
    },
    map: {
        zIndex: -1,
        width: '100%',
        height: '100%',
    },
});