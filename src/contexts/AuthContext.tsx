import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://karts.tiago-coutinho.com'}/api`;

// Function to get CSRF token from cookies
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function getCSRFToken(): string | null {
  return getCookie('csrftoken');
}

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
      console.log('=== CHECKING AUTH STATUS ===');
      const response = await fetch(`${API_BASE_URL}/auth/status/`, {
        credentials: 'include',
      });
      
      console.log('Auth status response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth status data:', data);
        if (data.authenticated) {
          setIsLoggedIn(true);
          setUsername(data.username);
        } else {
          setIsLoggedIn(false);
          setUsername(null);
        }
      } else {
        console.log('Auth status check failed with status:', response.status);
        setIsLoggedIn(false);
        setUsername(null);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      // Don't block the app if auth check fails - just assume not logged in
      setIsLoggedIn(false);
      setUsername(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (usernameInput: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== LOGIN ATTEMPT STARTED ===');
      console.log('Username:', usernameInput);
      
      // First, ensure we have a CSRF token by hitting the status endpoint
      console.log('Fetching CSRF token...');
      await fetch(`${API_BASE_URL}/auth/status/`, {
        credentials: 'include',
      });
      
      const csrfToken = getCSRFToken();
      console.log('CSRF Token obtained:', csrfToken ? 'Yes' : 'No');
      
      console.log('Sending POST request to:', `${API_BASE_URL}/auth/login/`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ username: usernameInput, password }),
      });

      console.log('Response received. Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('LOGIN SUCCESS:', data);
        setIsLoggedIn(true);
        setUsername(data.username);
        return { success: true };
      } else {
        const data = await response.json().catch(() => ({}));
        console.log('LOGIN FAILED:', data);
        return { success: false, error: data.error || 'Invalid username or password' };
      }
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      return { success: false, error: 'Network error. Please check if the backend server is running.' };
    }
  };

  const logout = async () => {
    try {
      console.log('=== LOGGING OUT ===');
      const csrfToken = getCSRFToken();
      
      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
      
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
      console.log('Logout successful');
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
