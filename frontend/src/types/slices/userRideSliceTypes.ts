import { LatLng, RideWithAddress } from "../Location";

export type focusInput = {
    focusInput: 'origin' | 'destination',
}

export type lastModified = {
    lastModified: 'origin' | 'destination' | null,
}

export type rideStatusType = {
    rideStatus: 'emmited' | 'canceled' | 'accepted' | 'all-taxis-reject' 
    | 'no-taxis-available' | 'arrived' | 'completed' | null,
}

export type taxiInfo = {
    taxi: {
        id: string | null,
        username: string | null,
        location: LatLng | null,
    } | null | undefined
}

export type initialUserRideSliceStateType = {
    selectInMap: boolean,
} & rideStatusType & lastModified & focusInput & RideWithAddress & taxiInfo