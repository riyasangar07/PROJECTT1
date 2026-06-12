import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function Login() {
  const { user, signIn, signInGuest, loading } = useAuth();
  
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signIn();
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl bg-card border border-border flex flex-col items-center shadow-2xl relative overflow-hidden"
      >
         <div className="absolute inset-0 bg-gradient-to-tl from-primary/10 to-transparent pointer-events-none" />
         
         <div className="w-20 h-20 bg-background rounded-2xl border border-border flex items-center justify-center mb-6 relative z-10 shadow-lg">
            <ShieldCheck className="text-primary w-10 h-10" />
         </div>
         
         <h1 className="text-3xl font-bold text-foreground mb-2 relative z-10 text-center">TruthLens AI</h1>
         <p className="text-muted-foreground mb-8 relative z-10 leading-relaxed text-center">
            Sign in to uncover the truth and analyze news credibility securely.
         </p>

         <AnimatePresence mode="wait">
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full mb-6 relative z-10"
              >
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">{authError}</p>
                </div>
              </motion.div>
            )}
         </AnimatePresence>
         
         <Button 
           type="button"
           onClick={handleGoogleSignIn} 
           disabled={isSigningIn}
           className="w-full h-14 bg-white text-black hover:bg-gray-100 border border-gray-200 text-base relative z-10 font-bold rounded-xl shadow-sm transition-all mb-4"
         >
           {isSigningIn ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : (
             <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.73 17.57V20.34H19.3C21.38 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.3 20.34L15.73 17.57C14.74 18.23 13.48 18.63 12 18.63C9.14 18.63 6.71 16.7 5.84 14.09H2.15V16.95C3.96 20.55 7.68 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.05H2.15C1.41 8.53 1 10.21 1 12C1 13.79 1.41 15.47 2.15 16.95L5.84 14.09Z" fill="#FBBC05"/>
                <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.38 3.84C17.45 2.04 14.96 1 12 1C7.68 1 3.96 3.45 2.15 7.05L5.84 9.91C6.71 7.3 9.14 5.38 12 5.38Z" fill="#EA4335"/>
             </svg>
           )}
           Sign in with Google
         </Button>

         <Button 
           type="button"
           onClick={signInGuest} 
           disabled={isSigningIn}
           className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-base relative z-10 font-bold rounded-xl shadow-md transition-all mb-4"
         >
           Sign in as Guest
         </Button>

         <p className="text-xs text-muted-foreground mt-4 text-center relative z-10 w-full opacity-60">
           By continuing, you agree to our Terms of Service.
         </p>
      </motion.div>
    </div>
  );
}
