import { FC, useContext, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { MapMarker, Marker } from "react-native-maps";
import { useCoords } from "../../hooks/useCoords";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { SocketContext } from "../../hooks/useSocketContext";
import { LatLng } from "../../types/Location";

export const ConfirmedRideMap: FC = () => {
    const {origin, destination} = useMapDispatchActions();
    const socket = useContext(SocketContext);
    const {calculateIntermediateCoord} = useCoords();
    const [taxi, setTaxi] = useState<{
        location: LatLng,
        name: string,
    } | null>(null);

    useEffect(() => {
        const onTaxiUpdate = (location: LatLng, name: string) => {
            setTaxi({
                location: location,
                name: name
            });
        }
        socket.on('location-update-from-taxi', onTaxiUpdate);
        
        return () => {
            socket.off('location-update-from-taxi', onTaxiUpdate);
        }
    }, []);

    let originCoord = {
        latitude: origin?.location.latitude!,
        longitude: origin?.location.longitude!,
    };
    let destinationCoord = {
        latitude: destination?.location.latitude!,
        longitude: destination?.location.longitude!,
    };

    let middleCoord = calculateIntermediateCoord(originCoord, destinationCoord);

    let initialRegion = {
        latitude: middleCoord.latitudIntermedia,
        longitude: middleCoord.longitudIntermedia,
        latitudeDelta: middleCoord.latDelta,
        longitudeDelta: middleCoord.lonDelta,
    }

    return (
        <View style={styles.mapContainer}>
            <MapView //ref={mapRef} 
                style={styles.map} provider="google" 
                mapType="mutedStandard" 
                toolbarEnabled={false} //region={mapCoords}
                initialRegion={initialRegion} 
                loadingEnabled={true}
                >

                {origin?.location &&
                    <Marker coordinate={{
                        latitude: origin.location.latitude,
                        longitude: origin.location.longitude,
                    }} title={origin.shortStringLocation}/>
                }

                {destination?.location &&
                    <Marker coordinate={{
                        latitude: destination.location.latitude,
                        longitude: destination.location.longitude,
                    }} title={destination.shortStringLocation}/>
                }

                {taxi && <Marker coordinate={taxi.location} title={taxi.name} />

                }

            </MapView>
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