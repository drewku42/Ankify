import { useEffect } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutGrid, Upload } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, setLoading, logout } from "@/store/authSlice";
import { API_URL } from "@/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { to: "/", label: "My Decks", icon: LayoutGrid },
  { to: "/upload", label: "New Deck", icon: Upload },
];

export default function AuthLayout() {
  const { user, token, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      dispatch(setLoading(false));
      return;
    }
    if (user) return;

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => dispatch(setUser(data.user)))
      .catch(() => dispatch(logout()));
  }, [token, user, dispatch]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <div className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4">
        <Link
          to="/"
          className="mb-6 px-3 py-2 text-lg font-bold text-sidebar-foreground"
        >
          Ankify
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-3 border-t border-sidebar-border pt-3">
          <div className="mb-1.5 flex items-center gap-2 px-3 py-1.5">
            {user.avatar && (
              <img src={user.avatar} alt="" className="size-6 rounded-full" />
            )}
            <span className="truncate text-[0.8125rem] text-sidebar-foreground">
              {user.name || user.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={() => dispatch(logout())}
          >
            Sign out
          </Button>
        </div>
      </aside>
      <main className="ml-60 max-w-4xl flex-1 px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}
