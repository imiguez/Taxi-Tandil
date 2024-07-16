import React, { FC, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Details, LatLng, MapMarker, Marker, MarkerDragStartEndEvent, PROVIDER_GOOGLE, Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { SelectInMapOptions } from "./SelectInMapOptions";
import SelectInMapErrorNotification from "./SelectInMapErrorNotification";
import { tandilLocation, GOOGLE_REVERSE_GEOCODE_API_URL } from "constants/index";
import PermissionsPopUp from "components/Common/PermissionsPopUp";
import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";
import { GoogleReverseGeocodeApiResponse, LatLngDelta, LocationWithAddresses } from "types/Location";

export const RideMap: FC = () => {
    const {origin, destination, selectInMap, setLocation, focusInput, setFocusInput, setSelectInMap, setRideDistance, taxi} = useMapDispatchActions();
    
    const mapRef = useRef<MapView>(null);
    const markerRef = useRef<MapMarker>(null);
    const mapCoords = useRef<LatLngDelta>(tandilLocation);
    
    const [markerCoords, setMarkerCoords] = useState<LatLng>({
        latitude: 0,
        longitude: 0,
    });

    const [showPopUp, setShowPopUp] = useState<boolean>(false);
    const [selectInMapError, setSelectInMapError] = useState<string | null>(null);

    const handleAnimation = () => {
        if (mapRef.current) {
            if (origin?.location && destination?.location) {
                mapRef.current.fitToCoordinates([origin.location, destination.location], {
                    edgePadding: { top: 120, right: 35, bottom: 100, left: 35 }
                });
            } else if (origin?.location) mapRef.current.animateToRegion({...mapCoords.current, ...origin.location});
            else if (destination?.location) mapRef.current.animateToRegion({...mapCoords.current, ...destination.location});
        }
    }

    useMemo(() => {
        if (!mapRef.current) return;

        if (selectInMap && mapRef.current.props.region) {
            let coord = {
                latitude: mapCoords.current.latitude,
                longitude: mapCoords.current.longitude,
            }
            if (focusInput == 'origin' && origin?.location) {
                coord = origin.location;
            }
            if (focusInput == 'destination' && destination?.location) {
                coord = destination.location;
            }

            setMarkerCoords(coord);
            mapRef.current.animateToRegion({...mapCoords.current, ...coord});
        } else handleAnimation();

    }, [selectInMap]);

    useMemo(() => {
        if (mapRef.current && origin?.location) {
            if (taxi?.location) {
                mapRef.current.fitToCoordinates([origin.location, taxi.location], {
                    edgePadding: { top: 50, right: 35, bottom: 200, left: 35 }
                });
            } else if (destination?.location) {
                mapRef.current.fitToCoordinates([origin.location, destination.location], {
                    edgePadding: { top: 50, right: 35, bottom: 100, left: 35 }
                });
            }
        }
    }, [taxi]);

    useMemo(() => {
        if (!origin || !destination) setRideDistance(null);
        handleAnimation();
    }, [origin, destination]);

    const handleRegionChangeComplete = (region: Region, details: Details) => {
        if (details.isGesture && mapRef.current?.props.region) {
            mapCoords.current = {
                latitude: region.latitude,
                longitude: region.longitude,
                latitudeDelta: region.latitudeDelta,
                longitudeDelta: region.longitudeDelta,
            };
        }
    }
        
    const handleDrag = (event: MarkerDragStartEndEvent) => {
        setMarkerCoords({
            latitude: event.nativeEvent.coordinate.latitude,
            longitude: event.nativeEvent.coordinate.longitude,
        });
    };

    const onConfirm = async () => {
        const onError = (msg: string) => {
            setSelectInMapError(msg);
            setTimeout(() => {
                setSelectInMapError(null);
            }, 5000);
        }
        try {
            const googleApiFetch = await fetch(`${GOOGLE_REVERSE_GEOCODE_API_URL}latlng=${markerCoords.latitude},${markerCoords.longitude}&lenguage=es&location_type=ROOFTOP&result_type=street_address&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`);
            const reversedLocation: GoogleReverseGeocodeApiResponse = await googleApiFetch.json();

            if (reversedLocation.status === 'ZERO_RESULTS') {
                onError('No se pudo detectar una dirección válida, intente nuevamente.');
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
        } catch (error) {
            onError('Hubo un error, intente nuevamente.');
        }
    }

    const onCancel = () => {
        if (focusInput == 'origin' && destination?.location) {
            mapCoords.current.latitude = destination.location.latitude;
            mapCoords.current.longitude = destination.location.longitude;
        }
        if (focusInput == 'destination' && origin?.location) {
            mapCoords.current.latitude = origin.location.latitude;
            mapCoords.current.longitude = origin.location.longitude;
        }
        setSelectInMap(false);
    }

    const onMapTouchStart = () => {
        if (!selectInMap && focusInput) {
            setFocusInput(null);
        }
    }

    return (
        <View style={styles.mapContainer}>

            {selectInMapError && <SelectInMapErrorNotification msg={selectInMapError} />}
            {showPopUp && <PermissionsPopUp permissionType="foreground" close={() => setShowPopUp(false)} text="Se requiere permiso a la locación para esta funcionalidad."/>}

            <MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE}
                toolbarEnabled={false} region={tandilLocation}
                initialRegion={tandilLocation} loadingEnabled={true} onTouchStart={onMapTouchStart}
                onRegionChangeComplete={handleRegionChangeComplete}>

                {origin?.location && !selectInMap && 
                    <Marker coordinate={origin.location} title={origin.shortAddress}
                    image={require("@assets/origin_map_marker.png")} />
                }

                {destination?.location && !selectInMap &&
                    <Marker coordinate={destination.location} title={destination.shortAddress}
                    image={require("@assets/destination_map_marker.png")} />
                }

                {origin && destination && <MapViewDirections
                    onReady={(args) => setRideDistance(args.distance)}
                    origin={origin.location} destination={destination.location}
                    apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
                    strokeColor="black" strokeWidth={4}
                />}

                {selectInMap && <Marker ref={markerRef}
                    coordinate={markerCoords}
                    draggable onDragEnd={handleDrag} 
                    image={focusInput == 'origin' ? require("@assets/origin_map_marker.png") : require("@assets/destination_map_marker.png")} 
                />}

                {taxi && taxi.location && <Marker identifier="taxi" coordinate={taxi.location} title={taxi.username ?? 'Rider'}
                    image={require("@assets/taxi_map_marker.png")} style={ taxi.carOrientation ? { transform: [{rotate: (
                        taxi.carOrientation == 'top' ? '-90deg' : (taxi.carOrientation == 'right' ? '0deg' : (
                            taxi.carOrientation == 'down' ? '90deg' : '180deg'
                        ))
                    )}] } : {}} />}
            </MapView>
            
            {selectInMap && 
                <SelectInMapOptions onConfirm={onConfirm} onCancel={onCancel}/>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
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