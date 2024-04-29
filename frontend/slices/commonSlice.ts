import { createSlice } from '@reduxjs/toolkit';
import { initialCommonSliceStateType } from '../src/types/slices/commonSliceTypes';

export const initialState: initialCommonSliceStateType = {
  error: false,
  errorMessage: undefined,
  notifications: [],
};

export const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    setError: (state, action) => {
      state.error = action.payload;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
  },
});

export const { setError, setErrorMessage, setNotifications } = commonSlice.actions;

export const selectError: (state: any) => initialCommonSliceStateType['error'] = (state: any) => state.common.error;
export const selectErrorMessage: (state: any) => initialCommonSliceStateType['errorMessage'] = (state: any) => state.common.errorMessage;
export const selectNotifications: (state: any) => initialCommonSliceStateType['notifications'] = (state: any) => state.common.notifications;

export default commonSlice.reducer;