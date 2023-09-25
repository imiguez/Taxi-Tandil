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
}

const initialState: initialStateType = {
  origin: null,
  destination: null,
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
    }
})
  
export const { setOrigin, setDestination } = rideSlice.actions;

export const selectOrigin: (state: any) => Location | null = (state: any) => state.ride.origin;
export const selectDestination: (state: any) => Location | null = (state: any) => state.ride.destination;
export const selectCurrentComponent: (state: any) => 'origin' | 'destination' | 'confirming' = (state: any) => state.ride.currentComponent;

export default rideSlice.reducer;