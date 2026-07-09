import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { setActiveTenant } from '../services/ServiceGateway';
import { fetchEnabledTenantModules } from '../lib/tenantSchema';
import { initApiClient, getApiClient } from '../lib/apiClient';

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
  const [enabledModules, setEnabledModules] = useState(null);
  const [tenantConfig, setTenantConfig] = useState(null);
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
        // Get ID token and initialize API client with Bearer token
        const idToken = await user.getIdToken();
        const profile = await loadUserProfile(user);
        
        // Initialize API client with token and tenant
        initApiClient({
          baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          authToken: idToken,
          tenantId: profile?.tenantId || 'production',
        });
        
        setUserProfile(profile);
        setEnabledModules(null);
        setTenantConfig(null);
        if (profile?.tenantId) {
          setActiveTenant(profile.tenantId);
          
          if (db) {
            getDoc(doc(db, 'tenants', profile.tenantId))
              .then((snap) => {
                if (snap.exists()) {
                  setTenantConfig(snap.data());
                } else {
                  setTenantConfig({ complianceProfile: 'global_flat' }); // safe fallback
                }
              })
              .catch((err) => {
                console.warn('AuthContext: failed to load tenant config', err);
                setTenantConfig({ complianceProfile: 'global_flat' });
              });
          }

          fetchEnabledTenantModules(profile.tenantId)
            .then((modules) => {
              setEnabledModules(Array.isArray(modules) ? modules : null);
            })
            .catch((err) => {
              console.warn('AuthContext: failed to load enabled tenant modules', err);
              setEnabledModules(null);
            });
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

  // Refresh ID token every 50 minutes (tokens expire in 60 minutes)
  useEffect(() => {
    if (!currentUser || !auth) return;
    
    const interval = setInterval(async () => {
      try {
        const idToken = await currentUser.getIdToken(true);
        const client = getApiClient();
        if (client) {
          client.setAuthToken(idToken);
        }
        console.debug('AuthContext: ID token refreshed');
      } catch (err) {
        console.warn('AuthContext: token refresh failed', err);
      }
    }, 50 * 60 * 1000); // 50 minutes
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase auth is not configured');
    }
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setEnabledModules(null);
    setTenantConfig(null);
  };

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      user: userProfile,
      enabledModules,
      tenantConfig,
      loading,
      authError,
      logout,
    }),
    [currentUser, userProfile, enabledModules, tenantConfig, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
