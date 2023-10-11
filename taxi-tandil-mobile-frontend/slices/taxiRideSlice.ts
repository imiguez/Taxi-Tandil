import {createSlice} from '@reduxjs/toolkit';
import { RideWithAddress } from '../src/types/Location';

type initialStateType ={
  ride: RideWithAddress | null,
  userId: string | null,
}

const initialState: initialStateType = {
  ride: null,
  userId: null,
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
    }
})
  
export const { setRide, setUserId } = taxiRideSlice.actions;

export const selectRide: (state: any) => RideWithAddress | null = (state: any) => state.taxiRide.ride;
export const selectUserId: (state: any) => string | null = (state: any) => state.taxiRide.userId;

export default taxiRideSlice.reducer;