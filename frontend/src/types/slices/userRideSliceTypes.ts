import { LatLng, RideWithAddresses } from "../Location";

export type focusInput = {
    focusInput: 'origin' | 'destination' | null,
}

export type lastModified = {
    lastModified: 'origin' | 'destination' | null,
}

export type rideStatusType = {
    rideStatus: 'emitted' | 'accepted' | 'all-taxis-reject' 
    | 'no-taxis-available' | 'arrived' | null,
}

export type taxiInfo = {
    taxi: {
        username: string | null,
        location: LatLng | null,
        carOrientation: null | 'top' | 'right' | 'down' | 'left';
    } | null
}

export type initialUserRideSliceStateType = {
    selectInMap: boolean,
    distance: number | null,
} & rideStatusType & lastModified & focusInput & RideWithAddresses & taxiInfo