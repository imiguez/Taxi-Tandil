import {createSlice} from '@reduxjs/toolkit';

const initialState = {
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

export const selectOrigin = (state) => state.ride.origin;
export const selectDestination = (state) => state.ride.destination;

export default rideSlice.reducer;