import {createSlice} from '@reduxjs/toolkit';
import { LocationWithName } from '../src/types/Location';

type initialStateType ={
  origin: LocationWithName | null,
  destination: LocationWithName | null,
  focusInput: 'origin' | 'destination',
  lastModified: 'origin' | 'destination' | null,
  selectInMap: boolean,
  rideConfirmed: boolean,
}

const initialState: initialStateType = {
  origin: null,
  destination: null,
  focusInput: 'origin',
  lastModified: null,
  selectInMap: false,
  rideConfirmed: false,
}

export const rideSlice = createSlice({
    name: 'ride',
    initialState,
    reducers: {
      setOrigin: (state, action) => {
        state.origin = action.payload;
      },
      setDestination: (state, action) => {
        state.destination = action.payload;
      },
      setFocusInput: (state, action) => {
        state.focusInput = action.payload;
      },
      setLastModified: (state, action) => {
        state.lastModified = action.payload;
      },
      setSelectInMap: (state, action) => {
        state.selectInMap = action.payload;
      },
      setRideConfirmed: (state, action) => {
        state.rideConfirmed = action.payload;
      },
    }
})
  
export const { setOrigin, setDestination, setLastModified, setSelectInMap, 
  setFocusInput, setRideConfirmed } = rideSlice.actions;

export const selectOrigin: (state: any) => LocationWithName | null = (state: any) => state.ride.origin;
export const selectDestination: (state: any) => LocationWithName | null = (state: any) => state.ride.destination;
export const selectFocusInput: (state: any) => 'origin' | 'destination' = (state: any) => state.ride.focusInput;
export const selectLastModified: (state: any) => 'origin' | 'destination' | null = (state: any) => state.ride.lastModified;
export const selectSelectInMap: (state: any) => boolean = (state: any) => state.ride.selectInMap;
export const selectRideConfirmed: (state: any) => boolean = (state: any) => state.ride.rideConfirmed;

export default rideSlice.reducer;