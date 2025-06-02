import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import HomePage from './pages/HomePage';
import CreateGamePage from './pages/CreateGamePage';
import JoinGamePage from './pages/JoinGamePage';
import GameRoomPage from './pages/GameRoomPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <GameProvider>
          <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 text-white">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateGamePage />} />
              <Route path="/join" element={<JoinGamePage />} />
              <Route path="/game/:gameId" element={<GameRoomPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e1b4b',
                color: '#fff',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              },
            }}
          />
        </GameProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;