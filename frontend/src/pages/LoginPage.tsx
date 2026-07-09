import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { api } from "@/store/api";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-sm gap-0 p-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Ankify</h1>
        <p className="mt-2 mb-8 text-muted-foreground">
          Turn lecture slides into Anki decks with AI
        </p>
        <Button size="lg" className="w-full" onClick={handleGoogleLogin}>
          Sign in with Google
        </Button>
        {import.meta.env.DEV && (
          <Button
            variant="outline"
            className="mt-3 w-full border-dashed text-muted-foreground"
            onClick={handleDevLogin}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Dev Login"}
          </Button>
        )}
      </Card>
    </div>
  );
}
