import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";
import { FC, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Coords } from "utils/Coords";

export const ConfirmedRideMap: FC = () => {
    const {origin, destination, taxi} = useMapDispatchActions();
    const mapRef = useRef<MapView>(null);

    // It should only occur when the app is in the background, 
    // then the ride is completed and the user re-open the app
    if (origin == null || destination == null) return <></>;

    let originCoord = {
        latitude: origin?.location.latitude!,
        longitude: origin?.location.longitude!,
    };

    let destinationCoord = {
        latitude: destination?.location.latitude!,
        longitude: destination?.location.longitude!,
    };

    let initialRegion = Coords.calculateIntermediateCoord(originCoord, destinationCoord);

    useMemo(() => {
        if (mapRef.current) {
            if (taxi?.location) {
                mapRef.current.fitToCoordinates([origin.location, taxi.location], {
                    edgePadding: { top: 50, right: 35, bottom: 50, left: 35 }
                });
            } else {
                mapRef.current.fitToSuppliedMarkers(['origin', 'destination'], {
                    edgePadding: { top: 50, right: 35, bottom: 50, left: 35 }
                });
            }
        }
    }, [taxi]);
    
    return (
        <View style={styles.mapContainer}>
            <MapView ref={mapRef}
                style={styles.map} provider={PROVIDER_GOOGLE}
                toolbarEnabled={false}
                initialRegion={initialRegion} 
                loadingEnabled={true}
                >

                {origin?.location &&
                    <Marker identifier="origin" coordinate={{
                        latitude: origin.location.latitude,
                        longitude: origin.location.longitude,
                    }} title={origin.shortAddress} 
                    image={require("@assets/origin_map_marker.png")} />
                }

                {destination?.location &&
                    <Marker identifier="destination" coordinate={{
                        latitude: destination.location.latitude,
                        longitude: destination.location.longitude,
                    }} title={destination.shortAddress}
                    image={require("@assets/destination_map_marker.png")} />
                }

                {origin && destination && <MapViewDirections
                    origin={origin.location} destination={destination.location}
                    apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
                    strokeColor="black" strokeWidth={4}
                />}

                {taxi && taxi.location && <Marker identifier="taxi" coordinate={taxi.location} title={taxi.username ?? 'Rider'}
                    image={require("@assets/taxi_map_marker.png")} style={ taxi.carOrientation ? { transform: [{rotate: (
                        taxi.carOrientation == 'top' ? '-90deg' : (taxi.carOrientation == 'right' ? '0deg' : (
                            taxi.carOrientation == 'down' ? '90deg' : '180deg'
                        ))
                    )}] } : {}} />}

            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        flex: .7,
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