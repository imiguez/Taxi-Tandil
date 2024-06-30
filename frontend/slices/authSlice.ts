import { createSlice } from "@reduxjs/toolkit";
import { initialAuthSliceStateType } from "../src/types/slices/authSliceTypes";

export const initialState: initialAuthSliceStateType = {
  id: undefined,
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  roles: [],
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setId: (state, action) => {
      state.id = action.payload;
    },
    setFirstName: (state, action) => {
      state.firstName = action.payload;
    },
    setLastName: (state, action) => {
      state.lastName = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
    },
  },
});

export const { setId, setFirstName, setLastName, setEmail, setRoles } =
  authSlice.actions;

export const selectId: (
  state: any
) => initialAuthSliceStateType["id"] = (state: any) =>
  state.auth.id;
export const selectFirstName: (
  state: any
) => initialAuthSliceStateType["firstName"] = (state: any) =>
  state.auth.firstName;
export const selectLastName: (
  state: any
) => initialAuthSliceStateType["lastName"] = (state: any) =>
  state.auth.lastName;
export const selectEmail: (state: any) => initialAuthSliceStateType["email"] = (
  state: any
) => state.auth.email;
export const selectRoles: (
  state: any
) => initialAuthSliceStateType["roles"] = (state: any) =>
  state.auth.roles;

export default authSlice.reducer;