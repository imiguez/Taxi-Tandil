import { configureStore } from '@reduxjs/toolkit'
import userRideReducer from './slices/userRideSlice.ts';
import taxiRideReducer from './slices/taxiRideSlice.ts';
import commonReducer from './slices/commonSlice.ts';
import authReducer from './slices/authSlice.ts';

export const store = configureStore({
  reducer: {
    userRide: userRideReducer,
    taxiRide: taxiRideReducer,
    common: commonReducer,
    auth: authReducer,
  }
})