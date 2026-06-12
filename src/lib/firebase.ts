import { initializeApp } from 'firebase/app';
import { 
  getAuth as fbGetAuth, 
  onAuthStateChanged as fbOnAuthStateChanged, 
  signOut as fbSignOut, 
  GoogleAuthProvider as fbGoogleAuthProvider, 
  signInWithPopup as fbSignInWithPopup,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  updateProfile as fbUpdateProfile,
  sendPasswordResetEmail as fbSendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore as fbGetFirestore,
  collection as fbCollection,
  doc as fbDoc,
  getDocs as fbGetDocs,
  addDoc as fbAddDoc,
  setDoc as fbSetDoc,
  deleteDoc as fbDeleteDoc,
  query as fbQuery,
  where as fbWhere,
  orderBy as fbOrderBy,
  limit as fbLimit,
  writeBatch as fbWriteBatch
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB5a5y791lUGWpr991sWHQko-rXlS7LGvs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "truthlens-ai-57a2c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "truthlens-ai-57a2c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "truthlens-ai-57a2c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "615579541019",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:615579541019:web:4011da06e8c5d0f086e2be",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YNDK6P6RS0"
};

// Check if we should default to mock mode.
// We default to mock if the API key is the default one OR empty.
const DEFAULT_API_KEY = "AIzaSyB5a5y791lUGWpr991sWHQko-rXlS7LGvs";
const isDefaultConfig = firebaseConfig.apiKey === DEFAULT_API_KEY || !firebaseConfig.apiKey || firebaseConfig.apiKey === "";

// Global mock state
let localMode = isDefaultConfig;
if (localStorage.getItem('force_firebase') === 'true') {
  localMode = false;
}

// Initialize real Firebase (wrapped in try-catch to prevent crashing if SDK errors)
let realApp: any = null;
let realAuth: any = null;
let realDb: any = null;

try {
  realApp = initializeApp(firebaseConfig);
  realAuth = fbGetAuth(realApp);
  realDb = fbGetFirestore(realApp);
} catch (e) {
  console.warn("Firebase failed to initialize. Falling back to local mode.", e);
  localMode = true;
}

// --- MOCK IMPLEMENTATION ---

// Subscribers for auth state changes
const authSubscribers = new Set<(user: any) => void>();
let mockCurrentUser: any = null;

// Load mock user from localStorage if it exists
try {
  const savedUser = localStorage.getItem('mock_user');
  if (savedUser) {
    mockCurrentUser = JSON.parse(savedUser);
  }
} catch (e) {}

// Helper to notify auth subscribers
const notifyAuthSubscribers = () => {
  const user = localMode ? mockCurrentUser : (realAuth ? realAuth.currentUser : null);
  authSubscribers.forEach(sub => sub(user));
};

// Mock Auth wrapper
export const auth = {
  get currentUser() {
    if (localMode) return mockCurrentUser;
    return realAuth ? realAuth.currentUser : null;
  }
};

// Mock Firestore DB wrapper
export const db = {
  isMock: () => localMode,
  setLocalMode: (val: boolean) => {
    localMode = val;
    notifyAuthSubscribers();
  }
};

// Re-export GoogleAuthProvider
export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
  setCustomParameters(params: any) {}
}

// Re-export Auth Functions
export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  if (localMode) {
    authSubscribers.add(callback);
    // Call immediately with current mock user
    setTimeout(() => callback(mockCurrentUser), 0);
    return () => authSubscribers.delete(callback);
  } else {
    return fbOnAuthStateChanged(realAuth, (user) => {
      callback(user);
    });
  }
}

export async function signInWithPopup(authInstance: any, provider: any) {
  if (localMode) {
    const mockUser = {
      uid: "guest-google-" + Math.random().toString(36).substring(2, 9),
      email: "guest.developer@truthlens.ai",
      displayName: "Developer Guest",
      photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=developer"
    };
    mockCurrentUser = mockUser;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    notifyAuthSubscribers();
    return { user: mockUser };
  } else {
    return fbSignInWithPopup(realAuth, provider);
  }
}

export async function signOut(authInstance: any) {
  if (localMode) {
    mockCurrentUser = null;
    localStorage.removeItem('mock_user');
    notifyAuthSubscribers();
    return;
  } else {
    await fbSignOut(realAuth);
    mockCurrentUser = null;
    localStorage.removeItem('mock_user');
    notifyAuthSubscribers();
  }
}

// Custom guest sign in method
export function signInAsGuest() {
  localMode = true;
  const mockUser = {
    uid: "guest-user-" + Math.random().toString(36).substring(2, 9),
    email: "guest@truthlens.ai",
    displayName: "Guest User",
    photoURL: null
  };
  mockCurrentUser = mockUser;
  localStorage.setItem('mock_user', JSON.stringify(mockUser));
  notifyAuthSubscribers();
  return mockUser;
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  if (localMode) {
    const mockUser = {
      uid: "guest-mail-" + Math.random().toString(36).substring(2, 9),
      email: email,
      displayName: email.split('@')[0],
      photoURL: null
    };
    mockCurrentUser = mockUser;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    notifyAuthSubscribers();
    return { user: mockUser };
  } else {
    return fbCreateUserWithEmailAndPassword(realAuth, email, pass);
  }
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  if (localMode) {
    const mockUser = {
      uid: "guest-mail-" + Math.random().toString(36).substring(2, 9),
      email: email,
      displayName: email.split('@')[0],
      photoURL: null
    };
    mockCurrentUser = mockUser;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    notifyAuthSubscribers();
    return { user: mockUser };
  } else {
    return fbSignInWithEmailAndPassword(realAuth, email, pass);
  }
}

export async function updateProfile(userInstance: any, { displayName, photoURL }: { displayName?: string, photoURL?: string }) {
  if (localMode) {
    if (mockCurrentUser) {
      if (displayName !== undefined) mockCurrentUser.displayName = displayName;
      if (photoURL !== undefined) mockCurrentUser.photoURL = photoURL;
      localStorage.setItem('mock_user', JSON.stringify(mockCurrentUser));
      notifyAuthSubscribers();
    }
    return;
  } else {
    return fbUpdateProfile(userInstance, { displayName, photoURL });
  }
}

export async function sendPasswordResetEmail(authInstance: any, email: string) {
  if (localMode) {
    return;
  } else {
    return fbSendPasswordResetEmail(realAuth, email);
  }
}

// --- FIRESTORE DATABASE MOCK IMPLEMENTATION ---

// Helper to get/set local storage collections
const getLocalCollection = (name: string): any[] => {
  try {
    const data = localStorage.getItem(`db_${name}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalCollection = (name: string, data: any[]) => {
  try {
    localStorage.setItem(`db_${name}`, JSON.stringify(data));
  } catch (e) {}
};

// References
export function collection(dbInstance: any, path: string) {
  if (localMode) {
    return { type: 'collection', path };
  } else {
    return fbCollection(realDb, path);
  }
}

export function doc(dbOrColInstance: any, pathOrId: string, ...rest: string[]) {
  if (localMode) {
    if (dbOrColInstance && dbOrColInstance.type === 'collection') {
      return { type: 'doc', collectionPath: dbOrColInstance.path, id: pathOrId };
    } else {
      return { type: 'doc', collectionPath: pathOrId, id: rest[0] };
    }
  } else {
    if (dbOrColInstance && dbOrColInstance.type === 'collection') {
      return fbDoc(dbOrColInstance as any, pathOrId);
    }
    if (typeof dbOrColInstance === 'object' && dbOrColInstance && 'path' in dbOrColInstance) {
      return fbDoc(dbOrColInstance as any, pathOrId);
    }
    return fbDoc(realDb, pathOrId, ...rest);
  }
}

// Database Writes
export async function addDoc(collectionRef: any, data: any) {
  if (localMode) {
    const id = "mock-doc-" + Math.random().toString(36).substring(2, 11);
    const docData = { ...data, id, timestamp: data.timestamp || new Date().toISOString() };
    const list = getLocalCollection(collectionRef.path);
    list.push(docData);
    saveLocalCollection(collectionRef.path, list);
    return { id, data: () => docData };
  } else {
    return fbAddDoc(collectionRef, data);
  }
}

export async function setDoc(docRef: any, data: any, options?: any) {
  if (localMode) {
    const list = getLocalCollection(docRef.collectionPath);
    const index = list.findIndex(item => item.id === docRef.id);
    const existing = index > -1 ? list[index] : {};
    
    let updated;
    if (options && options.merge) {
      updated = { ...existing, ...data, id: docRef.id };
    } else {
      updated = { ...data, id: docRef.id };
    }

    if (index > -1) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    saveLocalCollection(docRef.collectionPath, list);
    return;
  } else {
    return fbSetDoc(docRef, data, options);
  }
}

export async function deleteDoc(docRef: any) {
  if (localMode) {
    const list = getLocalCollection(docRef.collectionPath);
    const updated = list.filter(item => item.id !== docRef.id);
    saveLocalCollection(docRef.collectionPath, updated);
    return;
  } else {
    return fbDeleteDoc(docRef);
  }
}

// Database Queries
export function query(collectionRef: any, ...constraints: any[]) {
  if (localMode) {
    return { type: 'query', path: collectionRef.path, constraints };
  } else {
    return fbQuery(collectionRef, ...constraints);
  }
}

export function where(field: string, op: any, value: any) {
  if (localMode) {
    return { type: 'where', field, op, value };
  } else {
    return fbWhere(field, op, value);
  }
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  if (localMode) {
    return { type: 'orderBy', field, direction };
  } else {
    return fbOrderBy(field, direction);
  }
}

export function limit(count: number) {
  if (localMode) {
    return { type: 'limit', count };
  } else {
    return fbLimit(count);
  }
}

export async function getDocs(queryOrColRef: any) {
  if (localMode) {
    const path = queryOrColRef.path;
    let list = getLocalCollection(path);
    
    // If it's a query, apply constraints
    if (queryOrColRef.type === 'query' && queryOrColRef.constraints) {
      for (const c of queryOrColRef.constraints) {
        if (c.type === 'where') {
          if (c.op === '==') {
            list = list.filter(item => item[c.field] === c.value);
          }
        }
      }
      
      // Apply orderBy
      const orderConstraint = queryOrColRef.constraints.find((c: any) => c.type === 'orderBy');
      if (orderConstraint) {
        const { field, direction } = orderConstraint;
        list.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return direction === 'asc' ? -1 : 1;
          if (valA > valB) return direction === 'asc' ? 1 : -1;
          return 0;
        });
      }

      // Apply limit
      const limitConstraint = queryOrColRef.constraints.find((c: any) => c.type === 'limit');
      if (limitConstraint) {
        list = list.slice(0, limitConstraint.count);
      }
    }

    const docs = list.map(item => {
      const docRef = { type: 'doc', collectionPath: path, id: item.id || "mock-id" };
      return {
        id: item.id || "doc-id",
        ref: docRef,
        data: () => item
      };
    });

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (cb: (doc: any) => void) => docs.forEach(cb)
    };
  } else {
    return fbGetDocs(queryOrColRef);
  }
}

export function writeBatch(dbInstance: any) {
  if (localMode) {
    const operations: (() => void)[] = [];
    return {
      set: (docRef: any, data: any, options?: any) => {
        operations.push(() => {
          setDoc(docRef, data, options);
        });
      },
      delete: (docRef: any) => {
        operations.push(() => {
          deleteDoc(docRef);
        });
      },
      commit: async () => {
        operations.forEach(op => op());
      }
    };
  } else {
    return fbWriteBatch(realDb);
  }
}
