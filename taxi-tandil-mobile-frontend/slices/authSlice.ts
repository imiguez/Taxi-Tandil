import { createSlice } from "@reduxjs/toolkit";
import { initialAuthSliceStateType } from "../src/types/slices/authSliceTypes";

export const initialState: initialAuthSliceStateType = {
  username: undefined,
  email: undefined,
  roles: [],
  access_token: undefined,
  refresh_token: undefined,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
    },
    setAccessToken: (state, action) => {
      state.access_token = action.payload;
    },
    setRefreshToken: (state, action) => {
      state.refresh_token = action.payload;
    },
  },
});

export const { setUsername, setEmail, setRoles, setAccessToken, setRefreshToken } =
  authSlice.actions;

export const selectUsername: (
  state: any
) => initialAuthSliceStateType["username"] = (state: any) =>
  state.auth.username;
export const selectEmail: (state: any) => initialAuthSliceStateType["email"] = (
  state: any
) => state.auth.email;
export const selectRoles: (
  state: any
) => initialAuthSliceStateType["roles"] = (state: any) =>
  state.auth.roles;
export const selectAccessToken: (
  state: any
) => initialAuthSliceStateType["access_token"] = (state: any) =>
  state.auth.access_token;
export const selectRefreshToken: (
  state: any
) => initialAuthSliceStateType["refresh_token"] = (state: any) =>
  state.auth.refresh_token;

export default authSlice.reducer;