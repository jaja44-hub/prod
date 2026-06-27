import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Grid,
  Paper,
  Alert,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/VpnKey';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizeError = (err) => {
    if (!err || !err.code) return err?.message || 'Login failed. Please try again.';
    switch (err.code) {
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support.';
      default:
        return err.message || 'Login failed. Please try again.';
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
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
    <Box
      sx={{
        backgroundColor: '#222D32',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            backgroundColor: '#1A2226',
            padding: 4,
            textAlign: 'center',
            boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2,
              color: '#27EF9F',
            }}
          >
            <KeyIcon sx={{ fontSize: 80 }} />
          </Box>
          <Typography variant="h5" sx={{ color: '#ECF0F5', fontWeight: 'bold', mb: 3 }}>
            ADMIN PANEL
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {error}
            </Alert>
          )}
          {status && (
            <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
              {status}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="standard"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputLabelProps={{ style: { color: '#6C6C6C', fontWeight: 'bold' } }}
                  InputProps={{
                    style: {
                      color: '#ECF0F5',
                      borderBottom: '2px solid #0DB8DE',
                    },
                  }}
                  sx={{ input: { backgroundColor: '#1A2226' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="standard"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputLabelProps={{ style: { color: '#6C6C6C', fontWeight: 'bold' } }}
                  InputProps={{
                    style: {
                      color: '#ECF0F5',
                      borderBottom: '2px solid #0DB8DE',
                    },
                  }}
                  sx={{ input: { backgroundColor: '#1A2226' } }}
                />
              </Grid>
            </Grid>
            <Grid container justifyContent="space-between" alignItems="center" mt={3}>
              <Grid item>
                <Button
                  type="button"
                  variant="text"
                  sx={{
                    color: '#0DB8DE',
                    fontWeight: 'bold',
                    letterSpacing: 1,
                    textTransform: 'none',
                  }}
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </Button>
              </Grid>
              <Grid item>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="outlined"
                  sx={{
                    color: '#0DB8DE',
                    borderColor: '#0DB8DE',
                    fontWeight: 'bold',
                    letterSpacing: 1,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#0DB8DE',
                      color: '#fff',
                    },
                  }}
                >
                  {submitting ? 'Signing in…' : 'LOGIN'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
