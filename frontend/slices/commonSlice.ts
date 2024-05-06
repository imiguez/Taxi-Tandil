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
      const {element, type} = action.payload;
      switch (type) {
        case 'ADD':
          state.notifications.push(element);
          break;
        case 'REMOVE':
          let i = state.notifications.indexOf(element);
          if (i > -1) {
            state.notifications.splice(i, 1);
          }
          break;
        default:
          state.notifications = [];
          break;
      }
    },
  },
});

export const { setError, setErrorMessage, setNotifications } = commonSlice.actions;

export const selectError: (state: any) => initialCommonSliceStateType['error'] = (state: any) => state.common.error;
export const selectErrorMessage: (state: any) => initialCommonSliceStateType['errorMessage'] = (state: any) => state.common.errorMessage;
export const selectNotifications: (state: any) => initialCommonSliceStateType['notifications'] = (state: any) => state.common.notifications;

export default commonSlice.reducer;