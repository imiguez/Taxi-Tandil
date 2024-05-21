import React, { FC, useMemo, useRef, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import MapView, { Details, LatLng, MapMarker, Marker, MarkerDragStartEndEvent, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SelectInMapOptions } from "./SelectInMapOptions";
import SelectInMapErrorNotification from "./SelectInMapErrorNotification";
import { tandilLocation, screenWidth, windowHeight, GOOGLE_REVERSE_GEOCODE_API_URL } from "constants/index";
import PermissionsPopUp from "components/Common/PermissionsPopUp";
import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";
import { GoogleReverseGeocodeApiResponse, LocationWithAddresses } from "types/Location";

export const RideMap: FC = () => {

    const {origin, destination, lastModified, selectInMap, setLocation, focusInput, setSelectInMap} = useMapDispatchActions();
    
    const mapRef = useRef<MapView>(null);
    const markerRef = useRef<MapMarker>(null);
    
    const [mapCoords, setMapCoords] = useState(tandilLocation);
    const [markerCoords, setMarkerCoords] = useState<LatLng>({
        latitude: 0,
        longitude: 0,
    });

    const [showPopUp, setShowPopUp] = useState<boolean>(false);
    const [selectInMapError, setSelectInMapError] = useState<string | null>(null);

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
        let hasChanged = false;
        let region = {
            latitude: tandilLocation.latitude,
            longitude: tandilLocation.longitude,
            latitudeDelta: tandilLocation.latitudeDelta,
            longitudeDelta: tandilLocation.longitudeDelta,
        };
        if (lastModified == 'origin' && origin) {
            region.latitude = origin.location.latitude;
            region.longitude = origin.location.longitude;
            hasChanged = true;
        }
        if (lastModified == 'destination' && destination) {
            region.latitude = destination.location.latitude;
            region.longitude = destination.location.longitude;
            hasChanged = true;
        }

        if (hasChanged) mapRef.current?.animateToRegion(region);
    }, [origin, destination]);

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

    const onConfirm = async () => {
        try {
            const googleApiFetch = await fetch(`${GOOGLE_REVERSE_GEOCODE_API_URL}latlng=${markerCoords.latitude},${markerCoords.longitude}&lenguage=es&location_type=ROOFTOP&result_type=street_address&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`);
            const reversedLocation: GoogleReverseGeocodeApiResponse = await googleApiFetch.json();

            if (reversedLocation.status === 'ZERO_RESULTS') {
                setSelectInMapError('No se pudo detectar una dirección válida, intente nuevamente.');
                setTimeout(() => {
                    setSelectInMapError(null);
                }, 5000);
                return;
            } else if (reversedLocation.status !== "OK") throw new Error(`Status: ${reversedLocation.status}.`);
    
            const location: LocationWithAddresses = {
                location: {
                    latitude: markerCoords.latitude,
                    longitude: markerCoords.longitude
                },
                longAddress: reversedLocation.results[0].formatted_address,
                shortAddress: reversedLocation.results[0].address_components[1].long_name+reversedLocation.results[0].address_components[0].long_name,
            }
            
            setLocation(location, focusInput);
            setSelectInMap(false);
            setMapCoords({
                latitude: markerCoords.latitude,
                longitude: markerCoords.longitude,
                latitudeDelta: mapCoords.latitudeDelta,
                longitudeDelta: mapCoords.longitudeDelta
            });

        } catch (error) {
            setSelectInMapError('Hubo un error, intente nuevamente.');
            setTimeout(() => {
                setSelectInMapError(null);
            }, 5000);
        }
    }

    return (
        <SafeAreaView style={styles.mapContainer}>
            {selectInMapError && <SelectInMapErrorNotification msg={selectInMapError} />}
            {showPopUp && <PermissionsPopUp permissionType="foreground" close={() => setShowPopUp(false)} text="Se requiere permiso a la locación para esta funcionalidad."/>}
            <MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE}
                toolbarEnabled={false} region={mapCoords}
                initialRegion={tandilLocation} loadingEnabled={true}
                onRegionChangeComplete={handleRegionChangeComplete} >

                {origin?.location && !selectInMap && 
                    <Marker coordinate={origin.location} title={origin.shortAddress}/>
                }

                {destination?.location && !selectInMap &&
                    <Marker coordinate={destination.location} title={destination.shortAddress}/>
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
        width: screenWidth,
        height: (windowHeight)-110,
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