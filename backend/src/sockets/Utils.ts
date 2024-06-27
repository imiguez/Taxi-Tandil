import { LatLng } from "src/types/location.type";

export const calculateDistances = (location1: LatLng, location2: LatLng) => {
    const lat1 = location1.latitude;
    const lng1 = location1.longitude;
    const lat2 = location2.latitude;
    const lng2 = location2.longitude;
    // Earth radius in km
    const earthRad = 6371;

    const latitude1Rad = degToRad(lat1);
    const longitude1Rad = degToRad(lng1);
    const latitude2Rad = degToRad(lat2);
    const longitude2Rad = degToRad(lng2);

    const difLatitude = latitude2Rad - latitude1Rad;
    const difLongitude = longitude2Rad - longitude1Rad;

    // Haversine formula
    const a =
    Math.sin(difLatitude / 2) ** 2 +
    Math.cos(latitude1Rad) * Math.cos(latitude2Rad) * Math.sin(difLongitude / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRad * c;

    return distance;
}

// Convert degrees to radians
const degToRad = (degrees: number) => {
    return (degrees * Math.PI) / 180;
}