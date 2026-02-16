import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { useAuth } from "./hooks/auth-hooks/use-auth";
import { AuthProvider } from "./contexts/AuthProvider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DatabaseDetails from "./pages/DatabaseDetails";
import NotFound from "./pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>

      <Route path="/databases/:name">
        <ProtectedRoute component={DatabaseDetails} />
      </Route>

      <Route path="/">
        <Redirect to={user ? "/dashboard" : "/login"} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
