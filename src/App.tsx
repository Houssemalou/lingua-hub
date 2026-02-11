import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { PlatformProvider } from "./contexts/PlatformContext";
import { MainLayout } from "./components/layout/MainLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminLiveSession from "./pages/admin/AdminLiveSession";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminQuizResults from "./pages/admin/AdminQuizResults";
import AdminPlatformSettings from "./pages/admin/AdminPlatformSettings";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSessions from "./pages/student/StudentSessions";
import StudentLiveRoom from "./pages/student/StudentLiveRoom";
import StudentProfile from "./pages/student/StudentProfile";
import StudentProgress from "./pages/student/StudentProgress";
import StudentSessionSummaries from "./pages/student/StudentSessionSummaries";
import StudentGames from "./pages/student/StudentGames";
import ProfessorDashboard from "./pages/professor/ProfessorDashboard";
import ProfessorSessions from "./pages/professor/ProfessorSessions";
import ProfessorQuizzes from "./pages/professor/ProfessorQuizzes";
import ProfessorProfile from "./pages/professor/ProfessorProfile";
import ProfessorLiveRoom from "./pages/professor/ProfessorLiveRoom";
import ProfessorSessionSummaries from "./pages/professor/ProfessorSessionSummaries";
import ProfessorChallenges from "./pages/professor/ProfessorChallenges";
import ProfessorEvaluations from "./pages/professor/ProfessorEvaluations";
import StudentEvaluations from "./pages/student/StudentEvaluations";
import AuthPage from "./pages/auth/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <PlatformProvider>
          <AuthProvider>
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
                    <Route path="/admin/quiz-results" element={<AdminQuizResults />} />
                    <Route path="/admin/settings" element={<AdminPlatformSettings />} />
                    {/* Student Routes */}
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/sessions" element={<StudentSessions />} />
                    <Route path="/student/room/:roomId" element={<StudentLiveRoom />} />
                    <Route path="/student/profile" element={<StudentProfile />} />
                    <Route path="/student/progress" element={<StudentProgress />} />
                    <Route path="/student/summaries" element={<StudentSessionSummaries />} />
                    <Route path="/student/games" element={<StudentGames />} />
                    <Route path="/student/evaluations" element={<StudentEvaluations />} />
                    {/* Professor Routes */}
                    <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
                    <Route path="/professor/sessions" element={<ProfessorSessions />} />
                    <Route path="/professor/quizzes" element={<ProfessorQuizzes />} />
                    <Route path="/professor/profile" element={<ProfessorProfile />} />
                    <Route path="/professor/room/:roomId" element={<ProfessorLiveRoom />} />
                    <Route path="/professor/summaries" element={<ProfessorSessionSummaries />} />
                    <Route path="/professor/challenges" element={<ProfessorChallenges />} />
                    <Route path="/professor/evaluations" element={<ProfessorEvaluations />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </PlatformProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
