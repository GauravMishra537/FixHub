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
import CreateTicketPage from './pages/CreateTicketPage'
import TicketDetailsPage from './pages/TicketDetailsPage'
import AdminTicketsPage from './pages/admin/AdminTicketsPage'
import TicketsPage from './pages/TicketsPage'
import UserPage from './pages/admin/UserPage'
import RegistrationPage from './pages/admin/RegistrationPage'
import TicketHistoryPage from './pages/admin/TicketHistoryPage'
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
              <Route path="issues/new" element={<CreateTicketPage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="tickets/:id" element={<TicketDetailsPage />} />
              <Route path="rooms" element={<ComingSoonPage title="Room Booking" />} />
              <Route path="resources" element={<ComingSoonPage title="Resource Requests" />} />
              <Route path="topics" element={<ComingSoonPage title="Learning / Topic Requests" />} />
              <Route path="oauth/callback" element={<OAuthCallbackPage />} />
              
              {/* Protected Administrator Route */}
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="admin/org-setup" element={<OrgSetupPage />} />
                <Route path="admin/skill-review" element={<SkillReviewPage />} />
                                <Route path="admin/ticket-history" element={<TicketHistoryPage />} />
                <Route path="admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="admin/users" element={<UsersPage />} />
                <Route path="admin/users/:id" element={<UserPage />} />
                <Route path="admin/requests/:id" element={<RegistrationPage />} />
                <Route path="admin/tickets" element={<AdminTicketsPage />} />
                <Route path="admin/issues" element={<TicketsPage key="ISSUE" type="ISSUE" title="Issues" />} />
                <Route path="admin/rooms" element={<TicketsPage key="ROOM_BOOKING" type="ROOM_BOOKING" title="Room bookings" />} />
                <Route path="admin/resources" element={<TicketsPage key="RESOURCE_REQUEST" type="RESOURCE_REQUEST" title="Resource requests" />} />
                <Route path="admin/topics" element={<TicketsPage key="TOPIC_REQUEST" type="TOPIC_REQUEST" title="Topic requests" />} />
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
