import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AuthLayout from "@/layouts/AuthLayout";
import LoginPage from "@/pages/LoginPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import DashboardPage from "@/pages/DashboardPage";
import DeckPage from "@/pages/DeckPage";
import UploadPage from "@/pages/UploadPage";
import ErrorBoundary from "@/components/ErrorBoundary";

function App() {
  return (
    <>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/decks/:id" element={<DeckPage />} />
            <Route path="/upload" element={<UploadPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}

export default App;
