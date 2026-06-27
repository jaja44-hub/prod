import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import ThemeProvider from './utils/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <LangProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </LangProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
