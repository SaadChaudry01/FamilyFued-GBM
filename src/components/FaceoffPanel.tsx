import React, { useState } from 'react';
import { Answer } from '../types';

interface FaceoffPanelProps {
  teamAName: string;
  teamBName: string;
  answers: Answer[];
  onResolveFaceoff: (controllingTeam: 'A' | 'B', playOrPass: 'play' | 'pass') => void;
  onSetFaceoffGuess: (team: 'A' | 'B', guess: string, matchIndex: number | null) => void;
  faceoffGuesses: {
    teamA: string | null;
    teamB: string | null;
    teamAMatchIndex: number | null;
    teamBMatchIndex: number | null;
  };
}

export function FaceoffPanel({
  teamAName,
  teamBName,
  answers,
  onResolveFaceoff,
  onSetFaceoffGuess,
  faceoffGuesses,
}: FaceoffPanelProps) {
  const [teamAGuess, setTeamAGuess] = useState('');
  const [teamBGuess, setTeamBGuess] = useState('');
  const [selectedWinner, setSelectedWinner] = useState<'A' | 'B' | null>(null);
  const [showAnswersA, setShowAnswersA] = useState(false);
  const [showAnswersB, setShowAnswersB] = useState(false);

  const handleSetGuess = (team: 'A' | 'B', guess: string) => {
    if (team === 'A') {
      setTeamAGuess(guess);
    } else {
      setTeamBGuess(guess);
    }
  };

  const handleConfirmGuess = (team: 'A' | 'B', matchIndex: number | null) => {
    const guess = team === 'A' ? teamAGuess : teamBGuess;
    onSetFaceoffGuess(team, guess, matchIndex);
    if (team === 'A') setShowAnswersA(false);
    if (team === 'B') setShowAnswersB(false);
  };

  // Determine who wins based on matched answers
  const getAutoWinner = (): 'A' | 'B' | null => {
    const { teamAMatchIndex, teamBMatchIndex } = faceoffGuesses;
    
    if (teamAMatchIndex !== null && teamBMatchIndex !== null) {
      // Both matched - compare points (higher points = better rank)
      const teamAPoints = answers[teamAMatchIndex].points;
      const teamBPoints = answers[teamBMatchIndex].points;
      return teamAPoints >= teamBPoints ? 'A' : 'B';
    } else if (teamAMatchIndex !== null) {
      return 'A';
    } else if (teamBMatchIndex !== null) {
      return 'B';
    }
    return null;
  };

  const autoWinner = getAutoWinner();

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-feud-dark/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-500">
      <h2 className="text-3xl font-display text-center text-feud-gold mb-8">
        ⚔️ FACE-OFF ⚔️
      </h2>

      <p className="text-center text-gray-400 mb-6 text-sm">
        💡 Host Only: Click "Show Answers" to mark matches (hidden from projection when you press H)
      </p>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Team A */}
        <div className="space-y-4">
          <h3 className="text-2xl font-display text-center text-blue-400">
            {teamAName}
          </h3>
          
          <input
            type="text"
            value={teamAGuess}
            onChange={(e) => handleSetGuess('A', e.target.value)}
            placeholder="Type Team A's guess..."
            className="w-full bg-feud-dark/50 border-2 border-blue-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500"
            disabled={faceoffGuesses.teamA !== null}
          />

          {faceoffGuesses.teamA === null ? (
            <div className="space-y-2">
              {!showAnswersA ? (
                <button
                  onClick={() => setShowAnswersA(true)}
                  className="w-full p-3 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500 rounded-lg text-blue-300 font-medium"
                >
                  🔍 Show Answers to Match
                </button>
              ) : (
                <>
                  <p className="text-sm text-gray-400">Select matching answer (Host only!):</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-black/50 p-2 rounded-lg border border-yellow-500/50">
                    {answers.map((answer, index) => (
                      <button
                        key={index}
                        onClick={() => handleConfirmGuess('A', index)}
                        className="w-full text-left p-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-lg text-white text-sm"
                      >
                        {answer.text} ({answer.points} pts)
                      </button>
                    ))}
                    <button
                      onClick={() => handleConfirmGuess('A', null)}
                      className="w-full text-left p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-lg text-red-400 text-sm"
                    >
                      ✕ No Match (Wrong Answer)
                    </button>
                  </div>
                  <button
                    onClick={() => setShowAnswersA(false)}
                    className="w-full text-sm text-gray-500 hover:text-gray-300"
                  >
                    Hide Answers
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={`p-3 rounded-lg ${faceoffGuesses.teamAMatchIndex !== null ? 'bg-green-600/30 border border-green-500' : 'bg-red-600/30 border border-red-500'}`}>
              <p className="text-sm text-gray-300">Guess: "{faceoffGuesses.teamA}"</p>
              {faceoffGuesses.teamAMatchIndex !== null ? (
                <p className="text-green-400 font-bold">
                  ✓ Matched! (#{faceoffGuesses.teamAMatchIndex + 1} - {answers[faceoffGuesses.teamAMatchIndex].points} pts)
                </p>
              ) : (
                <p className="text-red-400 font-bold">✕ No Match</p>
              )}
            </div>
          )}
        </div>

        {/* Team B */}
        <div className="space-y-4">
          <h3 className="text-2xl font-display text-center text-red-400">
            {teamBName}
          </h3>
          
          <input
            type="text"
            value={teamBGuess}
            onChange={(e) => handleSetGuess('B', e.target.value)}
            placeholder="Type Team B's guess..."
            className="w-full bg-feud-dark/50 border-2 border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-500"
            disabled={faceoffGuesses.teamB !== null}
          />

          {faceoffGuesses.teamB === null ? (
            <div className="space-y-2">
              {!showAnswersB ? (
                <button
                  onClick={() => setShowAnswersB(true)}
                  className="w-full p-3 bg-red-600/30 hover:bg-red-600/50 border border-red-500 rounded-lg text-red-300 font-medium"
                >
                  🔍 Show Answers to Match
                </button>
              ) : (
                <>
                  <p className="text-sm text-gray-400">Select matching answer (Host only!):</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-black/50 p-2 rounded-lg border border-yellow-500/50">
                    {answers.map((answer, index) => (
                      <button
                        key={index}
                        onClick={() => handleConfirmGuess('B', index)}
                        className="w-full text-left p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-lg text-white text-sm"
                      >
                        {answer.text} ({answer.points} pts)
                      </button>
                    ))}
                    <button
                      onClick={() => handleConfirmGuess('B', null)}
                      className="w-full text-left p-2 bg-gray-600/20 hover:bg-gray-600/40 border border-gray-500/50 rounded-lg text-gray-400 text-sm"
                    >
                      ✕ No Match (Wrong Answer)
                    </button>
                  </div>
                  <button
                    onClick={() => setShowAnswersB(false)}
                    className="w-full text-sm text-gray-500 hover:text-gray-300"
                  >
                    Hide Answers
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={`p-3 rounded-lg ${faceoffGuesses.teamBMatchIndex !== null ? 'bg-green-600/30 border border-green-500' : 'bg-red-600/30 border border-red-500'}`}>
              <p className="text-sm text-gray-300">Guess: "{faceoffGuesses.teamB}"</p>
              {faceoffGuesses.teamBMatchIndex !== null ? (
                <p className="text-green-400 font-bold">
                  ✓ Matched! (#{faceoffGuesses.teamBMatchIndex + 1} - {answers[faceoffGuesses.teamBMatchIndex].points} pts)
                </p>
              ) : (
                <p className="text-red-400 font-bold">✕ No Match</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Winner Selection */}
      {(faceoffGuesses.teamA !== null || faceoffGuesses.teamB !== null) && (
        <div className="border-t border-purple-500/30 pt-6 space-y-4">
          {autoWinner ? (
            <div className="text-center mb-4">
              <p className="text-lg text-gray-300">Suggested Winner:</p>
              <p className="text-2xl font-display text-feud-gold">
                {autoWinner === 'A' ? teamAName : teamBName}
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-400">
              Neither team matched - select winner manually:
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => setSelectedWinner('A')}
              className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${
                selectedWinner === 'A' || (autoWinner === 'A' && selectedWinner === null)
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/40'
              }`}
            >
              {teamAName} Controls
            </button>
            <button
              onClick={() => setSelectedWinner('B')}
              className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${
                selectedWinner === 'B' || (autoWinner === 'B' && selectedWinner === null)
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/40'
              }`}
            >
              {teamBName} Controls
            </button>
          </div>

          {/* Play or Pass */}
          {(selectedWinner || autoWinner) && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onResolveFaceoff(selectedWinner || autoWinner!, 'play')}
                className="btn-glow bg-feud-green hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl text-xl"
              >
                ▶ PLAY
              </button>
              <button
                onClick={() => onResolveFaceoff(selectedWinner || autoWinner!, 'pass')}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-4 px-6 rounded-xl text-xl"
              >
                ⏭ PASS
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
