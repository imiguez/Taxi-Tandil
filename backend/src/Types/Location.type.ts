export type LatLng = {
    latitude: number,
    longitude: number,
};

export type LocationWithAddresses = {
    location: LatLng;
    longAddress: string;
    shortAddress: string;
  };

export type Ride = {
    origin: LatLng,
    destination: LatLng,
};

export type RideWithAddresses = {
    origin: LocationWithAddresses;
    destination: LocationWithAddresses;
};