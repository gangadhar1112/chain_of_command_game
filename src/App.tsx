import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import HomePage from './pages/HomePage';
import CreateGamePage from './pages/CreateGamePage';
import JoinGamePage from './pages/JoinGamePage';
import GameRoomPage from './pages/GameRoomPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <GameProvider>
        <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 text-white">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateGamePage />} />
            <Route path="/join" element={<JoinGamePage />} />
            <Route path="/game/:gameId" element={<GameRoomPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </GameProvider>
    </Router>
  );
}

export default App;