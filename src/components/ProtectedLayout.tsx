import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowLeft, Home } from 'lucide-react';
import { Navbar } from './Navbar';
import { Button } from '@/components/ui/button';

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isHome = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      {!isHome && (
        <div className="w-full bg-muted/20 border-b border-border py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
             <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
               <ArrowLeft className="w-4 h-4 mr-2" /> Back
             </Button>
             <div className="h-4 w-px bg-border" />
             <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
               <Home className="w-4 h-4 mr-2" /> Home
             </Button>
          </div>
        </div>
      )}
      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
    </div>
  );
}

