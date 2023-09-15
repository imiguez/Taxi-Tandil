import { configureStore } from '@reduxjs/toolkit'
import rideReducer from './slices/rideSlice.js';

export const store = configureStore({
  reducer: {
    ride: rideReducer
  }
})