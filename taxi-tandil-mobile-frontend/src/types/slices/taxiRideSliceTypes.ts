import { LatLng, RideWithAddress } from "../Location";

export type rideStatusType = {
    rideStatus: 'accepted' | 'arrived' | null,
}

export type initialTaxiRideSliceStateType = {
    ride: RideWithAddress | null,
    userId: string | null,
    username: string | null,
    currentLocation: LatLng | null,
    available: boolean | 'loading',
    popUp: boolean,
} & rideStatusType