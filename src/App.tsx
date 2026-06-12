import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedLayout } from './components/ProtectedLayout';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { Loader2 } from 'lucide-react';

// Lazy loading views
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const FakeNewsDetector = lazy(() => import('./pages/FakeNewsDetector').then(m => ({ default: m.FakeNewsDetector })));
const Chatbot = lazy(() => import('./pages/Chatbot').then(m => ({ default: m.Chatbot })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const SavedReports = lazy(() => import('./pages/SavedReports').then(m => ({ default: m.SavedReports })));
const AnalysisHistory = lazy(() => import('./pages/AnalysisHistory').then(m => ({ default: m.AnalysisHistory })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const TrendingFakeNews = lazy(() => import('./pages/TrendingFakeNews').then(m => ({ default: m.TrendingFakeNews })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const NewsCategory = lazy(() => import('./pages/NewsCategory').then(m => ({ default: m.NewsCategory })));

function SuspenseFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="truthlens-theme">
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<SuspenseFallback />}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/detect" element={<FakeNewsDetector />} />
                  <Route path="/news" element={<NewsCategory />} />
                  <Route path="/chat" element={<Chatbot />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/history" element={<AnalysisHistory />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/trending" element={<TrendingFakeNews />} />
                  <Route path="/saved-reports" element={<SavedReports />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <Toaster />
          </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

