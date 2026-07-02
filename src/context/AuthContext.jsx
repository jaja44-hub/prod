import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { setActiveTenant } from '../services/ServiceGateway';

const AuthContext = createContext(null);

async function profileFromToken(user) {
  const tokenResult = await user.getIdTokenResult();
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email,
    role: tokenResult.claims?.role || 'viewer',
    tenantId: tokenResult.claims?.tenantId || 'production',
    tier: tokenResult.claims?.tier ?? 1,
  };
}

async function loadUserProfile(user) {
  const tokenProfile = await profileFromToken(user);
  if (!db) return tokenProfile;

  for (const collection of ['users', 'users_extended']) {
    try {
      const snap = await getDoc(doc(db, collection, user.uid));
      if (!snap.exists()) continue;
      const data = snap.data();
      return {
        id: snap.id,
        ...data,
        uid: user.uid,
        email: data.email || tokenProfile.email,
        name: data.name || tokenProfile.name,
        role: data.role || tokenProfile.role,
        tenantId: data.tenantId || tokenProfile.tenantId,
        tier: data.tier ?? tokenProfile.tier,
      };
    } catch (err) {
      const code = err?.code || '';
      if (code !== 'permission-denied') {
        console.warn(`AuthContext: could not read ${collection}/${user.uid}`, err);
      }
    }
  }

  return tokenProfile;
}

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
        const profile = await loadUserProfile(user);
        setUserProfile(profile);
        if (profile?.tenantId) {
          setActiveTenant(profile.tenantId);
        }
      } catch (err) {
        console.error('AuthContext: failed to load user profile', err);
        try {
          const profile = await profileFromToken(user);
          setUserProfile(profile);
          if (profile.tenantId) setActiveTenant(profile.tenantId);
        } catch (tokenErr) {
          console.error('AuthContext: token fallback failed', tokenErr);
        }
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

  const value = useMemo(() => ({ currentUser, userProfile, user: userProfile, loading, logout, authError }), [currentUser, userProfile, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
