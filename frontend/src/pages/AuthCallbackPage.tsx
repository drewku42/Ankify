import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials, logout } from "@/store/authSlice";
import { api } from "@/store/api";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.setItem("ankify_token", token);

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        dispatch(setCredentials({ user: data.user, token }));
        dispatch(api.util.resetApiState());
        navigate("/", { replace: true });
      })
      .catch(() => {
        dispatch(logout());
        navigate("/login", { replace: true });
      });
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="auth-callback">
      <p>Signing you in...</p>
    </div>
  );
}
