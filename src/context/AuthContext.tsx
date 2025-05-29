import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some((u: User) => u.email === email)) {
      throw new Error('User already exists');
    }

    // Create new user
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
    };

    // Save user credentials
    users.push({ ...newUser, password });
    localStorage.setItem('users', JSON.stringify(users));

    // Set current user
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const signIn = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const userWithoutPassword = {
      id: user.id,
      email: user.email,
    };

    setUser(userWithoutPassword);
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};