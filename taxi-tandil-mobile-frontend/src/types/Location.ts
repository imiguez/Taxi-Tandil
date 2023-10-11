export type LatLng = {
    latitude: number,
    longitude: number,
};

export type LatLngDelta = {
    latitude: number,
    longitude: number,
    latitudeDelta: number,
    longitudeDelta: number,
};

export type LocationWithName = {
    location: LatLng,
    longStringLocation: string,
    shortStringLocation: string,
};

export type Ride = {
    origin: LatLng,
    destination: LatLng,
};

export type RideWithAddress = {
    origin: LocationWithName,
    destination: LocationWithName,
};