import React from 'react';
import { useGame } from '../context/GameContext';

export function GameOverPage() {
  const { state, restartGame, resetAll } = useGame();
  const { teams } = state;

  const winner = teams.A.score > teams.B.score ? teams.A : teams.B;
  const loser = teams.A.score > teams.B.score ? teams.B : teams.A;
  const isTie = teams.A.score === teams.B.score;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)' }}
    >
      <div className="max-w-3xl w-full text-center">
        {/* Logo */}
        <div className="logo-text text-4xl mb-8">FAMILY FEUD</div>

        {/* Trophy */}
        <div className="text-8xl mb-6">
          {isTie ? '🤝' : '🏆'}
        </div>

        {/* Winner Announcement */}
        <div className="bg-black/40 border-4 border-yellow-500 rounded-2xl p-8 mb-8">
          {isTie ? (
            <h1 className="text-5xl font-display text-yellow-400 mb-4">IT'S A TIE!</h1>
          ) : (
            <>
              <h1 className="text-5xl font-display text-yellow-400 mb-4">WINNER!</h1>
              <h2 className="text-6xl font-display text-white mb-4">{winner.name}</h2>
            </>
          )}

          {/* Final Scores */}
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className={`team-panel ${!isTie && winner.id === 'A' ? 'active' : ''}`}>
              <div className="team-name">{teams.A.name}</div>
              <div className="team-score">{teams.A.score}</div>
              {!isTie && winner.id === 'A' && (
                <div className="text-green-400 font-bold mt-2">🏆 WINNER</div>
              )}
            </div>

            <div className={`team-panel ${!isTie && winner.id === 'B' ? 'active' : ''}`}>
              <div className="team-name">{teams.B.name}</div>
              <div className="team-score">{teams.B.score}</div>
              {!isTie && winner.id === 'B' && (
                <div className="text-green-400 font-bold mt-2">🏆 WINNER</div>
              )}
            </div>
          </div>

          {!isTie && (
            <p className="text-gray-400 mt-6">
              {winner.name} won by {winner.score - loser.score} points!
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={restartGame}
            className="btn-glow bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-xl text-xl"
          >
            🔄 Play Again
          </button>
          <button
            onClick={resetAll}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl text-xl"
          >
            🏠 New Game
          </button>
        </div>

        {/* Thank You */}
        <div className="mt-10 text-gray-500">
          <p>Thanks for playing! 🌙</p>
        </div>
      </div>
    </div>
  );
}
