import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { store } from "./store";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import Settings from "./pages/settings/Settings";
import VocabularySets from "./pages/vocabulary/VocabularySets";
import VocabSetDetail from "./pages/vocabulary/VocabSetDetail";
import Explore from "./pages/explore/Explore";
import ExploreAll from "./pages/explore/ExploreAll";
import ExploreSetDetail from "./pages/explore/ExploreSetDetail";
import AuthLayout from "./components/layout/AuthLayout";
import MainLayout from "./components/layout/MainLayout";
import { useSelector } from "react-redux";
import { RootState } from "./store";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Main App Routes */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vocabulary" element={<VocabularySets />} />
            <Route path="/vocabulary/:setId" element={<VocabSetDetail />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/all" element={<ExploreAll />} />
            <Route path="/explore/:setId" element={<ExploreSetDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </Provider>
  );
}
