import {createSlice} from '@reduxjs/toolkit';
import { RideWithAddress } from '../src/types/Location';
import { LatLng } from 'react-native-maps';

type initialStateType ={
  ride: RideWithAddress | null,
  userId: string | null,
  currentLocation: LatLng | null,
  available: boolean,
  rideStatus: 'accepted' | 'arrived' | null,
}

const initialState: initialStateType = {
  ride: null,
  userId: null,
  currentLocation: null,
  available: false,
  rideStatus: null,
}

export const taxiRideSlice = createSlice({
    name: 'taxiRide',
    initialState,
    reducers: {
      setRide: (state, action) => {
        state.ride = action.payload;
      },
      setUserId: (state, action) => {
        state.userId = action.payload;
      },
      setCurrentLocation: (state, action) => {
        state.currentLocation = action.payload;
      },
      setAvailable: (state, action) => {
        state.available = action.payload;
      },
      setRideStatus: (state, action) => {
        state.rideStatus = action.payload;
      },
    }
})
  
export const { setRide, setUserId, setCurrentLocation, setAvailable, setRideStatus } = taxiRideSlice.actions;

export const selectRide: (state: any) => RideWithAddress | null = (state: any) => state.taxiRide.ride;
export const selectUserId: (state: any) => string | null = (state: any) => state.taxiRide.userId;
export const selectCurrentLocation: (state: any) => LatLng | null = (state: any) => state.taxiRide.currentLocation;
export const selectAvailable: (state: any) => boolean = (state: any) => state.taxiRide.available;
export const selectRideStatus: (state: any) => 'accepted' | 'arrived' | null = (state: any) => state.taxiRide.rideStatus;

export default taxiRideSlice.reducer;