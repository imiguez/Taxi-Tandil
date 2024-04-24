import { FC } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useTaxiDispatchActions } from "../../../hooks/slices/useTaxiDispatchActions";
import { Coords } from "../../../utils/Coords";

export const TaxiRideMap: FC = () => {
    
    const {currentLocation, ride} = useTaxiDispatchActions();
    let initialRegion;
    // When the user cancel the ride, the ride from useTaxiDispatchActions will be null
    // and this component will still be mounted for milliseconds, so there are ride checks.
    if (ride) {
        initialRegion = Coords.calculateIntermediateCoord(ride?.origin?.location!, ride?.destination?.location!);
    }

    return (
        <View style={styles.mapContainer}>
            {currentLocation && ride &&
            <MapView
                style={styles.map} provider={PROVIDER_GOOGLE}
                toolbarEnabled={false}
                initialRegion={initialRegion} 
                loadingEnabled={true}
                >

                <Marker coordinate={{
                    latitude: ride?.origin?.location.latitude!,
                    longitude: ride?.origin?.location.longitude!,
                }} />

                <Marker coordinate={{
                    latitude: ride?.destination?.location.latitude!,
                    longitude: ride?.destination?.location.longitude!,
                }} />

                <Marker coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                }} />
            </MapView> 
            }
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        flex: .6,
        borderWidth: 0,
        borderColor: 'red',
        borderStyle: 'solid',
        margin: 0,
        padding: 0,
    },
    map: {
        width: '100%',
        height: '100%',
    },
});