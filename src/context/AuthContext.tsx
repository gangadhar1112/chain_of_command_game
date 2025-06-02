import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  deleteUser,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { ref, remove, set, get } from 'firebase/database';
import { auth, database } from '../config/firebase';

interface User {
  id: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUserProfile: (data: { name?: string; photoURL?: string }) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  deleteAccount: async () => {},
  updateUserProfile: async () => {},
  updateUserEmail: async () => {},
  updateUserPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Get additional user data from database
        const userRef = ref(database, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData?.name || firebaseUser.displayName,
          photoURL: userData?.photoURL || firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserProfile = async (data: { name?: string; photoURL?: string }) => {
    if (!auth.currentUser) return;

    try {
      await updateProfile(auth.currentUser, {
        displayName: data.name,
        photoURL: data.photoURL,
      });

      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      await set(userRef, {
        ...data,
        email: auth.currentUser.email,
        updatedAt: Date.now(),
      });

      setUser(prev => prev ? {
        ...prev,
        name: data.name || prev.name,
        photoURL: data.photoURL || prev.photoURL,
      } : null);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const updateUserEmail = async (email: string) => {
    if (!auth.currentUser) return;

    try {
      await updateEmail(auth.currentUser, email);
      
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      await set(userRef, {
        email,
        updatedAt: Date.now(),
      });

      setUser(prev => prev ? { ...prev, email } : null);
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    }
  };

  const updateUserPassword = async (password: string) => {
    if (!auth.currentUser) return;

    try {
      await updatePassword(auth.currentUser, password);
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      const userRef = ref(database, `users/${result.user.uid}`);
      await set(userRef, {
        email: result.user.email,
        name: name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      setUser({
        id: result.user.uid,
        email: result.user.email,
        name: name,
        photoURL: null,
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userRef = ref(database, `users/${result.user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();

      setUser({
        id: result.user.uid,
        email: result.user.email,
        name: userData?.name || result.user.displayName,
        photoURL: userData?.photoURL || result.user.photoURL,
      });
    } catch (error) {
      // Only log non-invalid-credential errors
      if (!(error instanceof FirebaseError) || error.code !== 'auth/invalid-credential') {
        console.error('Signin error:', error);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;

    try {
      if (user) {
        const userGamesRef = ref(database, `userGames/${user.id}`);
        const userDataRef = ref(database, `users/${user.id}`);
        await remove(userGamesRef);
        await remove(userDataRef);
      }

      await deleteUser(auth.currentUser);
      setUser(null);
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signUp, 
      signIn, 
      logout,
      resetPassword,
      deleteAccount,
      updateUserProfile,
      updateUserEmail,
      updateUserPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};