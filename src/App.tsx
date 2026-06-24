import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { store } from "./store";
import AuthLayout from "./components/layout/AuthLayout";
import MainLayout from "./components/layout/MainLayout";
import { useSelector } from "react-redux";
import { RootState } from "./store";
import SessionExpiredManager from "./components/common/SessionExpiredManager";

// ─── Auth pages (small, loaded eagerly since they're the entry point) ─────────
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// ─── Main app pages (lazy-loaded, each becomes its own JS chunk) ──────────────
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Community = lazy(() => import("./pages/community/Community"));
const CommunityPostDetail = lazy(() => import("./pages/community/CommunityPostDetail"));
const CommunityEditor = lazy(() => import("./pages/community/CommunityEditor"));
const Statistics = lazy(() => import("./pages/statistics/Statistics"));

// Vocabulary
const VocabularySets = lazy(() => import("./pages/vocabulary/VocabularySets"));
const VocabSetDetail = lazy(() => import("./pages/vocabulary/VocabSetDetail"));
const CreateEditVocabSet = lazy(() => import("./pages/vocabulary/CreateEditVocabSet"));

// Explore
const Explore = lazy(() => import("./pages/explore/Explore"));
const ExploreAll = lazy(() => import("./pages/explore/ExploreAll"));
const ExploreSetDetail = lazy(() => import("./pages/explore/ExploreSetDetail"));

// Learn
const FlashcardSession = lazy(() => import("./pages/learn/FlashcardSession"));

// ─── Shared loading fallback ──────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading page…</p>
      </div>
    </div>
  );
}

// ─── Route guard ──────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <SessionExpiredManager />
        <Routes>
          {/* Auth Routes — no Suspense needed; pages are statically imported */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Main App Routes — lazy-loaded inside a shared Suspense boundary */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/vocabulary"
              element={
                <Suspense fallback={<PageLoader />}>
                  <VocabularySets />
                </Suspense>
              }
            />
            <Route
              path="/vocabulary/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CreateEditVocabSet />
                </Suspense>
              }
            />
            <Route
              path="/vocabulary/:setId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <VocabSetDetail />
                </Suspense>
              }
            />
            <Route
              path="/vocabulary/:setId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CreateEditVocabSet />
                </Suspense>
              }
            />
            <Route
              path="/learn/:setId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <FlashcardSession />
                </Suspense>
              }
            />
            <Route
              path="/learn/session"
              element={
                <Suspense fallback={<PageLoader />}>
                  <FlashcardSession />
                </Suspense>
              }
            />
            <Route
              path="/community"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Community />
                </Suspense>
              }
            />
            <Route
              path="/community/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CommunityEditor />
                </Suspense>
              }
            />
            <Route
              path="/community/post/:postId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CommunityPostDetail />
                </Suspense>
              }
            />
            <Route
              path="/community/post/:postId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CommunityEditor />
                </Suspense>
              }
            />
            <Route
              path="/explore"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Explore />
                </Suspense>
              }
            />
            <Route
              path="/explore/all"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ExploreAll />
                </Suspense>
              }
            />
            <Route
              path="/explore/:setId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ExploreSetDetail />
                </Suspense>
              }
            />
            <Route
              path="/settings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Settings />
                </Suspense>
              }
            />
            <Route
              path="/statistics"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Statistics />
                </Suspense>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </Provider>
  );
}
