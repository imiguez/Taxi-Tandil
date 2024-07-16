import { tandilLocation } from "@constants/index";
import { useTaxiDispatchActions } from "hooks/slices/useTaxiDispatchActions";
import { FC, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

export const TaxiRideMap: FC = () => {
    const mapRef = useRef<MapView>(null);
    const {currentLocation, ride, rideStatus} = useTaxiDispatchActions();

    useMemo(() => {
        if (mapRef.current) {
            if (ride && ride.origin?.location && ride.destination?.location) {
                let coords = [ride.origin.location, ride.destination.location];
                if (currentLocation) coords.push(currentLocation);
                mapRef.current.fitToCoordinates(coords, {
                    edgePadding: { top: 35, right: 35, bottom: 100, left: 35 }
                });
            }
        }
    }, [currentLocation]);

    return (
        <View style={styles.mapContainer}>
            {currentLocation && ride &&
            <MapView ref={mapRef}
                style={styles.map} provider={PROVIDER_GOOGLE}
                toolbarEnabled={false}
                initialRegion={tandilLocation} 
                loadingEnabled={true}
                >

                <Marker coordinate={{
                    latitude: ride?.origin?.location.latitude!,
                    longitude: ride?.origin?.location.longitude!,
                }} image={require("@assets/origin_map_marker.png")} />

                <Marker coordinate={{
                    latitude: ride?.destination?.location.latitude!,
                    longitude: ride?.destination?.location.longitude!,
                }} image={require("@assets/destination_map_marker.png")} />

                <MapViewDirections
                    origin={ride?.origin?.location} destination={ride?.destination?.location}
                    apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
                    strokeColor="#ef5a5a" strokeWidth={4}
                />

                {(rideStatus == 'being-requested' || rideStatus == 'accepted') && <MapViewDirections
                    origin={currentLocation} destination={ride?.origin?.location}
                    apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
                    strokeColor="black" strokeWidth={4}
                />}


                <Marker coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                }} image={require("@assets/taxi_map_marker.png")} />
            </MapView> 
            }
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
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