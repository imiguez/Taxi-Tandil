import { configureStore } from '@reduxjs/toolkit'
import rideReducer from './slices/rideSlice.ts';
import taxiRideReducer from './slices/taxiRideSlice.ts';

export const store = configureStore({
  reducer: {
    ride: rideReducer,
    taxiRide: taxiRideReducer,
  }
})