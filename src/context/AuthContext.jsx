import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { setActiveTenant } from '../services/ServiceGateway';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setAuthError('Firebase auth is not configured');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (!user) {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      try {
        if (!db) {
          throw new Error('Firestore is not initialized.');
        }
        // Try 'users' collection first, fall back to 'users_extended'
        let profile = null;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          profile = { id: userDoc.id, ...userDoc.data() };
        } else {
          const extDoc = await getDoc(doc(db, 'users_extended', user.uid));
          if (extDoc.exists()) profile = { id: extDoc.id, ...extDoc.data() };
        }
        // If still no Firestore profile, derive minimal profile from Firebase Auth token claims
        if (!profile) {
          const tokenResult = await user.getIdTokenResult();
          profile = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email,
            role: tokenResult.claims?.role || 'viewer',
            tenantId: tokenResult.claims?.tenantId || 'production',
          };
        }
        setUserProfile(profile);
        if (profile?.tenantId) {
          setActiveTenant(profile.tenantId);
        }
      } catch (err) {
        console.error('AuthContext: failed to load user profile', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!currentUser && location.pathname !== '/login') {
        navigate('/login');
      }
      if (currentUser && location.pathname === '/login') {
        navigate('/dashboard');
      }
    }
  }, [loading, currentUser, location.pathname, navigate]);

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase auth is not configured');
    }
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const value = useMemo(() => ({ currentUser, userProfile, loading, logout, authError }), [currentUser, userProfile, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
