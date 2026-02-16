import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider, useAuth } from "./hooks/use-auth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DatabaseDetails from "./pages/DatabaseDetails";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";


function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginWrapper />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              >

              </Route>

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/databases/:name"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DatabaseDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// --- Login Wrapper to redirect if already logged in ---
function LoginWrapper() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return <Login />;
}

export default App;
