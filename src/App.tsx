import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { store } from "./store";
import AuthLayout from "./components/layout/AuthLayout";
import MainLayout from "./components/layout/MainLayout";
import { useSelector } from "react-redux";
import { RootState } from "./store";
import SessionExpiredManager from "./components/common/SessionExpiredManager";
import { useNotificationSocket } from "./hooks/useNotificationSocket";

// ─── Auth pages (small, loaded eagerly since they're the entry point) ─────────
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// ─── Main app pages (lazy-loaded, each becomes its own JS chunk) ──────────────
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));

// Admin Layout & Pages
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUserManagement = lazy(() => import("./pages/admin/AdminUserManagement"));
const AdminContentModeration = lazy(() => import("./pages/admin/AdminContentModeration"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const AdminVocabularySets = lazy(() => import("./pages/admin/AdminVocabularySets"));
const AdminVocabSetDetail = lazy(() => import("./pages/admin/AdminVocabSetDetail"));
const AdminCreateEditVocabSet = lazy(() => import("./pages/admin/AdminCreateEditVocabSet"));
const Community = lazy(() => import("./pages/community/Community"));
const CommunityPostDetail = lazy(() => import("./pages/community/CommunityPostDetail"));
const CommunityEditor = lazy(() => import("./pages/community/CommunityEditor"));
const MyContentManager = lazy(() => import("./pages/community/MyContentManager"));
const AdminCommunityPosts = lazy(() => import("./pages/admin/AdminCommunityPosts"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));
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

// Practice
const Practice = lazy(() => import("./pages/practice/Practice"));
const PracticeSession = lazy(() => import("./pages/practice/PracticeSession"));
// UC-15 Listening Practice — trang phiên theo docs/frontend/uc-15-listening/component-design.md
const ListeningSession = lazy(() => import("./pages/practice/ListeningSession"));

// Voice AI (UC-13) — page duy nhất theo spec; route cũ /voice-ai redirect về /voice-chat
const VoiceChatPage = lazy(() => import("./pages/voiceai/VoiceChatPage"));

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
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
  return <>{children}</>;
};

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

const RootRedirect = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
  return <Navigate to="/dashboard" />;
};

// UC-15 Listening — điểm vào /practice/listening tự chuyển vào phiên, giữ nguyên query ?level= (ui-flow.md)
const ListeningEntryRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/practice/listening/session${search}`} replace />;
};

// ─── App ──────────────────────────────────────────────────────────────────────
const SocketInitializer = ({ children }: { children: React.ReactNode }) => {
  useNotificationSocket();
  return <>{children}</>;
};

export default function App() {
  return (
    <Provider store={store}>
      <SocketInitializer>
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
            <Route
              path="/notifications"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotificationsPage />
                </Suspense>
              }
            />
            <Route
              path="/my-content"
              element={
                <Suspense fallback={<PageLoader />}>
                  <MyContentManager />
                </Suspense>
              }
            />
            <Route
              path="/practice"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Practice />
                </Suspense>
              }
            />
            <Route
                          path="/practice/session"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <PracticeSession />
                            </Suspense>
                          }
                        />
                        {/* UC-15 Listening — /practice/listening là điểm vào, tự chuyển vào phiên (ui-flow.md Route Map) */}
                        <Route path="/practice/listening" element={<ListeningEntryRedirect />} />
                        <Route
                          path="/practice/listening/session"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <ListeningSession />
                            </Suspense>
                          }
                        />
                        {/* UC-13 Voice AI — route chuẩn theo FE spec đã chốt */}
                        <Route
                          path="/voice-chat"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <VoiceChatPage />
                            </Suspense>
                          }
                        />
                        {/* Route cũ /voice-ai — prototype đã chết (BE không có /chat, tier sai ObjectId); redirect sang /voice-chat */}
                        <Route path="/voice-ai" element={<Navigate to="/voice-chat" replace />} />
                        <Route path="/" element={<RootRedirect />} />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route
              path="/admin/dashboard"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route
              path="/admin/users"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminUserManagement />
                </Suspense>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminContentModeration />
                </Suspense>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminSettings />
                </Suspense>
              }
            />
            <Route
              path="/admin/vocabulary"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminVocabularySets />
                </Suspense>
              }
            />
            <Route
              path="/admin/vocabulary/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminCreateEditVocabSet />
                </Suspense>
              }
            />
            <Route
              path="/admin/vocabulary/:setId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminVocabSetDetail />
                </Suspense>
              }
            />
            <Route
              path="/admin/vocabulary/:setId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminCreateEditVocabSet />
                </Suspense>
              }
            />
            <Route
              path="/admin/posts"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminCommunityPosts />
                </Suspense>
              }
            />
            <Route
              path="/admin/posts/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CommunityEditor />
                </Suspense>
              }
            />
            <Route
              path="/admin/posts/:postId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CommunityPostDetail />
                </Suspense>
              }
            />
            <Route
              path="/admin/posts/:postId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CommunityEditor />
                </Suspense>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminNotificationsPage />
                </Suspense>
              }
            />
          </Route>

          {/* Maintenance Page */}
          <Route
            path="/maintenance"
            element={
              <Suspense fallback={<PageLoader />}>
                <Maintenance />
              </Suspense>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
      </SocketInitializer>
    </Provider>
  );
}
