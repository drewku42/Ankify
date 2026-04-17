import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { api } from "@/store/api";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/dev-login", { method: "POST" });
      if (!res.ok) throw new Error("Dev login failed");
      const data = await res.json();
      dispatch(setCredentials({ user: data.user, token: data.token }));
      dispatch(api.util.resetApiState());
      navigate("/", { replace: true });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1 className="login-page__title">Ankify</h1>
        <p className="login-page__subtitle">
          Turn lecture slides into Anki decks with AI
        </p>
        <button className="login-page__button" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
        {import.meta.env.DEV && (
          <button
            className="login-page__dev-button"
            onClick={handleDevLogin}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Dev Login"}
          </button>
        )}
      </div>
    </div>
  );
}
