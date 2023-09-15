import {createSlice} from '@reduxjs/toolkit';

type location = {
  location: {
    lat: number,
    lng: number,
  },
  description: string,
}

type initialStateType ={
  origin: location | null,
  destination: location | null,
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
      }
    }
})
  
export const { setOrigin, setDestination } = rideSlice.actions;

export const selectOrigin = (state: any) => state.ride.origin;
export const selectDestination = (state: any) => state.ride.destination;

export default rideSlice.reducer;