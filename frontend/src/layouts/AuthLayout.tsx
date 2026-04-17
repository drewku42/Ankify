import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

export default function AuthLayout() {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return <div className="auth-layout__loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="auth-layout">
      <main className="auth-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
