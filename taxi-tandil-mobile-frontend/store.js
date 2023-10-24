import { configureStore } from '@reduxjs/toolkit'
import userRideReducer from './slices/userRideSlice.ts';
import taxiRideReducer from './slices/taxiRideSlice.ts';

export const store = configureStore({
  reducer: {
    userRide: userRideReducer,
    taxiRide: taxiRideReducer,
  }
})