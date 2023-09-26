import {createSlice} from '@reduxjs/toolkit';

export type Location = {
  location: {
    lat: number,
    lng: number,
  },
  longStringLocation: string,
  shortStringLocation: string,
}

type initialStateType ={
  origin: Location | null,
  destination: Location | null,
  focusInput: 'origin' | 'destination',
  lastModified: 'origin' | 'destination' | null,
  selectInMap: boolean,
}

const initialState: initialStateType = {
  origin: null,
  destination: null,
  focusInput: 'origin',
  lastModified: null,
  selectInMap: false,
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
    }
})
  
export const { setOrigin, setDestination, setLastModified, setSelectInMap, setFocusInput } = rideSlice.actions;

export const selectOrigin: (state: any) => Location | null = (state: any) => state.ride.origin;
export const selectDestination: (state: any) => Location | null = (state: any) => state.ride.destination;
export const selectFocusInput: (state: any) => 'origin' | 'destination' = (state: any) => state.ride.focusInput;
export const selectLastModified: (state: any) => 'origin' | 'destination' | null = (state: any) => state.ride.lastModified;
export const selectSelectInMap: (state: any) => boolean = (state: any) => state.ride.selectInMap;

export default rideSlice.reducer;