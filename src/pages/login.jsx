import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useLang } from '../context/LangContext';
import PageCard from '../components/PageCard';

function normalizeError(err) {
  if (!err || !err.code) return err?.message || 'Login failed. Please try again.';
  switch (err.code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with that email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    default:
      return err.message || 'Login failed. Please try again.';
  }
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setSubmitting(true);
    if (!email || !password) {
      setError('Email and password are required.');
      setSubmitting(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setStatus('');
    if (!email) {
      setError('Enter your email address to reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(normalizeError(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      {/* Language toggle top-right */}
      <button
        type="button"
        onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
        className="fixed top-4 right-4 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        aria-label="Switch language"
      >
        {lang === 'en' ? 'አማርኛ' : 'English'}
      </button>

      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 text-white text-2xl font-bold mb-4 shadow-lg">
            AC
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Addis Crown Production ERP
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>

        <PageCard>
          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {status && (
            <div role="status" className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 px-4 py-3 text-sm text-green-700 dark:text-green-300">
              {status}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="form-input w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                Forgot password?
              </button>
              <button
                id="login-submit"
                type="submit"
                disabled={submitting}
                className="btn-primary min-w-[100px]"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        </PageCard>
      </div>
    </div>
  );
};

export default LoginPage;
