import { isRejectedWithValue, Middleware } from "@reduxjs/toolkit";
import { toast } from "sonner";

export const apiErrorMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);
  if (isRejectedWithValue(action)) {
    const payload = action.payload as {
      status?: number;
      data?: { error?: string };
    };
    const message = payload?.data?.error || "Something went wrong";
    toast.error(message);
  }
  return result;
};
