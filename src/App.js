import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Home from './components/Home';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import DocentePanel from './components/DocentePanel';
import ErrorBoundary from './components/ErrorBoundary';

import { InstitutionProvider } from './context/InstitutionContext';

function App() {
  return (
    <ErrorBoundary>
      <InstitutionProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login-admin" element={<Navigate to="/login" replace />} />
              <Route path="/login-docente" element={<Navigate to="/login" replace />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/docente" element={<DocentePanel />} />
            </Routes>
          </div>
        </Router>
      </InstitutionProvider>
    </ErrorBoundary>
  );
}

export default App;
