import { FC, useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useMapDispatchActions } from "../../hooks/slices/useMapDispatchActions";
import { SocketContext } from "../../hooks/useSocketContext";
import { LatLng } from "../../types/Location";
import { Coords } from "../../utils/Coords";

export const ConfirmedRideMap: FC = () => {
    const {origin, destination} = useMapDispatchActions();
    const {socket} = useContext(SocketContext)!;
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
        socket!.on('location-update-from-taxi', onTaxiUpdate);
        
        return () => {
            socket!.off('location-update-from-taxi', onTaxiUpdate);
        }
    }, []);

    if (origin == null || destination == null) {
        // It should only occur when the app is in the background, 
        // then the ride is completed and the user re-open the app
        return(<></>);
    }

    let originCoord = {
        latitude: origin?.location.latitude!,
        longitude: origin?.location.longitude!,
    };
    let destinationCoord = {
        latitude: destination?.location.latitude!,
        longitude: destination?.location.longitude!,
    };

    let middleCoord = Coords.calculateIntermediateCoord(originCoord, destinationCoord);

    let initialRegion = {
        latitude: middleCoord.latitude,
        longitude: middleCoord.longitude,
        latitudeDelta: middleCoord.latitudeDelta,
        longitudeDelta: middleCoord.longitudeDelta,
    }

    return (
        <View style={styles.mapContainer}>
            <MapView
                style={styles.map} provider={PROVIDER_GOOGLE}
                toolbarEnabled={false}
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