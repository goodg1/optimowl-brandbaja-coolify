import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CreatePostPage from "./pages/CreatePostPage";
import DraftsPage from "./pages/DraftsPage";
import PendingPage from "./pages/PendingPage";
import ScheduledPage from "./pages/ScheduledPage";
import PublishedPage from "./pages/PublishedPage";
import CalendarPage from "./pages/CalendarPage";
import BrandsPage from "./pages/BrandsPage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import MediaPage from "./pages/MediaPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ManualQueuePage from "./pages/ManualQueuePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><BrandProvider><DashboardPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><BrandProvider><CreatePostPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/drafts" element={<ProtectedRoute><BrandProvider><DraftsPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/pending" element={<ProtectedRoute><BrandProvider><PendingPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/scheduled" element={<ProtectedRoute><BrandProvider><ScheduledPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/published" element={<ProtectedRoute><BrandProvider><PublishedPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><BrandProvider><CalendarPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/brands" element={<ProtectedRoute><BrandProvider><BrandsPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><BrandProvider><TeamPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><BrandProvider><SettingsPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/media" element={<ProtectedRoute><BrandProvider><MediaPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><BrandProvider><AnalyticsPage /></BrandProvider></ProtectedRoute>} />
      <Route path="/manual-queue" element={<ProtectedRoute><BrandProvider><ManualQueuePage /></BrandProvider></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;