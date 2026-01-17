import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE_URL = 'https://nonlaminated-subliminally-latanya.ngrok-free.dev/api';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status/`, {
        credentials: 'include',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsLoggedIn(true);
          setUsername(data.username);
        } else {
          setIsLoggedIn(false);
          setUsername(null);
        }
      } else {
        setIsLoggedIn(false);
        setUsername(null);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsLoggedIn(false);
      setUsername(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (usernameInput: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ username: usernameInput, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUsername(data.username);
        return { success: true };
      } else {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.error || 'Invalid username or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      setUsername(null);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, isLoading, login, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
