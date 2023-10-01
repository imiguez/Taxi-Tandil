import { configureStore } from '@reduxjs/toolkit'
import rideReducer from './slices/rideSlice.ts';

export const store = configureStore({
  reducer: {
    ride: rideReducer
  }
})