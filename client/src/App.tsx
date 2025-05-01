import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { EmergencyProvider } from "@/hooks/use-emergency";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/lib/protected-route";
import { UserRole } from "@shared/schema";
import { useEffect } from "react";
import { connectWebSocket } from "@/lib/websocket";
import { AdminDashboard } from "@/components/AdminDashboard";

// Lazy load components
const HomePage = lazy(() => import("@/pages/home-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const ServicesPage = lazy(() => import("@/pages/services-page"));
const SettingsPage = lazy(() => import("@/pages/settings-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const ResponseTeamPage = lazy(() => import("@/pages/response-team-page"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const FacilitiesPage = lazy(() => import("@/pages/facilities-page"));
const SupportPage = lazy(() => import("@/pages/support-page"));
const AppointmentsPage = lazy(() => import("@/pages/appointments-page"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-primary">
    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
  </div>
);

export default function App() {
  useEffect(() => {
    connectWebSocket();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EmergencyProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Switch>
              <Route path="/auth" component={AuthPage} />
              <Route path="/verify-email/:token" component={VerifyEmailPage} />
              <Route path="/reset-password/:token" component={ResetPasswordPage} />
              <Route path="/forgot-password" component={ForgotPasswordPage} />
              <Route path="/" component={HomePage} />
              <ProtectedRoute path="/dashboard" component={DashboardPage} />
              <ProtectedRoute path="/services" component={ServicesPage} />
              <ProtectedRoute path="/settings" component={SettingsPage} />
              <ProtectedRoute path="/profile" component={ProfilePage} />
              <ProtectedRoute path="/facilities" component={FacilitiesPage} />
              <ProtectedRoute path="/support" component={SupportPage} />
              <ProtectedRoute path="/appointments" component={AppointmentsPage} />
              <ProtectedRoute 
                path="/admin" 
                component={AdminDashboard} 
                allowedRoles={[UserRole.ADMIN]} 
              />
              <ProtectedRoute 
                path="/response-team" 
                component={ResponseTeamPage}
                allowedRoles={[UserRole.RESPONSE_TEAM]} 
              />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
          <Toaster />
        </EmergencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}