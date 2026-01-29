import React, { useState } from 'react';
import { Answer, RoundPhase } from '../types';
import { getPotentialMatches } from '../utils/matching';

interface HostControlsProps {
  phase: RoundPhase;
  answers: Answer[];
  revealed: boolean[];
  controller: 'A' | 'B' | null;
  strikes: number;
  maxStrikes: number;
  teamAName: string;
  teamBName: string;
  onRevealAnswer: (index: number) => void;
  onAddStrike: () => void;
  onRemoveStrike: () => void;
  onEnterStealMode: () => void;
  onResolveSteal: (success: boolean, matchIndex?: number) => void;
  onEndRound: (winningTeam: 'A' | 'B') => void;
  onNextRound: () => void;
  onSkipRound: () => void;
  onRevealAll: () => void;
  onUndo: () => void;
  onAdjustScore: (team: 'A' | 'B', amount: number) => void;
  onGoHome: () => void;
  canUndo: boolean;
  isLastRound: boolean;
}

export function HostControls({
  phase,
  answers,
  revealed,
  controller,
  strikes,
  maxStrikes,
  teamAName,
  teamBName,
  onRevealAnswer,
  onAddStrike,
  onRemoveStrike,
  onEnterStealMode,
  onResolveSteal,
  onEndRound,
  onNextRound,
  onSkipRound,
  onRevealAll,
  onUndo,
  onAdjustScore,
  onGoHome,
  canUndo,
  isLastRound,
}: HostControlsProps) {
  const [guess, setGuess] = useState('');
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [showConfirmRevealAll, setShowConfirmRevealAll] = useState(false);
  const [showAnswerList, setShowAnswerList] = useState(false);

  const potentialMatches = guess.length >= 2 
    ? getPotentialMatches(guess, answers, revealed, 0.2)
    : [];

  const handleMarkMatch = (index: number) => {
    onRevealAnswer(index);
    setGuess('');
    setShowAnswerList(false);
  };

  const handleNoMatch = () => {
    onAddStrike();
    setGuess('');
  };

  const handleStealSuccess = (index: number) => {
    onResolveSteal(true, index);
    setGuess('');
    setShowAnswerList(false);
  };

  const handleStealFailed = () => {
    onResolveSteal(false);
    setGuess('');
  };

  const stealingTeamName = controller === 'A' ? teamBName : teamAName;

  // Count unrevealed answers
  const unrevealedCount = revealed.filter(r => !r).length;

  return (
    <div className="bg-feud-panel/80 backdrop-blur-sm rounded-2xl p-6 space-y-6">
      <h3 className="text-xl font-display text-feud-gold border-b border-feud-gold/30 pb-2">
        🎮 Host Controls
      </h3>

      {/* Play Phase Controls */}
      {phase === 'play' && (
        <>
          {/* Guess Input */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400">Enter Guess</label>
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Type the contestant's guess..."
              className="w-full bg-feud-dark/50 border-2 border-feud-gold/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-feud-gold"
            />
          </div>

          {/* Potential Matches from fuzzy search */}
          {potentialMatches.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Potential Matches</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {potentialMatches.slice(0, 3).map(({ index, answer, confidence }) => (
                  <button
                    key={index}
                    onClick={() => handleMarkMatch(index)}
                    className="w-full flex justify-between items-center p-3 bg-feud-green/20 hover:bg-feud-green/40 border border-feud-green rounded-lg transition-colors"
                  >
                    <span className="text-white font-medium">
                      #{index + 1}: {answer.text} ({answer.points} pts)
                    </span>
                    <span className="text-feud-green text-sm">
                      {Math.round(confidence * 100)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show All Answers Button */}
          <div className="space-y-2">
            {!showAnswerList ? (
              <button
                onClick={() => setShowAnswerList(true)}
                className="w-full p-3 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500 rounded-lg text-blue-300 font-medium"
              >
                📋 Show All Answers ({unrevealedCount} remaining)
              </button>
            ) : (
              <div className="space-y-2 bg-black/50 p-3 rounded-lg border border-yellow-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-yellow-400 font-bold">⚠️ HOST ONLY - All Answers</span>
                  <button
                    onClick={() => setShowAnswerList(false)}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    ✕ Hide
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {answers.map((answer, index) => (
                    <button
                      key={index}
                      onClick={() => !revealed[index] && handleMarkMatch(index)}
                      disabled={revealed[index]}
                      className={`w-full flex justify-between items-center p-2 rounded-lg transition-colors text-sm ${
                        revealed[index]
                          ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed line-through'
                          : 'bg-feud-green/20 hover:bg-feud-green/40 border border-feud-green text-white'
                      }`}
                    >
                      <span>#{index + 1}: {answer.text}</span>
                      <span className={revealed[index] ? 'text-gray-500' : 'text-feud-gold'}>
                        {answer.points} pts
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleNoMatch}
              disabled={strikes >= maxStrikes}
              className="btn-glow bg-feud-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              ✕ Strike!
            </button>
            <button
              onClick={onRemoveStrike}
              disabled={strikes <= 0}
              className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              ↩ Undo Strike
            </button>
          </div>

          {/* Force Steal Mode */}
          <button
            onClick={onEnterStealMode}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            🎯 Force Steal Mode
          </button>
        </>
      )}

      {/* Steal Phase Controls */}
      {phase === 'steal' && (
        <>
          <div className="text-center py-4 bg-feud-red/20 rounded-lg border-2 border-feud-red">
            <span className="text-xl font-bold text-feud-red">
              🎯 {stealingTeamName} STEALING!
            </span>
          </div>

          {/* Guess Input */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400">Enter Steal Guess</label>
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Type the steal guess..."
              className="w-full bg-feud-dark/50 border-2 border-feud-gold/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-feud-gold"
            />
          </div>

          {/* Unrevealed Answers for Steal */}
          <div className="space-y-2">
            {!showAnswerList ? (
              <button
                onClick={() => setShowAnswerList(true)}
                className="w-full p-3 bg-green-600/30 hover:bg-green-600/50 border border-green-500 rounded-lg text-green-300 font-medium"
              >
                ✓ Show Answers (Mark Steal Success)
              </button>
            ) : (
              <div className="space-y-2 bg-black/50 p-3 rounded-lg border border-yellow-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-yellow-400 font-bold">⚠️ Mark as Steal Success</span>
                  <button
                    onClick={() => setShowAnswerList(false)}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    ✕ Hide
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {answers.map((answer, index) => {
                    if (revealed[index]) return null;
                    return (
                      <button
                        key={index}
                        onClick={() => handleStealSuccess(index)}
                        className="w-full flex justify-between items-center p-2 bg-feud-green/20 hover:bg-feud-green/40 border border-feud-green rounded-lg transition-colors text-sm"
                      >
                        <span className="text-white">#{index + 1}: {answer.text}</span>
                        <span className="text-feud-green">✓ STEAL</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStealFailed}
            className="w-full bg-feud-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            ✕ Steal Failed
          </button>
        </>
      )}

      {/* Round Ended Controls */}
      {phase === 'ended' && (
        <div className="space-y-4">
          <div className="text-center py-4 bg-feud-green/20 rounded-lg border-2 border-feud-green">
            <span className="text-xl font-bold text-feud-green">
              ✅ Round Complete!
            </span>
          </div>
          <button
            onClick={onNextRound}
            className="w-full btn-glow bg-feud-gold hover:bg-yellow-500 text-feud-dark font-bold py-4 px-4 rounded-lg transition-colors text-xl"
          >
            ➡️ Next Round
          </button>
        </div>
      )}

      {/* Always Available Controls */}
      <div className="border-t border-feud-gold/30 pt-4 space-y-3">
        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          ↩ Undo Last Action (U)
        </button>

        {/* Reveal All */}
        {phase !== 'ended' && (
          <>
            {showConfirmRevealAll ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onRevealAll();
                    setShowConfirmRevealAll(false);
                  }}
                  className="flex-1 bg-feud-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Confirm Reveal All
                </button>
                <button
                  onClick={() => setShowConfirmRevealAll(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmRevealAll(true)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                👁 Reveal All Answers
              </button>
            )}
          </>
        )}

        {/* End Round Manually */}
        {phase === 'play' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onEndRound('A')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              End: {teamAName} Wins
            </button>
            <button
              onClick={() => onEndRound('B')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              End: {teamBName} Wins
            </button>
          </div>
        )}

        {/* Admin Controls Toggle */}
        <button
          onClick={() => setShowAdminControls(!showAdminControls)}
          className="w-full text-gray-400 hover:text-white text-sm py-2"
        >
          {showAdminControls ? '▼ Hide Score Adjustments' : '▶ Score Adjustments'}
        </button>

        {showAdminControls && (
          <div className="bg-feud-dark/50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm text-gray-400">{teamAName}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAdjustScore('A', -10)}
                    className="flex-1 bg-feud-red/50 hover:bg-feud-red text-white py-2 rounded"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => onAdjustScore('A', 10)}
                    className="flex-1 bg-feud-green/50 hover:bg-feud-green text-white py-2 rounded"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-gray-400">{teamBName}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAdjustScore('B', -10)}
                    className="flex-1 bg-feud-red/50 hover:bg-feud-red text-white py-2 rounded"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => onAdjustScore('B', 10)}
                    className="flex-1 bg-feud-green/50 hover:bg-feud-green text-white py-2 rounded"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skip Question */}
        {phase !== 'ended' && !isLastRound && (
          <button
            onClick={onSkipRound}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            ⏭ Skip Question
          </button>
        )}

        {/* Home Button */}
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to go back to the home screen? Game progress will be lost.')) {
              onGoHome();
            }
          }}
          className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-4 rounded-lg transition-colors border border-gray-600"
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
}
