import { useEffect } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, setLoading, logout } from "@/store/authSlice";
import { API_URL } from "@/config";

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
      <div className="auth-layout__loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="sidebar__logo">
          Ankify
        </Link>
        <nav className="sidebar__nav">
          <Link
            to="/"
            className={`sidebar__link ${location.pathname === "/" ? "sidebar__link--active" : ""}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            My Decks
          </Link>
          <Link
            to="/upload"
            className={`sidebar__link ${location.pathname === "/upload" ? "sidebar__link--active" : ""}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            New Deck
          </Link>
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__user">
            {user.avatar && (
              <img src={user.avatar} alt="" className="sidebar__avatar" />
            )}
            <span className="sidebar__name">
              {user.name || user.email}
            </span>
          </div>
          <button
            className="sidebar__logout"
            onClick={() => dispatch(logout())}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
