import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Heart, Crown, Building2, Shield, Siren, Footprints, Users, Clock, Award, HelpCircle, XCircle, Lock, CheckCircle2, XCircle as XCircle2 } from 'lucide-react';
import Header from '../components/Header';
import Button from '../components/Button';
import PlayerCard from '../components/PlayerCard';
import RoleCard from '../components/RoleCard';
import GameResults from '../components/GameResults';
import GameInterruptionModal from '../components/GameInterruptionModal';

const GameRoomPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const {
    gameState,
    currentPlayer,
    players,
    isHost,
    lastGuessResult,
    startGame,
    leaveGame,
    makeGuess,
    getRoleInfo,
    joinGame,
    showInterruptionModal,
    interruptionReason
  } = useGame();
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Handle game state and navigation
  useEffect(() => {
    const savedGameId = localStorage.getItem('currentGameId');
    
    if (gameState === 'waiting' && gameId && savedGameId === gameId) {
      // Attempt to rejoin the game
      const savedPlayerId = localStorage.getItem('currentPlayerId');
      if (savedPlayerId) {
        const player = players.find(p => p.id === savedPlayerId);
        if (player) {
          joinGame(gameId, player.name);
        }
      }
    } else if (gameState === 'waiting' && (!gameId || gameId !== savedGameId)) {
      navigate('/');
    }
  }, [gameState, gameId, navigate, joinGame, players]);
  
  // Handle leaving the game
  const handleLeaveGame = () => {
    leaveGame();
    navigate('/');
  };
  
  // Get role icon component
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'king': return <Crown className="h-6 w-6" />;
      case 'queen': return <Heart className="h-6 w-6" />;
      case 'minister': return <Building2 className="h-6 w-6" />;
      case 'soldier': return <Shield className="h-6 w-6" />;
      case 'police': return <Siren className="h-6 w-6" />;
      case 'thief': return <Footprints className="h-6 w-6" />;
      default: return <HelpCircle className="h-6 w-6" />;
    }
  };
  
  // Get the next role in the chain for the current player
  const getTargetRoleName = () => {
    if (!currentPlayer?.role) return null;
    
    const roleInfo = getRoleInfo(currentPlayer.role);
    const roleChain = ['king', 'queen', 'minister', 'soldier', 'police', 'thief'];
    const currentIndex = roleChain.indexOf(currentPlayer.role);
    
    if (currentIndex === -1 || currentIndex === roleChain.length - 1) {
      return null;
    }
    
    const nextRole = roleChain[currentIndex + 1];
    return getRoleInfo(nextRole as any).name;
  };
  
  // Handle player selection for guessing
  const handleSelectPlayer = (playerId: string) => {
    if (!currentPlayer?.isCurrentTurn || currentPlayer.isLocked) {
      return;
    }
    
    if (playerId === currentPlayer.id) {
      return; // Can't select yourself
    }
    
    const targetPlayer = players.find(p => p.id === playerId);
    if (targetPlayer?.isLocked) {
      return; // Can't select locked players
    }
    
    setSelectedPlayerId(playerId);
  };
  
  // Handle making a guess
  const handleMakeGuess = () => {
    if (!selectedPlayerId) return;
    
    makeGuess(selectedPlayerId);
    setSelectedPlayerId(null);
  };

  const roleChain = ['king', 'queen', 'minister', 'soldier', 'police', 'thief'];
  
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-purple-900">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Game not found</h2>
          <Button color="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Game Lobby */}
        {gameState === 'lobby' && (
          <div className="bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
              <p className="text-purple-200 mt-2">
                Game Code: <span className="font-mono font-bold text-yellow-300">{gameId}</span>
              </p>
              <p className="text-purple-200 mt-1">
                Share this code with friends to join the game
              </p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Users className="text-purple-300 mr-2 h-5 w-5" />
                  Players ({players.length}/6)
                </h2>
                {isHost && (
                  <Button
                    color="primary"
                    disabled={players.length < 6}
                    onClick={startGame}
                  >
                    {players.length < 6 
                      ? `Need ${6 - players.length} more player${players.length === 5 ? '' : 's'}` 
                      : 'Start Game'}
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-purple-900/70 rounded-lg p-4 border border-purple-700/50 flex items-center"
                  >
                    <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center mr-4">
                      {player.isHost ? (
                        <Crown className="text-yellow-400 h-6 w-6" />
                      ) : (
                        <Users className="text-purple-300 h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-sm text-purple-300">
                        {player.isHost ? 'Host' : 'Player'}
                      </p>
                    </div>
                  </div>
                ))}
                
                {Array.from({ length: Math.max(0, 6 - players.length) }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="bg-purple-900/30 rounded-lg p-4 border border-purple-800/30 flex items-center"
                  >
                    <div className="w-12 h-12 bg-purple-800/30 rounded-full flex items-center justify-center mr-4">
                      <Users className="text-purple-700 h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-500">Waiting for player...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button color="secondary" onClick={handleLeaveGame}>
                Leave Game
              </Button>
            </div>
          </div>
        )}
        
        {/* Game Playing */}
        {gameState === 'playing' && (
          <div className="bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
            <div className="flex flex-col lg:flex-row items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white text-center lg:text-left">Chain of Command</h1>
                <p className="text-purple-200 mt-1 text-center lg:text-left">
                  Game Code: <span className="font-mono font-bold text-yellow-300">{gameId}</span>
                </p>
              </div>
              
              <div className="flex items-center mt-4 lg:mt-0 space-x-3">
                <Button
                  color="secondary"
                  size="small"
                  onClick={() => setShowHelp(!showHelp)}
                >
                  <HelpCircle className="h-5 w-5 mr-1" />
                  Help
                </Button>
                <Button
                  color="danger"
                  size="small"
                  onClick={handleLeaveGame}
                >
                  <XCircle className="h-5 w-5 mr-1" />
                  Leave Game
                </Button>
              </div>
            </div>

            {/* Guess Result Notification */}
            {lastGuessResult && (
              <div className={`
                fixed top-4 left-1/2 transform -translate-x-1/2 z-50
                ${lastGuessResult.correct ? 'bg-green-900/90' : 'bg-red-900/90'}
                rounded-lg p-4 shadow-lg border
                ${lastGuessResult.correct ? 'border-green-500' : 'border-red-500'}
                flex items-center space-x-3 animate-fade-in
              `}>
                {lastGuessResult.correct ? (
                  <CheckCircle2 className="text-green-400 h-6 w-6" />
                ) : (
                  <XCircle2 className="text-red-400 h-6 w-6" />
                )}
                <span className="text-white font-medium">{lastGuessResult.message}</span>
              </div>
            )}

            {/* Locked Players Status */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center">
                <Lock className="text-indigo-400 mr-2 h-5 w-5" />
                Chain Progress
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {roleChain.map((role) => {
                  const player = players.find(p => p.role === role && p.isLocked);
                  const roleInfo = getRoleInfo(role as any);
                  return (
                    <div
                      key={role}
                      className={`
                        rounded-lg p-2 text-center
                        ${player ? 'bg-indigo-900/50 border-indigo-500' : 'bg-purple-900/30 border-purple-800/30'}
                        border
                      `}
                    >
                      <div className="text-sm font-medium mb-1">{roleInfo.name}</div>
                      {player ? (
                        <div className="flex items-center justify-center space-x-1">
                          <Lock className="text-indigo-400 h-4 w-4" />
                          <span className="text-indigo-300 text-xs">{player.name}</span>
                        </div>
                      ) : (
                        <span className="text-purple-400 text-xs">Unlocked</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {showHelp && (
              <div className="bg-purple-900/70 rounded-lg p-4 mb-6 border border-purple-600/50">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <HelpCircle className="text-purple-300 h-5 w-5 mr-2" />
                  How to Play
                </h3>
                <ul className="space-y-2 text-purple-200 text-sm">
                  <li>• The King starts and must find the Queen.</li>
                  <li>• If correct, both players lock positions, and the Queen seeks the Minister.</li>
                  <li>• If wrong, roles swap, and the guesser continues their turn.</li>
                  <li>• The chain goes: King → Queen → Minister → Soldier → Police → Thief</li>
                  <li>• When all players are locked in correct positions, the game ends.</li>
                </ul>
              </div>
            )}
            
            {/* Your Role */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center">
                <Award className="text-yellow-400 mr-2 h-5 w-5" />
                Your Role
              </h2>
              
              {currentPlayer?.role ? (
                <RoleCard role={currentPlayer.role} isLocked={currentPlayer.isLocked} />
              ) : (
                <div className="bg-purple-900/50 rounded-lg p-4 text-center">
                  <p className="text-purple-300">Waiting for role assignment...</p>
                </div>
              )}
            </div>
            
            {/* Current Turn */}
            <div className="mb-4">
              {currentPlayer?.isCurrentTurn ? (
                <div className="bg-green-900/40 rounded-lg p-4 border border-green-700/50">
                  <h3 className="text-lg font-semibold text-white mb-2">Your Turn!</h3>
                  <p className="text-green-200">
                    {currentPlayer.isLocked
                      ? "You've locked your position! Select the player you think is the next in the chain."
                      : `Select the player you think is the ${getTargetRoleName()}.`}
                  </p>
                </div>
              ) : (
                <div className="bg-purple-900/40 rounded-lg p-4 border border-purple-700/50">
                  <h3 className="text-lg font-semibold text-white mb-2">Waiting for other player</h3>
                  <p className="text-purple-200">
                    It's another player's turn to make a guess.
                  </p>
                </div>
              )}
            </div>
            
            {/* Players */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center">
                <Users className="text-purple-300 mr-2 h-5 w-5" />
                Players
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isCurrentPlayer={player.id === currentPlayer?.id}
                    isSelected={player.id === selectedPlayerId}
                    onSelect={() => handleSelectPlayer(player.id)}
                    getRoleIcon={getRoleIcon}
                    getRoleInfo={getRoleInfo}
                  />
                ))}
              </div>
            </div>
            
            {/* Make Guess Button */}
            {currentPlayer?.isCurrentTurn && selectedPlayerId && (
              <div className="flex justify-center mt-6">
                <Button
                  color="primary"
                  size="large"
                  onClick={handleMakeGuess}
                >
                  Make Guess
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Game Completed */}
        {gameState === 'completed' && (
          <GameResults players={players} getRoleInfo={getRoleInfo} onLeaveGame={handleLeaveGame} />
        )}
      </main>

      <GameInterruptionModal
        show={showInterruptionModal}
        reason={interruptionReason}
        onClose={handleLeaveGame}
      />
    </div>
  );
};

export default GameRoomPage;