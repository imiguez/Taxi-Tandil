import {createSlice} from '@reduxjs/toolkit';
import { initialTaxiRideSliceStateType } from '../src/types/slices/taxiRideSliceTypes';

const initialState: initialTaxiRideSliceStateType = {
  ride: null,
  userId: null,
  username: null,
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
      setUsername: (state, action) => {
        state.username = action.payload;
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
  
export const { setRide, setUserId, setUsername, setCurrentLocation, setAvailable, setRideStatus } = taxiRideSlice.actions;

export const selectRide: (state: any) => initialTaxiRideSliceStateType['ride'] = (state: any) => state.taxiRide.ride;
export const selectUserId: (state: any) => initialTaxiRideSliceStateType['userId'] = (state: any) => state.taxiRide.userId;
export const selectUsername: (state: any) => initialTaxiRideSliceStateType['username'] = (state: any) => state.taxiRide.username;
export const selectCurrentLocation: (state: any) => initialTaxiRideSliceStateType['currentLocation'] = (state: any) => state.taxiRide.currentLocation;
export const selectAvailable: (state: any) => initialTaxiRideSliceStateType['available'] = (state: any) => state.taxiRide.available;
export const selectRideStatus: (state: any) => initialTaxiRideSliceStateType['rideStatus'] = (state: any) => state.taxiRide.rideStatus;

export default taxiRideSlice.reducer;