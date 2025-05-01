import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType<any>;
  allowedRoles?: string[];
};

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: ProtectedRouteProps) {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <Route path={path}>
      {(props) => {
        // Only redirect to auth if we're not already on the auth page and we're certain there's no user
        if (!user && !isLoading && location !== "/auth") {
          console.log("No user found, redirecting to auth");
          return <Redirect to="/auth" />;
        }
        
        // Check role-based access
        if (user && allowedRoles && !allowedRoles.includes(user.role)) {
          console.log("User role not allowed, redirecting to home");
          return <Redirect to="/" />;
        }
        
        // Render the protected component
        return <Component {...props} />;
      }}
    </Route>
  );
}
