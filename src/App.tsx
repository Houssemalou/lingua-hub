import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider } from "./contexts/RoleContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminLiveSession from "./pages/admin/AdminLiveSession";
import AdminStudents from "./pages/admin/AdminStudents";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSessions from "./pages/student/StudentSessions";
import StudentLiveRoom from "./pages/student/StudentLiveRoom";
import StudentProfile from "./pages/student/StudentProfile";
import StudentProgress from "./pages/student/StudentProgress";
import AuthPage from "./pages/auth/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <RoleProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/auth" replace />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route element={<MainLayout />}>
                    {/* Admin Routes */}
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/rooms" element={<AdminRooms />} />
                    <Route path="/admin/rooms/:roomId" element={<AdminLiveSession />} />
                    <Route path="/admin/students" element={<AdminStudents />} />
                    {/* Student Routes */}
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/sessions" element={<StudentSessions />} />
                    <Route path="/student/room/:roomId" element={<StudentLiveRoom />} />
                    <Route path="/student/profile" element={<StudentProfile />} />
                    <Route path="/student/progress" element={<StudentProgress />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </RoleProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
