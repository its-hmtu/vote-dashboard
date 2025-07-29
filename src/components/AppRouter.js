import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import { Dashboard, Sessions, Users, Settings, Analytics, LoginPage } from "../pages";
import { AuthProvider } from "../contexts/AuthContext";
import { VotingProvider } from "../contexts/VotingContext";
import { PATH } from "../constants/PATH";

function AppRouter() {
  return (
    <AuthProvider>
      <VotingProvider>
        <BrowserRouter>
        <Routes>
          {/* Login route without layout */}
          <Route path={PATH.LOGIN} element={<LoginPage />} />
          
          {/* Dashboard routes with layout and protection */}
          <Route path="/" element={<Navigate to={PATH.DASHBOARD} replace />} />
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
            path={PATH.SETTINGS}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to={PATH.DASHBOARD} replace />} />
        </Routes>
      </BrowserRouter>
      </VotingProvider>
    </AuthProvider>
  );
}

export default AppRouter;
