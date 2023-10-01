import { FC } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useCoords } from "../../hooks/useCoords";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";



export const ConfirmedRideMap: FC = () => {
    const {origin, destination} = useMapDispatchActions();
    const {calculateIntermediateCoord} = useCoords();

    let originCoord = {
        latitude: origin?.location.lat!,
        longitude: origin?.location.lng!,
    };
    let destinationCoord = {
        latitude: destination?.location.lat!,
        longitude: destination?.location.lng!,
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
                        latitude: origin.location.lat,
                        longitude: origin.location.lng,
                    }} title={origin.shortStringLocation}/>
                }

                {destination?.location &&
                    <Marker coordinate={{
                        latitude: destination.location.lat,
                        longitude: destination.location.lng,
                    }} title={destination.shortStringLocation}/>
                }

            </MapView>
        </View>
    );
}


const styles = StyleSheet.create({
    mapContainer: {
        flex: .5,
        borderWidth: 1,
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