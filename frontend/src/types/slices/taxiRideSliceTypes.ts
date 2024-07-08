import { LatLng, RideWithAddresses } from "../Location";

export type rideStatusType = {
    rideStatus: 'rejected' | 'user-cancelled' | 'accepted' | 'arrived' | null,
}

export type initialTaxiRideSliceStateType = {
    ride: RideWithAddresses | null,
    userId: string | null,
    username: string | null,
    currentLocation: LatLng | null,
    popUp: boolean,
} & rideStatusType