import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("ankify_token"),
  isLoading: !!localStorage.getItem("ankify_token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoading = false;
      localStorage.setItem("ankify_token", action.payload.token);
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isLoading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isLoading = false;
      localStorage.removeItem("ankify_token");
    },
  },
});

export const { setCredentials, setUser, setLoading, logout } =
  authSlice.actions;
export default authSlice.reducer;
