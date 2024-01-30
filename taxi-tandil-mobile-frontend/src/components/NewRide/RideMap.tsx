import React, { FC, useMemo, useRef, useState } from "react";
import { Platform, SafeAreaView, StyleSheet } from "react-native";
import MapView, { Details, LatLng, MapMarker, Marker, MarkerDragStartEndEvent, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SelectInMapOptions } from "./SelectInMapOptions";
import constants from "../../constants";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { useCoords } from "../../hooks/useCoords";
import * as ExpoLocation from 'expo-location';
import PermissionsPopUp from "../Common/PermissionsPopUp";

export const RideMap: FC = () => {

    const {reverseGeocode} = useCoords();
    const {origin, destination, lastModified, selectInMap, setLocation, focusInput, 
        setSelectInMap} = useMapDispatchActions();
    let coords = {
        latitude: constants.tandilLocation.latitude,
        longitude: constants.tandilLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };
    
    const mapRef = useRef<MapView>(null);
    const markerRef = useRef<MapMarker>(null);
    
    const [mapCoords, setMapCoords] = useState(coords);
    const [markerCoords, setMarkerCoords] = useState<LatLng>({
        latitude: 0,
        longitude: 0,
    });

    const [showPopUp, setShowPopUp] = useState<boolean>(false);

    const setCoordsToSelectInMapMarker = useMemo(() => {
        if (selectInMap && mapRef.current?.props.region) {
            let lat = mapRef.current.props.region.latitude;
            let lng = mapRef.current.props.region.longitude;
            if (focusInput == 'origin' && origin?.location) {
                lat = origin.location.latitude;
                lng = origin.location.longitude;
            }
            if (focusInput == 'destination' && destination?.location) {
                lat = destination.location.latitude;
                lng = destination.location.longitude;
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
            region.latitude = origin.location.latitude;
            region.longitude = origin.location.longitude;
        }
        if (lastModified == 'destination' && destination) {
            region.latitude = destination.location.latitude;
            region.longitude = destination.location.longitude;
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
        // Sets the new map region, in other words, where the map should tarjet
        let newMapRegion = {
            latitude: mapCoords.latitude,
            longitude: mapCoords.longitude,
            latitudeDelta: mapCoords.latitudeDelta,
            longitudeDelta: mapCoords.longitudeDelta
        }
        if (focusInput == 'origin') {
            if (origin?.location) {
                newMapRegion.latitude = origin.location.latitude;
                newMapRegion.longitude = origin.location.longitude;
            } else if (destination?.location) {
                newMapRegion.latitude = destination.location.latitude;
                newMapRegion.longitude = destination.location.longitude;
            }
        }
        if (focusInput == 'destination'){
            if (destination?.location) {
                newMapRegion.latitude = destination.location.latitude;
                newMapRegion.longitude = destination.location.longitude;
            } else if (origin?.location) {
                newMapRegion.latitude = origin.location.latitude;
                newMapRegion.longitude = origin.location.longitude;
            }
        }
        setMapCoords(newMapRegion);
    }

    /**
     * 
     * @see link https://docs.expo.dev/versions/latest/sdk/location/#locationreversegeocodeasynclocation-options
     */
    const onConfirm = async () => {
        if (Platform.OS === 'android') { // Checks only in android.
            let fgPermissions = await ExpoLocation.getForegroundPermissionsAsync();
            if (!fgPermissions.granted) {
                if (!fgPermissions.canAskAgain) {
                    setShowPopUp(true);
                    return;
                }
                
                let newFgPermissions = await ExpoLocation.requestForegroundPermissionsAsync();
                if (!newFgPermissions.granted)
                    return;
            }
        }
        let location = await reverseGeocode(markerCoords);
        if (location == undefined)
            return;
        
        setLocation(location, focusInput);
        setSelectInMap(false);
        setMapCoords({
            latitude: markerCoords.latitude,
            longitude: markerCoords.longitude,
            latitudeDelta: mapCoords.latitudeDelta,
            longitudeDelta: mapCoords.longitudeDelta
        });
    }

    return (
        <SafeAreaView style={styles.mapContainer}>
            {showPopUp && <PermissionsPopUp permissionType="foreground" close={() => setShowPopUp(false)} text="Se requiere permiso a la locación para esta funcionalidad."/>}
            <MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE}
                toolbarEnabled={false} region={mapCoords}
                initialRegion={coords} loadingEnabled={true}
                onRegionChangeComplete={handleRegionChangeComplete} >

                {origin?.location && !selectInMap && 
                    <Marker coordinate={{
                        latitude: origin.location.latitude,
                        longitude: origin.location.longitude,
                    }} title={origin.shortStringLocation}/>
                }

                {destination?.location && !selectInMap &&
                    <Marker coordinate={{
                        latitude: destination.location.latitude,
                        longitude: destination.location.longitude,
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
        height: (constants.windowHeight)-110,
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
});