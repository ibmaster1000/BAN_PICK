import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { BanPickProvider } from './contexts/BanPickContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BanPickRoom from './pages/BanPickRoom';
import TournamentLobby from './pages/TournamentLobby';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BanPickProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/lobby" element={
                <ProtectedRoute>
                  <TournamentLobby />
                </ProtectedRoute>
              } />
              <Route path="/banpick/:roomId" element={
                <ProtectedRoute>
                  <BanPickRoom />
                </ProtectedRoute>
              } />
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </BanPickProvider>
    </AuthProvider>
  );
}

export default App;