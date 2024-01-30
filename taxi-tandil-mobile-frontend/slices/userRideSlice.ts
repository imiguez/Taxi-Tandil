import {createSlice} from '@reduxjs/toolkit';
import { initialUserRideSliceStateType } from '../src/types/slices/userRideSliceTypes';

const initialState: initialUserRideSliceStateType = {
  origin: null,
  destination: null,
  focusInput: 'origin',
  lastModified: null,
  selectInMap: false,
  rideStatus: null,
  taxi: null,
}

export const userRideSlice = createSlice({
    name: 'userRide',
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
      setRideStatus: (state, action) => {
        state.rideStatus = action.payload;
      },
      setTaxi: (state, action) => {
        state.taxi = action.payload;
      },
    }
})
  
export const { setOrigin, setDestination, setLastModified, setSelectInMap, 
  setFocusInput, setRideStatus, setTaxi } = userRideSlice.actions;

export const selectOrigin: (state: any) => initialUserRideSliceStateType['origin'] = (state: any) => state.userRide.origin;
export const selectDestination: (state: any) => initialUserRideSliceStateType['destination'] = (state: any) => state.userRide.destination;
export const selectFocusInput: (state: any) => initialUserRideSliceStateType['focusInput'] = (state: any) => state.userRide.focusInput;
export const selectLastModified: (state: any) => initialUserRideSliceStateType['lastModified'] = (state: any) => state.userRide.lastModified;
export const selectSelectInMap: (state: any) => boolean = (state: any) => state.userRide.selectInMap;
export const selectRideStatus: (state: any) => initialUserRideSliceStateType['rideStatus'] = (state: any) => state.userRide.rideStatus;
export const selectTaxi: (state: any) => initialUserRideSliceStateType['taxi'] = (state: any) => state.userRide.taxi;

export default userRideSlice.reducer;