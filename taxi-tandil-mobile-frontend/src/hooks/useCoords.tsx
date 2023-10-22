import * as ExpoLocation from 'expo-location';
import { LatLng } from "../types/Location";


export const useCoords = () => {

    const reverseGeocode = async (coord: LatLng) => {
        try {
            let value = await ExpoLocation.reverseGeocodeAsync(coord);
            let longStringLocationValue = `${value[0].street} ${value[0].streetNumber}, ${value[0].city}, ${value[0].region}, ${value[0].country}`;
            return {
                location: coord,
                longStringLocation: longStringLocationValue,
                shortStringLocation: `${value[0].street} ${value[0].streetNumber}`,
            }
        } catch (e) {
            console.log("reverseGeocodeAsync: "+e);
        }
    }

    const getLatLngCurrentPosition = async () => {
        try {
            const {latitude, longitude} = (await ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Highest})).coords;
            return {
                latitude: latitude,
                longitude: longitude,
            };
        } catch (e) {
            console.log(`getCurrentPositionLatLng: ${e}`);
        }
    }

    const getFullCurrentPosition = async () => {
        let currentLocation = await getLatLngCurrentPosition();
        if (currentLocation == undefined) {
            console.log(`getFullCurrentPosition: currentLocation is undefined`);
            return;
        }
        let param: Pick<ExpoLocation.LocationGeocodedLocation, "latitude" | "longitude"> = {
            latitude: currentLocation.latitude, 
            longitude: currentLocation.longitude
        };
        let location = await reverseGeocode(param);
        if (location == undefined) {
            console.log(`getFullCurrentPosition: reverse geocode return undefined`);
            return;
        }
        location.shortStringLocation = "Ubicación actual";
        return location;
    }

    const calculateIntermediateCoord = (coord1: LatLng, coord2: LatLng) => {
        let lat1 = coord1.latitude;
        let lon1 = coord1.longitude;
        let lat2 = coord2.latitude;
        let lon2 = coord2.longitude;

        // Calculate deltas
        let {latitudeDelta, longitudeDelta} = calculateDeltas(lat1, lon1, lat2, lon2);

        // Convert degrees to radians
        lat1 = degToRad(lat1);
        lon1 = degToRad(lon1);
        lat2 = degToRad(lat2);
        lon2 = degToRad(lon2);
      
        // Calculate cartesian coords for lat/long
        const x1 = Math.cos(lat1) * Math.cos(lon1);
        const y1 = Math.cos(lat1) * Math.sin(lon1);
        const z1 = Math.sin(lat1);
      
        const x2 = Math.cos(lat2) * Math.cos(lon2);
        const y2 = Math.cos(lat2) * Math.sin(lon2);
        const z2 = Math.sin(lat2);
      
        // Calculate cartesian coords for the middle point
        const x3 = (x1 + x2) / 2;
        const y3 = (y1 + y2) / 2;
        const z3 = (z1 + z2) / 2;
      
        // Convert cartesian coords to lat/lon
        const lon3 = Math.atan2(y3, x3);
        const hip = Math.sqrt(x3 * x3 + y3 * y3);
        const lat3 = Math.atan2(z3, hip);
      
        // Convert radians to degrees
        const latitude = radToDeg(lat3);
        const longitude = radToDeg(lon3);
      
        return {latitude, longitude, latitudeDelta, longitudeDelta};
    }


    const calculateDistances = (location1: LatLng, location2: LatLng) => {
        const lat1 = location1.latitude;
        const lon1 = location1.longitude;
        const lat2 = location2.latitude;
        const lon2 = location2.longitude;
        // Earth radius in km
        const earthRad = 6371;
    
        const latitud1Rad = degToRad(lat1);
        const longitud1Rad = degToRad(lon1);
        const latitud2Rad = degToRad(lat2);
        const longitud2Rad = degToRad(lon2);
    
        const difLatitud = latitud2Rad - latitud1Rad;
        const difLongitud = longitud2Rad - longitud1Rad;
    
        // Haversine formula
        const a =
        Math.sin(difLatitud / 2) ** 2 +
        Math.cos(latitud1Rad) * Math.cos(latitud2Rad) * Math.sin(difLongitud / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
        const distance = earthRad * c;
    
        return distance;
    }

    const calculateDeltas = (lat1: number, lon1: number, lat2: number, lon2: number, margen = 0.01) => {
        // Find the max & min lat
        const minLat = Math.min(lat1, lat2);
        const maxLat = Math.max(lat1, lat2);
      
        // Find the max & min lon
        const minLon = Math.min(lon1, lon2);
        const maxLon = Math.max(lon1, lon2);
      
        // Calculate the diff with an additional margin
        const latitudeDelta = maxLat - minLat + margen;
        const longitudeDelta = maxLon - minLon + margen;
      
        return { latitudeDelta, longitudeDelta };
      }
      
    const degToRad = (degrees: number) => {
        return (degrees * Math.PI) / 180;
    }
    
    const radToDeg = (radians: number) => {
        return (radians * 180) / Math.PI;
    }

    return {
        calculateIntermediateCoord, reverseGeocode, calculateDistances,
        getLatLngCurrentPosition, getFullCurrentPosition
    };
};