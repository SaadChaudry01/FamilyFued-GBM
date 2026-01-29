import React from 'react';
import { Answer, Team } from '../types';

interface RoundEndModalProps {
  question: string;
  answers: Answer[];
  revealed: boolean[];
  roundPot: number;
  multiplier: number;
  winningTeam: Team;
  stealResult: 'success' | 'failed' | null;
  stealingTeamName?: string;
  onNextRound: () => void;
  isLastRound: boolean;
}

export function RoundEndModal({
  question,
  answers,
  roundPot,
  multiplier,
  winningTeam,
  stealResult,
  stealingTeamName,
  onNextRound,
  isLastRound,
}: RoundEndModalProps) {
  const finalPoints = roundPot * multiplier;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="bg-gradient-to-br from-feud-dark via-feud-blue to-feud-dark rounded-3xl p-8 max-w-3xl w-full mx-4 border-4 border-feud-gold shadow-2xl animate-bounce-in">
        <h2 className="text-4xl font-display text-center text-feud-gold mb-6">
          🎉 ROUND COMPLETE! 🎉
        </h2>

        {/* Question */}
        <p className="text-center text-xl text-gray-300 mb-6">
          "{question}"
        </p>

        {/* All Answers */}
        <div className="bg-feud-dark/50 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-bold text-feud-gold mb-3">All Answers:</h3>
          <div className="grid grid-cols-2 gap-2">
            {answers.map((answer, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 bg-feud-panel/50 rounded-lg"
              >
                <span className="text-white">{index + 1}. {answer.text}</span>
                <span className="text-feud-gold font-bold">{answer.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steal Result */}
        {stealResult && (
          <div className={`text-center py-4 mb-4 rounded-xl ${
            stealResult === 'success' 
              ? 'bg-green-600/30 border-2 border-green-500' 
              : 'bg-red-600/30 border-2 border-red-500'
          }`}>
            <span className="text-2xl font-bold">
              {stealResult === 'success' 
                ? `🎯 ${stealingTeamName} STOLE THE POINTS!` 
                : `❌ ${stealingTeamName} failed to steal!`
              }
            </span>
          </div>
        )}

        {/* Points Calculation */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center items-center gap-4 text-3xl">
            <span className="text-gray-400">{roundPot}</span>
            <span className="text-feud-gold">×</span>
            <span className="text-feud-gold">{multiplier}</span>
            <span className="text-feud-gold">=</span>
            <span className="text-5xl font-display text-feud-gold animate-pulse">
              {finalPoints}
            </span>
          </div>
          <p className="text-xl text-gray-300">
            Points awarded to <span className="text-feud-gold font-bold">{winningTeam.name}</span>!
          </p>
          <p className="text-3xl font-display text-white">
            New Score: {winningTeam.score}
          </p>
        </div>

        {/* Next Button */}
        <button
          onClick={onNextRound}
          className="w-full btn-glow bg-feud-gold hover:bg-yellow-400 text-feud-dark font-bold py-4 px-6 rounded-xl text-2xl transition-colors"
        >
          {isLastRound ? '🏆 See Final Results' : '➡️ Next Round'}
        </button>
      </div>
    </div>
  );
}

