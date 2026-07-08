import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { api } from "@/store/api";
import { API_URL } from "@/config";

interface SignInCTAProps {
  showExportNote?: boolean;
}

export function SignInCTA({ showExportNote = true }: SignInCTAProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/dev-login`, { method: "POST" });
      if (!res.ok) throw new Error("Dev login failed");
      const data = await res.json();
      dispatch(setCredentials({ user: data.user, token: data.token }));
      dispatch(api.util.resetApiState());
      navigate("/", { replace: true });
    } catch {
      toast.error("Dev login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="landing__cta">
      <button className="landing__btn" onClick={handleGoogleLogin}>
        Continue with Google
      </button>
      {showExportNote && (
        <span className="landing__export">
          ✓ Exports to <b>.apkg</b>
        </span>
      )}
      {import.meta.env.DEV && (
        <button
          className="landing__dev"
          onClick={handleDevLogin}
          disabled={isLoading}
        >
          {isLoading ? "Signing in…" : "Dev Login"}
        </button>
      )}
    </div>
  );
}
