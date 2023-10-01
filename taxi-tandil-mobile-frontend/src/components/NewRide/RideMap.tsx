import React, { FC, useMemo, useRef, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import MapView, { Details, MapMarker, Marker, MarkerDragStartEndEvent, Region } from "react-native-maps";
import * as ExpoLocation from 'expo-location';
import { SelectInMapOptions } from "./SelectInMapOptions";
import constants from "../../constants";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";

export const RideMap: FC = () => {

    const {origin, destination, lastModified, selectInMap, setLocation, focusInput, setSelectInMap} = useMapDispatchActions();
    let coords = {
        latitude: constants.tandilLocation.latitude,
        longitude: constants.tandilLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };
    
    const mapRef = useRef<MapView>(null);
    const markerRef = useRef<MapMarker>(null);
    
    const [mapCoords, setMapCoords] = useState(coords);
    const [markerCoords, setMarkerCoords] = useState<{latitude: number, longitude: number}>({
        latitude: 0,
        longitude: 0,
    });

    const setCoordsToSelectInMapMarker = useMemo(() => {
        if (selectInMap && mapRef.current?.props.region) {
            let lat = mapRef.current.props.region.latitude;
            let lng = mapRef.current.props.region.longitude;
            if (focusInput == 'origin' && origin?.location) {
                lat = origin.location.lat;
                lng = origin.location.lng;
            }
            if (focusInput == 'destination' && destination?.location) {
                lat = destination.location.lat;
                lng = destination.location.lng;
            }
            setMarkerCoords({
                latitude: lat,
                longitude: lng,
            });
        }
    }, [selectInMap]);

    const animationToLastModified = useMemo(() => {
        let region = {
            latitude: 0,
            longitude: 0,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };
        if (lastModified == 'origin' && origin) {
            region.latitude = origin.location.lat;
            region.longitude = origin.location.lng;
        }
        if (lastModified == 'destination' && destination) {
            region.latitude = destination.location.lat;
            region.longitude = destination.location.lng;
        }
        mapRef.current?.animateToRegion(region);
    }, [lastModified]);

    const handleRegionChangeComplete = (region: Region, details: Details) => {
        if (details.isGesture && mapRef.current?.props.region) {
            setMapCoords({
                latitude: region.latitude,
                longitude: region.longitude,
                latitudeDelta: region.latitudeDelta,
                longitudeDelta: region.longitudeDelta,
            });
        }
    }
        
    const handleDrag = (event: MarkerDragStartEndEvent) => {
        setMarkerCoords({
            latitude: event.nativeEvent.coordinate.latitude,
            longitude: event.nativeEvent.coordinate.longitude,
        });
    };

    const onCancel = () => {
        setSelectInMap(false);
        let p = {
            latitude: mapCoords.latitude,
            longitude: mapCoords.longitude,
            latitudeDelta: mapCoords.latitudeDelta,
            longitudeDelta: mapCoords.longitudeDelta
        }
        if (focusInput == 'origin') {
            if (origin?.location) {
                p.latitude = origin.location.lat;
                p.longitude = origin.location.lng;
            } else if (destination?.location) {
                p.latitude = destination.location.lat;
                p.longitude = destination.location.lng;
            }
        }
        if (focusInput == 'destination'){
            if (destination?.location) {
                p.latitude = destination.location.lat;
                p.longitude = destination.location.lng;
            } else if (origin?.location) {
                p.latitude = origin.location.lat;
                p.longitude = origin.location.lng;
            }
        }
        setMapCoords(p);
    }

    const onConfirm = async () => {
        let result = false;
        try {
            let value = await ExpoLocation.reverseGeocodeAsync(markerCoords);
            let longStringLocationValue = `${value[0].street} ${value[0].streetNumber}, ${value[0].city}, ${value[0].region}, ${value[0].country}`;
            let location = {
                location: {
                    lat: markerCoords.latitude,
                    lng: markerCoords.longitude,
                },
                longStringLocation: longStringLocationValue,
                shortStringLocation: `${value[0].street} ${value[0].streetNumber}`,
            }
            setLocation(location, focusInput);
            setSelectInMap(false);
            setMapCoords({
                latitude: markerCoords.latitude,
                longitude: markerCoords.longitude,
                latitudeDelta: mapCoords.latitudeDelta,
                longitudeDelta: mapCoords.longitudeDelta
            });
            result = true;
        } catch (e) {
            console.log("reverseGeocodeAsync: "+e);
        }
        return result;
    }

    return (
        <SafeAreaView style={styles.mapContainer}>
            <MapView ref={mapRef} style={styles.map} provider="google" 
                mapType="mutedStandard" 
                toolbarEnabled={false} region={mapCoords}
                initialRegion={coords} loadingEnabled={true}
                onRegionChangeComplete={handleRegionChangeComplete} >

                {origin?.location && !selectInMap && 
                    <Marker coordinate={{
                        latitude: origin.location.lat,
                        longitude: origin.location.lng,
                    }} title={origin.shortStringLocation}/>
                }

                {destination?.location && !selectInMap &&
                    <Marker coordinate={{
                        latitude: destination.location.lat,
                        longitude: destination.location.lng,
                    }} title={destination.shortStringLocation}/>
                }

                {selectInMap && <Marker ref={markerRef}
                    coordinate={markerCoords}
                    draggable onDragEnd={handleDrag}
                />}
            </MapView>
            
            {selectInMap && 
                <SelectInMapOptions onConfirm={onConfirm} onCancel={onCancel}/>
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        position:'absolute',
        top: 110,
        width: constants.screenWidth,
        height: (constants.windowHeight*.9)-110,
        borderWidth: 0,
        borderColor: 'red',
        borderStyle: 'solid',
        margin: 0,
        padding: 0,
        zIndex: -1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    selectInMapContainer: {
        zIndex: 1,
        backgroundColor: 'grey',
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: 'red',
        borderStyle: 'solid',
    }
});