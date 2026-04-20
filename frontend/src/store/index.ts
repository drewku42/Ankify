import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/store/api";
import authReducer from "@/store/authSlice";
import { apiErrorMiddleware } from "@/store/apiErrorMiddleware";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(api.middleware)
      .concat(apiErrorMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
