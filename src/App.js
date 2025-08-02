import "antd/dist/reset.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PATH } from "./constants/PATH";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppLayout } from "./components";
import {
  Analytics,
  Dashboard,
  Sessions,
  Settings,
  Users,
} from "./pages";
import { VotingProvider } from "./contexts/VotingContext";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <AuthProvider>
      <VotingProvider>
        <BrowserRouter>
          <Routes>
            <Route path={PATH.LOGIN} element={<LoginPage />} />
            <Route
              path="/"
              element={<Navigate to={PATH.DASHBOARD} replace />}
            />
            <Route
              path={PATH.DASHBOARD}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={PATH.ANALYTICS}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={PATH.SESSIONS}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Sessions />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={PATH.USERS}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Users />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {/* <Route
              path={PATH.SETTINGS}
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="*"
              element={<Navigate to={PATH.DASHBOARD} replace />}
            />
          </Routes>
        </BrowserRouter>
      </VotingProvider>
    </AuthProvider>
  );
}

export default App;
