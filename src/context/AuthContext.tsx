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
  updatePassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { ref, remove, set, get } from 'firebase/database';
import { auth, database } from '../config/firebase';
import toast from 'react-hot-toast';

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
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
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
  signInWithGoogle: async () => {},
  signInWithFacebook: async () => {},
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

    // Handle redirect result first
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          await saveUserToDatabase(result.user);
          
          // Check if admin and show appropriate message
          if (result.user.email === 'gangadhar.g0516@gmail.com') {
            toast.success('Welcome back, Admin!');
          } else {
            toast.success('Successfully signed in!');
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        if (error instanceof FirebaseError) {
          switch (error.code) {
            case 'auth/account-exists-with-different-credential':
              toast.error('An account already exists with this email using a different sign-in method');
              break;
            case 'auth/operation-not-allowed':
              toast.error('Social sign-in is not enabled. Please contact support.');
              break;
            default:
              toast.error('Failed to sign in. Please try again.');
          }
        } else {
          toast.error('An unexpected error occurred during sign-in.');
        }
      }
    };

    handleRedirectResult();

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

  const saveUserToDatabase = async (firebaseUser: FirebaseUser, additionalData?: { name?: string }) => {
    const userRef = ref(database, `users/${firebaseUser.uid}`);
    const userData = {
      email: firebaseUser.email,
      name: additionalData?.name || firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await set(userRef, userData);
    
    setUser({
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: userData.name,
      photoURL: firebaseUser.photoURL,
    });
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Use redirect instead of popup for better compatibility
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Google sign in error:', error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/account-exists-with-different-credential':
            throw new Error('An account already exists with this email using a different sign-in method.');
          case 'auth/operation-not-allowed':
            throw new Error('Google sign-in is not enabled. Please contact support.');
          default:
            throw new Error('Failed to sign in with Google. Please try again.');
        }
      }
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Facebook sign in error:', error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/account-exists-with-different-credential':
            throw new Error('An account already exists with this email using a different sign-in method.');
          case 'auth/operation-not-allowed':
            throw new Error('Facebook sign-in is not enabled. Please contact support.');
          default:
            throw new Error('Failed to sign in with Facebook. Please try again.');
        }
      }
      throw error;
    }
  };

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
      await saveUserToDatabase(result.user, { name });
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
      signInWithGoogle,
      signInWithFacebook,
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