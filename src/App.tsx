import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Agents from "./pages/Agents";
import Flows from "./pages/Flows";
import Auth from "./pages/Auth";
import Stages from "./pages/Stages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </RequireAuth>
              }
            />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/agents"
              element={
                <RequireAuth requireAdmin>
                  <AppLayout>
                    <Agents />
                  </AppLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/flows"
              element={
                <RequireAuth requireAdmin>
                  <AppLayout>
                    <Flows />
                  </AppLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/stages"
              element={
                <RequireAuth requireAdmin>
                  <AppLayout>
                    <Stages />
                  </AppLayout>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;