import { RideWithAddress } from "../Location";

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
    taxi: null | {
        id: string | null,
        username: string | null,
    }
}

export type initialUserRideSliceStateType = {
    selectInMap: boolean,
} & rideStatusType & lastModified & focusInput & RideWithAddress & taxiInfo