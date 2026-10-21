import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('affinova_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('affinova_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('affinova_token');
      if (!storedToken) {
        // Fallback for direct dashboard access during development / testing
        const storedUser = localStorage.getItem('affinova_user');
        if (!storedUser) {
          // Redirect unauthenticated users to login page
          window.location.href = '/login.html';
          return;
        }
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          localStorage.setItem('affinova_user', JSON.stringify(userData));
        } else {
          // Token expired or invalid
          console.warn('Session expired, please log in again.');
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('affinova_token');
    localStorage.removeItem('affinova_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login.html';
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('affinova_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
