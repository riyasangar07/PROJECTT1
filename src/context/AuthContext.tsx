import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db,
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  doc, 
  setDoc,
  signInAsGuest
} from '@/lib/firebase';
import { toast } from 'sonner';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInGuest: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signInGuest: () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetPassword: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Store user data in Firestore
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      if (error.code === 'auth/unauthorized-domain') {
        toast.error("Unauthorized Domain", {
          description: "Please add this app's URL to your Firebase Console > Authentication > Settings > Authorized Domains.",
          duration: 10000,
        });
      } else {
        toast.error("Sign In Failed", {
          description: error.message || "An unexpected error occurred during sign in."
        });
      }
    }
  };

  const signInGuest = () => {
    try {
      const guestUser = signInAsGuest();
      setUser({
        uid: guestUser.uid,
        email: guestUser.email,
        displayName: guestUser.displayName,
        photoURL: guestUser.photoURL,
      });
      toast.success("Logged in as Guest", {
        description: "Running in local storage fallback mode.",
      });
    } catch (error: any) {
      toast.error("Guest Sign In Failed", { description: error.message });
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (error: any) {
      let description = error.message || "Invalid credentials.";
      if (error.code === 'auth/operation-not-allowed') {
         description = "Email/Password sign up is not enabled in the Firebase Console. Please go to Firebase Authentication > Sign-in method and enable Email/Password, or use Google Sign-In.";
      }
      toast.error("Sign In Failed", {
        description: description,
        duration: 8000
      });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          email: result.user.email,
          displayName: name,
          photoURL: null,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        }, { merge: true });
        
        // Manual state update to reflect new display name immediately
        setUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: name,
          photoURL: null,
        });
      }
    } catch (error: any) {
      let description = error.message || "Could not create account.";
      if (error.code === 'auth/operation-not-allowed') {
         description = "Email/Password sign up is not enabled in the Firebase Console. Please go to Firebase Authentication > Sign-in method and enable Email/Password, or use Google Sign-In.";
      }
      toast.error("Sign Up Failed", {
        description: description,
        duration: 8000
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
      toast.success("Password Reset Email Sent", { description: "Check your inbox." });
    } catch (error: any) {
      toast.error("Failed to Send Reset Email", { description: error.message });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInGuest, signInWithEmail, signUpWithEmail, resetPassword, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
