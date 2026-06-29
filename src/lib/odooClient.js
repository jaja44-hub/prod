import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

function waitForAuthUser(timeoutMs = 10000) {
  if (!auth) return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsub();
      reject(new Error('Timed out waiting for Firebase auth'));
    }, timeoutMs);

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        clearTimeout(timer);
        unsub();
        resolve(user);
      }
    });
  });
}

async function getAuthHeader() {
  try {
    const user = auth?.currentUser || await waitForAuthUser();
    if (!user) return {};
    const token = await user.getIdToken(true);
    return { Authorization: `Bearer ${token}` };
  } catch (error) {
    console.warn('[Odoo Client] Failed to get ID token', error);
    return {};
  }
}

/**
 * Universal Odoo Client wrapper for React.
 * Routes requests through the Vercel serverless proxy with Firebase Bearer auth.
 */
export const odooClient = {
  async execute(model, method, args = [], kwargs = {}) {
    const headers = await getAuthHeader();
    if (!headers.Authorization) {
      throw new Error('Not authenticated — sign in to access ERP data');
    }

    try {
      const response = await axios.post('/api/odooProxy', {
        model,
        method,
        args,
        kwargs,
      }, { headers });

      if (response.data?.success === false) {
        throw new Error(response.data?.error || 'Odoo proxy request failed');
      }

      return response.data.data;
    } catch (error) {
      console.error('[Odoo Client Error]', error?.response?.data || error.message);
      throw error;
    }
  },
};
