import React, { useEffect, useCallback, useState } from 'react';
import { useGame } from '../context/GameContext';
import { AnswerBoard } from '../components/AnswerBoard';
import { StrikeDisplay } from '../components/StrikeDisplay';
import { soundManager } from '../utils/sounds';

export function GamePage() {
  const {
    state,
    faceoffSetBuzzer,
    faceoffCorrect,
    faceoffStrike,
    faceoffDecide,
    revealAnswer,
    addStrike,
    removeStrike,
    enterStealMode,
    resolveSteal,
    endRound,
    nextRound,
    skipRound,
    revealAll,
    undo,
    adjustScore,
    resetAll,
  } = useGame();

  const [showHostPanel, setShowHostPanel] = useState(true);
  const [showBigX, setShowBigX] = useState(false);

  const { settings, teams, questionPack, roundIndex, currentRound } = state;

  if (!questionPack || !currentRound) {
    return <div className="min-h-screen flex items-center justify-center text-white text-2xl">Loading...</div>;
  }

  const currentQuestion = questionPack.rounds[roundIndex];
  const totalRounds = Math.min(settings.numberOfRounds, questionPack.rounds.length);
  const isLastRound = roundIndex >= totalRounds - 1;
  const isStealPhase = currentRound.phase === 'steal';
  const stealingTeam = currentRound.controller === 'A' ? 'B' : 'A';

  // Face-off state
  const faceoff = currentRound.faceoff;
  const isFaceoff = currentRound.phase === 'faceoff';
  const isDecisionPhase = isFaceoff && faceoff.currentTurn === 'decide';
  const currentFaceoffTeam = faceoff.currentTurn !== 'decide' ? faceoff.currentTurn : null;

  // Show big X animation
  const triggerBigX = () => {
    setShowBigX(true);
    setTimeout(() => setShowBigX(false), 1500);
  };

  // Handle face-off strike with animation
  const handleFaceoffStrike = (team: 'A' | 'B') => {
    triggerBigX();
    faceoffStrike(team);
  };

  // Handle play phase strike with animation
  const handlePlayStrike = () => {
    if (currentRound.phase === 'play' && currentRound.strikes < settings.strikeLimit) {
      triggerBigX();
      addStrike();
    }
  };

  // Handle steal phase - click answer to reveal and count as successful steal
  const handleStealReveal = (answerIndex: number) => {
    if (currentRound.phase === 'steal' && !currentRound.revealed[answerIndex]) {
      // Resolve steal as success with the matched answer index
      resolveSteal(true, answerIndex);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'h':
        setShowHostPanel(prev => !prev);
        break;
      case 'x':
      case 's':
        if (currentRound.phase === 'play' && currentRound.strikes < settings.strikeLimit) {
          triggerBigX();
          addStrike();
        } else if (isFaceoff && currentFaceoffTeam) {
          triggerBigX();
          faceoffStrike(currentFaceoffTeam);
        }
        break;
      case 'u':
        undo();
        break;
      case 'n':
        if (currentRound.phase === 'ended') {
          nextRound();
        }
        break;
      case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8':
        const index = parseInt(e.key) - 1;
        if (index < currentQuestion.answers.length && !currentRound.revealed[index]) {
          if (isFaceoff && currentFaceoffTeam) {
            faceoffCorrect(currentFaceoffTeam, index);
          } else if (currentRound.phase === 'play') {
            revealAnswer(index);
          } else if (isStealPhase) {
            handleStealReveal(index);
          }
        }
        break;
    }
  }, [currentRound, isFaceoff, isStealPhase, currentFaceoffTeam, addStrike, faceoffStrike, faceoffCorrect, undo, nextRound, revealAnswer, resolveSteal, currentQuestion.answers.length, settings.strikeLimit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get points for a team's faceoff answer
  const getTeamFaceoffPoints = (team: 'A' | 'B') => {
    const answerIndex = team === 'A' ? faceoff.teamAAnswerIndex : faceoff.teamBAnswerIndex;
    if (answerIndex === null) return 0;
    return currentQuestion.answers[answerIndex].points;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)' }}>
      
      {/* Big X Animation Overlay */}
      {showBigX && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-[20rem] font-bold text-red-600 animate-ping" style={{ textShadow: '0 0 100px #ff0000' }}>
            ✕
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-black/50 border-b-4 border-yellow-500 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="logo-text">FAMILY FEUD</div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-gray-400 text-sm uppercase">Round</div>
              <div className="text-3xl font-display text-white">{roundIndex + 1} / {totalRounds}</div>
            </div>
            <div className="multiplier-badge">×{currentRound.multiplier}</div>
          </div>

          <div className="round-pot">
            <div className="pot-label">Points This Round</div>
            <div className="pot-value">{currentRound.roundPot}</div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex">
        {/* Left - Team A */}
        <div className="w-72 p-6 flex flex-col justify-center">
          <div className={`team-panel ${currentRound.controller === 'A' && currentRound.phase === 'play' ? 'active' : ''} ${isStealPhase && stealingTeam === 'A' ? 'stealing' : ''} ${isFaceoff && currentFaceoffTeam === 'A' ? 'active' : ''}`}>
            {isFaceoff && currentFaceoffTeam === 'A' && (
              <div className="bg-yellow-500 text-black text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block animate-pulse">
                ANSWERING
              </div>
            )}
            {isFaceoff && faceoff.teamAStrike && (
              <div className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block">
                ❌ STRIKE
              </div>
            )}
            {isFaceoff && faceoff.teamAAnswerIndex !== null && (
              <div className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block">
                ✓ {getTeamFaceoffPoints('A')} PTS
              </div>
            )}
            {currentRound.controller === 'A' && currentRound.phase === 'play' && (
              <div className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block">
                PLAYING
              </div>
            )}
            {isStealPhase && stealingTeam === 'A' && (
              <div className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block animate-pulse">
                STEALING!
              </div>
            )}
            <div className="team-name">{teams.A.name}</div>
            <div className="team-score">{teams.A.score}</div>
          </div>
        </div>

        {/* Center - Question & Board */}
        <div className="flex-1 flex flex-col p-6">
          {/* Question */}
          <div className="question-display mb-6">
            <div className="question-text">{currentQuestion.question}</div>
          </div>

          {/* Answer Board */}
          <AnswerBoard
            answers={currentQuestion.answers}
            revealed={currentRound.revealed}
            onReveal={
              isFaceoff && currentFaceoffTeam
                ? (index) => faceoffCorrect(currentFaceoffTeam, index)
                : currentRound.phase === 'play'
                  ? revealAnswer
                  : isStealPhase
                    ? (index) => handleStealReveal(index)
                    : undefined
            }
          />

          {/* Strike Display - only in play phase */}
          {currentRound.phase === 'play' && (
            <StrikeDisplay
              strikes={currentRound.strikes}
              maxStrikes={settings.strikeLimit}
            />
          )}

          {/* Face-off Messages */}
          {isFaceoff && !isDecisionPhase && (
            <div className="text-center mt-6">
              <div className="text-3xl text-yellow-400 font-display">
                ⚔️ FACE-OFF: {currentFaceoffTeam === 'A' ? teams.A.name : teams.B.name}'s Turn!
              </div>
              <div className="text-gray-400 mt-2">
                Click an answer number if correct, or press X for wrong answer
              </div>
            </div>
          )}

          {/* Decision Phase */}
          {isDecisionPhase && (
            <div className="text-center mt-6">
              <div className="text-3xl text-green-400 font-display mb-4">
                🏆 {faceoff.winner === 'A' ? teams.A.name : teams.B.name} WINS THE FACE-OFF!
              </div>
              <div className="text-xl text-gray-300 mb-4">
                {faceoff.winner === 'A' ? teams.A.name : teams.B.name}: Do you want to PLAY or PASS?
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => faceoffDecide(faceoff.winner!, 'play')}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-12 rounded-xl text-2xl"
                >
                  ▶ PLAY
                </button>
                <button
                  onClick={() => faceoffDecide(faceoff.winner!, 'pass')}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 px-12 rounded-xl text-2xl"
                >
                  ⏭ PASS
                </button>
              </div>
            </div>
          )}

          {/* Steal Phase */}
          {isStealPhase && (
            <div className="text-center mt-4">
              <div className="text-3xl text-red-500 font-display animate-pulse">
                🎯 {teams[stealingTeam].name} CAN STEAL!
              </div>
            </div>
          )}

          {/* Round Ended */}
          {currentRound.phase === 'ended' && (
            <div className="text-center mt-6">
              <div className="text-3xl text-green-400 font-display mb-4">
                ✅ ROUND COMPLETE!
              </div>
              <div className="text-xl text-white mb-2">
                {currentRound.roundPot} × {currentRound.multiplier} = <span className="text-yellow-400 text-3xl font-bold">{currentRound.roundPot * currentRound.multiplier}</span> points
              </div>
              <div className="text-lg text-gray-300">
                Awarded to: <span className="text-yellow-400 font-bold">{currentRound.controller ? teams[currentRound.controller].name : 'TBD'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right - Team B */}
        <div className="w-72 p-6 flex flex-col justify-center">
          <div className={`team-panel ${currentRound.controller === 'B' && currentRound.phase === 'play' ? 'active' : ''} ${isStealPhase && stealingTeam === 'B' ? 'stealing' : ''} ${isFaceoff && currentFaceoffTeam === 'B' ? 'active' : ''}`}>
            {isFaceoff && currentFaceoffTeam === 'B' && (
              <div className="bg-yellow-500 text-black text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block animate-pulse">
                ANSWERING
              </div>
            )}
            {isFaceoff && faceoff.teamBStrike && (
              <div className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block">
                ❌ STRIKE
              </div>
            )}
            {isFaceoff && faceoff.teamBAnswerIndex !== null && (
              <div className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block">
                ✓ {getTeamFaceoffPoints('B')} PTS
              </div>
            )}
            {currentRound.controller === 'B' && currentRound.phase === 'play' && (
              <div className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block">
                PLAYING
              </div>
            )}
            {isStealPhase && stealingTeam === 'B' && (
              <div className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block animate-pulse">
                STEALING!
              </div>
            )}
            <div className="team-name">{teams.B.name}</div>
            <div className="team-score">{teams.B.score}</div>
          </div>
        </div>
      </div>

      {/* Host Controls Panel - Bottom */}
      {showHostPanel && (
        <div className="host-panel m-4 mt-0">
          <div className="flex flex-wrap gap-3 items-center justify-center">
            
            {/* Face-off Controls */}
            {isFaceoff && !isDecisionPhase && currentFaceoffTeam && (
              <>
                <span className="text-yellow-400 font-bold">{currentFaceoffTeam === 'A' ? teams.A.name : teams.B.name} answering:</span>
                <button
                  onClick={() => handleFaceoffStrike(currentFaceoffTeam)}
                  className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-xl"
                >
                  ❌ WRONG (X)
                </button>
                <span className="text-gray-500 mx-2">or click answer number if correct</span>
                <div className="w-px h-8 bg-gray-600 mx-2"></div>
                <span className="text-gray-400">Switch first buzzer:</span>
                <button
                  onClick={() => faceoffSetBuzzer('A')}
                  className={`px-3 py-1 rounded ${faceoff.currentTurn === 'A' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
                >
                  {teams.A.name}
                </button>
                <button
                  onClick={() => faceoffSetBuzzer('B')}
                  className={`px-3 py-1 rounded ${faceoff.currentTurn === 'B' ? 'bg-red-600' : 'bg-gray-700'} text-white`}
                >
                  {teams.B.name}
                </button>
              </>
            )}

            {/* Decision Phase - shown in center */}
            {isDecisionPhase && faceoff.winner === null && (
              <>
                <span className="text-yellow-400">Both teams struck! Pick winner:</span>
                <button
                  onClick={() => faceoffDecide('A', 'play')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {teams.A.name} Plays
                </button>
                <button
                  onClick={() => faceoffDecide('B', 'play')}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {teams.B.name} Plays
                </button>
              </>
            )}

            {/* Play Controls */}
            {currentRound.phase === 'play' && (
              <>
                <button
                  onClick={handlePlayStrike}
                  disabled={currentRound.strikes >= settings.strikeLimit}
                  className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg text-xl"
                >
                  ❌ STRIKE (X)
                </button>
                <button
                  onClick={removeStrike}
                  disabled={currentRound.strikes <= 0}
                  className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Undo Strike
                </button>
                <button
                  onClick={enterStealMode}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Force Steal
                </button>
                <div className="w-px h-8 bg-gray-600 mx-2"></div>
                <button
                  onClick={() => endRound('A')}
                  className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {teams.A.name} Wins
                </button>
                <button
                  onClick={() => endRound('B')}
                  className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  {teams.B.name} Wins
                </button>
              </>
            )}

            {/* Steal Controls */}
            {isStealPhase && (
              <>
                <span className="text-red-400 font-bold">STEAL:</span>
                <button
                  onClick={() => resolveSteal(true)}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg"
                >
                  ✓ SUCCESS
                </button>
                <button
                  onClick={() => resolveSteal(false)}
                  className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                  ✗ FAILED
                </button>
              </>
            )}

            {/* Round End */}
            {currentRound.phase === 'ended' && (
              <button
                onClick={nextRound}
                className="btn-glow bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg text-xl"
              >
                {isLastRound ? '🏆 Final Results' : '➡️ Next Round (N)'}
              </button>
            )}

            <div className="w-px h-8 bg-gray-600 mx-2"></div>

            {/* Always Available */}
            <button
              onClick={undo}
              disabled={state.historyStack.length === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg"
            >
              ↩ Undo
            </button>
            
            {currentRound.phase !== 'ended' && (
              <button
                onClick={skipRound}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                ⏭ Skip
              </button>
            )}

            <button
              onClick={revealAll}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              👁 Show All
            </button>

            {/* Score Adjustments */}
            <div className="flex items-center gap-1 ml-2">
              <button onClick={() => adjustScore('A', -10)} className="bg-red-900 hover:bg-red-800 text-white px-2 py-1 rounded text-sm">A-10</button>
              <button onClick={() => adjustScore('A', 10)} className="bg-green-900 hover:bg-green-800 text-white px-2 py-1 rounded text-sm">A+10</button>
              <button onClick={() => adjustScore('B', -10)} className="bg-red-900 hover:bg-red-800 text-white px-2 py-1 rounded text-sm">B-10</button>
              <button onClick={() => adjustScore('B', 10)} className="bg-green-900 hover:bg-green-800 text-white px-2 py-1 rounded text-sm">B+10</button>
            </div>

            <button
              onClick={() => { if (window.confirm('Go home?')) resetAll(); }}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold py-2 px-3 rounded-lg ml-2"
            >
              🏠
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setShowHostPanel(prev => !prev)}
        className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg font-bold z-40 ${showHostPanel ? 'bg-green-600 text-white' : 'bg-yellow-500 text-black'}`}
      >
        {showHostPanel ? '📺 Hide (H)' : '🎮 Controls (H)'}
      </button>

      {!showHostPanel && (
        <div className="fixed top-24 right-4 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold">
          📺 PROJECTOR MODE
        </div>
      )}

      <div className="fixed bottom-4 left-4 text-xs text-gray-600">
        H=Panel | X=Strike | 1-8=Reveal | U=Undo | N=Next
      </div>
    </div>
  );
}
