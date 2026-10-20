import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminRoute from './components/common/AdminRoute'
import NotFoundPage from './pages/NotFoundPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AccountPage from './pages/AccountPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import OrgSetupPage from "./pages/admin/OrgSetupPage";
import SkillReviewPage from "./pages/admin/SkillReviewPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import UsersPage from './pages/admin/UsersPage'
import ComingSoonPage from './pages/ComingSoonPage'

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="issues" element={<ComingSoonPage title="Issue Tickets" />} />
              <Route path="rooms" element={<ComingSoonPage title="Room Booking" />} />
              <Route path="resources" element={<ComingSoonPage title="Resource Requests" />} />
              <Route path="topics" element={<ComingSoonPage title="Learning / Topic Requests" />} />
              <Route path="oauth/callback" element={<OAuthCallbackPage />} />
              
              {/* Protected Administrator Route */}
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="admin/org-setup" element={<OrgSetupPage />} />
                <Route path="admin/skill-review" element={<SkillReviewPage />} />
                <Route path="admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="admin/users" element={<UsersPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
