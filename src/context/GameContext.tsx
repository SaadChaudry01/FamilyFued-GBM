import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  GameState,
  GameSettings,
  QuestionPack,
  RoundState,
  GameSnapshot,
  Team,
} from '../types';
import { saveGameState, loadGameState, clearGameState } from '../utils/storage';
import { soundManager } from '../utils/sounds';

// ===== Default Values =====

const defaultSettings: GameSettings = {
  gameTitle: 'Family Feud Night',
  teamAName: 'Team A',
  teamBName: 'Team B',
  numberOfRounds: 5,
  enableFastMoney: false,
  strikeLimit: 3,
  customRules: false,
  multipliers: [1, 1, 2, 2, 3],
};

const initialGameState: GameState = {
  phase: 'setup',
  settings: defaultSettings,
  teams: {
    A: { id: 'A', name: 'Team A', score: 0 },
    B: { id: 'B', name: 'Team B', score: 0 },
  },
  questionPack: null,
  roundIndex: 0,
  currentRound: null,
  historyStack: [],
};

// ===== Helper Functions =====

function createRoundState(roundIndex: number, multiplier: number, answersCount: number): RoundState {
  return {
    roundIndex,
    revealed: new Array(answersCount).fill(false),
    strikes: 0,
    controller: null,
    phase: 'faceoff',
    roundPot: 0,
    multiplier,
    faceoff: {
      currentTurn: 'A', // Team A buzzes first by default
      teamAAnswerIndex: null,
      teamBAnswerIndex: null,
      teamAStrike: false,
      teamBStrike: false,
      winner: null,
    },
    stealGuess: null,
    stealResult: null,
  };
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createSnapshot(state: GameState, action: string): GameSnapshot {
  return {
    teams: {
      A: { ...state.teams.A },
      B: { ...state.teams.B },
    },
    roundIndex: state.roundIndex,
    currentRound: state.currentRound ? { 
      ...state.currentRound, 
      revealed: [...state.currentRound.revealed],
      faceoff: { ...state.currentRound.faceoff },
    } : null,
    action,
    timestamp: Date.now(),
  };
}

// ===== Reducer =====

type Action =
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'START_GAME'; settings: GameSettings; questionPack: QuestionPack }
  | { type: 'FACEOFF_SET_BUZZER'; team: 'A' | 'B' }
  | { type: 'FACEOFF_CORRECT'; team: 'A' | 'B'; answerIndex: number }
  | { type: 'FACEOFF_STRIKE'; team: 'A' | 'B' }
  | { type: 'FACEOFF_DECIDE'; team: 'A' | 'B'; choice: 'play' | 'pass' }
  | { type: 'REVEAL_ANSWER'; answerIndex: number }
  | { type: 'ADD_STRIKE' }
  | { type: 'REMOVE_STRIKE' }
  | { type: 'ENTER_STEAL_MODE' }
  | { type: 'SET_STEAL_GUESS'; guess: string }
  | { type: 'RESOLVE_STEAL'; success: boolean; matchIndex?: number }
  | { type: 'END_ROUND'; winningTeam: 'A' | 'B' }
  | { type: 'NEXT_ROUND' }
  | { type: 'SKIP_ROUND' }
  | { type: 'REVEAL_ALL' }
  | { type: 'UNDO' }
  | { type: 'ADJUST_SCORE'; team: 'A' | 'B'; amount: number }
  | { type: 'SET_SCORE'; team: 'A' | 'B'; score: number }
  | { type: 'RESTART_GAME' }
  | { type: 'RESET_ALL' };

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.state;

    case 'START_GAME': {
      const { settings, questionPack } = action;
      
      // Shuffle the rounds for random order each game
      const shuffledRounds = shuffleArray(questionPack.rounds);
      const shuffledPack = { ...questionPack, rounds: shuffledRounds };
      
      const roundsToPlay = Math.min(settings.numberOfRounds, shuffledPack.rounds.length);
      const multipliers = settings.multipliers.slice(0, roundsToPlay);
      
      return {
        ...state,
        phase: 'playing',
        settings: { ...settings, multipliers },
        teams: {
          A: { id: 'A', name: settings.teamAName, score: 0 },
          B: { id: 'B', name: settings.teamBName, score: 0 },
        },
        questionPack: shuffledPack,
        roundIndex: 0,
        currentRound: createRoundState(0, multipliers[0], shuffledPack.rounds[0].answers.length),
        historyStack: [],
      };
    }

    case 'FACEOFF_SET_BUZZER': {
      if (!state.currentRound || state.currentRound.phase !== 'faceoff') return state;

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          faceoff: {
            ...state.currentRound.faceoff,
            currentTurn: action.team,
          },
        },
      };
    }

    case 'FACEOFF_CORRECT': {
      if (!state.currentRound || state.currentRound.phase !== 'faceoff') return state;
      if (!state.questionPack) return state;

      const snapshot = createSnapshot(state, `Faceoff: Team ${action.team} got answer ${action.answerIndex + 1}`);
      const round = state.questionPack.rounds[state.roundIndex];
      const newRevealed = [...state.currentRound.revealed];
      const newFaceoff = { ...state.currentRound.faceoff };
      
      // Reveal the answer
      newRevealed[action.answerIndex] = true;
      const pointsAdded = round.answers[action.answerIndex].points;
      soundManager.playReveal();

      // Record which answer this team got
      if (action.team === 'A') {
        newFaceoff.teamAAnswerIndex = action.answerIndex;
      } else {
        newFaceoff.teamBAnswerIndex = action.answerIndex;
      }

      // Determine next step
      const otherTeam = action.team === 'A' ? 'B' : 'A';
      const otherTeamAnswered = action.team === 'A' 
        ? (newFaceoff.teamBAnswerIndex !== null || newFaceoff.teamBStrike)
        : (newFaceoff.teamAAnswerIndex !== null || newFaceoff.teamAStrike);

      if (otherTeamAnswered) {
        // Both teams have had their turn - determine winner
        const teamAPoints = newFaceoff.teamAAnswerIndex !== null 
          ? round.answers[newFaceoff.teamAAnswerIndex].points : 0;
        const teamBPoints = newFaceoff.teamBAnswerIndex !== null 
          ? round.answers[newFaceoff.teamBAnswerIndex].points : 0;
        
        // Higher points wins, if tie the team that just answered wins
        if (teamAPoints > teamBPoints) {
          newFaceoff.winner = 'A';
        } else if (teamBPoints > teamAPoints) {
          newFaceoff.winner = 'B';
        } else {
          newFaceoff.winner = action.team; // Tie goes to second answerer
        }
        newFaceoff.currentTurn = 'decide';
      } else {
        // Other team's turn
        newFaceoff.currentTurn = otherTeam;
      }

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          revealed: newRevealed,
          roundPot: state.currentRound.roundPot + pointsAdded,
          faceoff: newFaceoff,
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'FACEOFF_STRIKE': {
      if (!state.currentRound || state.currentRound.phase !== 'faceoff') return state;
      if (!state.questionPack) return state;

      const snapshot = createSnapshot(state, `Faceoff: Team ${action.team} got a strike`);
      const round = state.questionPack.rounds[state.roundIndex];
      const newFaceoff = { ...state.currentRound.faceoff };
      
      soundManager.playStrike();

      // Record the strike
      if (action.team === 'A') {
        newFaceoff.teamAStrike = true;
      } else {
        newFaceoff.teamBStrike = true;
      }

      // Determine next step
      const otherTeam = action.team === 'A' ? 'B' : 'A';
      const otherTeamAnswered = action.team === 'A' 
        ? (newFaceoff.teamBAnswerIndex !== null || newFaceoff.teamBStrike)
        : (newFaceoff.teamAAnswerIndex !== null || newFaceoff.teamAStrike);

      if (otherTeamAnswered) {
        // Both teams have had their turn
        // If one team has an answer and the other has a strike, answer wins
        if (newFaceoff.teamAAnswerIndex !== null && newFaceoff.teamBStrike) {
          newFaceoff.winner = 'A';
        } else if (newFaceoff.teamBAnswerIndex !== null && newFaceoff.teamAStrike) {
          newFaceoff.winner = 'B';
        } else if (newFaceoff.teamAStrike && newFaceoff.teamBStrike) {
          // Both got strikes - give it to the team that went second (they get another chance typically)
          // For simplicity, just pick A or let host decide
          newFaceoff.winner = null; // Host will manually pick
        } else {
          // Both have answers - compare points
          const teamAPoints = newFaceoff.teamAAnswerIndex !== null 
            ? round.answers[newFaceoff.teamAAnswerIndex].points : 0;
          const teamBPoints = newFaceoff.teamBAnswerIndex !== null 
            ? round.answers[newFaceoff.teamBAnswerIndex].points : 0;
          newFaceoff.winner = teamAPoints >= teamBPoints ? 'A' : 'B';
        }
        newFaceoff.currentTurn = 'decide';
      } else {
        // Other team's turn
        newFaceoff.currentTurn = otherTeam;
      }

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          faceoff: newFaceoff,
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'FACEOFF_DECIDE': {
      if (!state.currentRound || state.currentRound.phase !== 'faceoff') return state;

      const snapshot = createSnapshot(state, `Team ${action.team} chose to ${action.choice}`);
      
      // Determine who actually plays
      let controller: 'A' | 'B' = action.team;
      if (action.choice === 'pass') {
        controller = action.team === 'A' ? 'B' : 'A';
      }

      soundManager.playFaceoffDing();

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          phase: 'play',
          controller,
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'REVEAL_ANSWER': {
      if (!state.currentRound || !state.questionPack) return state;
      if (state.currentRound.revealed[action.answerIndex]) return state;

      const snapshot = createSnapshot(state, `Revealed answer ${action.answerIndex + 1}`);
      const round = state.questionPack.rounds[state.roundIndex];
      const newRevealed = [...state.currentRound.revealed];
      newRevealed[action.answerIndex] = true;

      const newPot = state.currentRound.roundPot + round.answers[action.answerIndex].points;
      soundManager.playReveal();

      // Check if all answers revealed
      const allRevealed = newRevealed.every((r) => r);

      // If all revealed, award points to controlling team
      if (allRevealed && state.currentRound.controller) {
        const finalPoints = newPot * state.currentRound.multiplier;
        soundManager.playRoundWin();
        
        return {
          ...state,
          currentRound: {
            ...state.currentRound,
            revealed: newRevealed,
            roundPot: newPot,
            phase: 'ended',
          },
          teams: {
            ...state.teams,
            [state.currentRound.controller]: {
              ...state.teams[state.currentRound.controller],
              score: state.teams[state.currentRound.controller].score + finalPoints,
            },
          },
          historyStack: [...state.historyStack, snapshot],
        };
      }

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          revealed: newRevealed,
          roundPot: newPot,
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'ADD_STRIKE': {
      if (!state.currentRound) return state;
      if (state.currentRound.strikes >= state.settings.strikeLimit) return state;

      const snapshot = createSnapshot(state, 'Strike added');
      const newStrikes = state.currentRound.strikes + 1;
      soundManager.playStrike();

      // Check if should enter steal mode
      const enterSteal = newStrikes >= state.settings.strikeLimit;

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          strikes: newStrikes,
          phase: enterSteal ? 'steal' : state.currentRound.phase,
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'REMOVE_STRIKE': {
      if (!state.currentRound || state.currentRound.strikes <= 0) return state;

      const snapshot = createSnapshot(state, 'Strike removed');

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          strikes: state.currentRound.strikes - 1,
          phase: state.currentRound.phase === 'steal' ? 'play' : state.currentRound.phase,
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'ENTER_STEAL_MODE': {
      if (!state.currentRound || state.currentRound.phase !== 'play') return state;

      const snapshot = createSnapshot(state, 'Entered steal mode');

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          phase: 'steal',
          strikes: state.settings.strikeLimit, // Max out strikes
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'SET_STEAL_GUESS': {
      if (!state.currentRound || state.currentRound.phase !== 'steal') return state;

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          stealGuess: action.guess,
        },
      };
    }

    case 'RESOLVE_STEAL': {
      if (!state.currentRound || state.currentRound.phase !== 'steal') return state;
      if (!state.questionPack) return state;

      const snapshot = createSnapshot(state, 'Steal resolved');
      const round = state.questionPack.rounds[state.roundIndex];
      const stealingTeam = state.currentRound.controller === 'A' ? 'B' : 'A';
      let newRevealed = [...state.currentRound.revealed];
      let newPot = state.currentRound.roundPot;

      if (action.success) {
        // If matchIndex provided, reveal that answer and add its points
        if (action.matchIndex !== undefined) {
          newRevealed[action.matchIndex] = true;
          newPot += round.answers[action.matchIndex].points;
        }
        soundManager.playStealSuccess();
      } else {
        soundManager.playStealFail();
      }

      // Calculate final points - use total revealed points
      const finalPoints = newPot * state.currentRound.multiplier;
      const winningTeam = action.success ? stealingTeam : state.currentRound.controller!;

      // Reveal all answers for display
      newRevealed = newRevealed.map(() => true);

      soundManager.playRoundWin();

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          revealed: newRevealed,
          roundPot: newPot,
          phase: 'ended',
          stealResult: action.success ? 'success' : 'failed',
        },
        teams: {
          ...state.teams,
          [winningTeam]: {
            ...state.teams[winningTeam],
            score: state.teams[winningTeam].score + finalPoints,
          },
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'END_ROUND': {
      if (!state.currentRound) return state;

      const snapshot = createSnapshot(state, 'Round ended');
      const finalPoints = state.currentRound.roundPot * state.currentRound.multiplier;
      
      soundManager.playRoundWin();

      // Reveal all answers
      const newRevealed = state.currentRound.revealed.map(() => true);

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          revealed: newRevealed,
          phase: 'ended',
        },
        teams: {
          ...state.teams,
          [action.winningTeam]: {
            ...state.teams[action.winningTeam],
            score: state.teams[action.winningTeam].score + finalPoints,
          },
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'NEXT_ROUND': {
      if (!state.questionPack) return state;
      
      const nextIndex = state.roundIndex + 1;
      const totalRounds = Math.min(state.settings.numberOfRounds, state.questionPack.rounds.length);

      if (nextIndex >= totalRounds) {
        soundManager.playGameOver();
        return {
          ...state,
          phase: 'gameOver',
          currentRound: null,
        };
      }

      const multiplier = state.settings.multipliers[nextIndex] || 1;

      return {
        ...state,
        roundIndex: nextIndex,
        currentRound: createRoundState(
          nextIndex,
          multiplier,
          state.questionPack.rounds[nextIndex].answers.length
        ),
        historyStack: [],
      };
    }

    case 'SKIP_ROUND': {
      if (!state.questionPack) return state;
      
      const nextIndex = state.roundIndex + 1;
      const totalRounds = Math.min(state.settings.numberOfRounds, state.questionPack.rounds.length);

      if (nextIndex >= totalRounds) {
        soundManager.playGameOver();
        return {
          ...state,
          phase: 'gameOver',
          currentRound: null,
        };
      }

      const multiplier = state.settings.multipliers[nextIndex] || 1;

      // Skip to next round without awarding points
      return {
        ...state,
        roundIndex: nextIndex,
        currentRound: createRoundState(
          nextIndex,
          multiplier,
          state.questionPack.rounds[nextIndex].answers.length
        ),
        historyStack: [],
      };
    }

    case 'REVEAL_ALL': {
      if (!state.currentRound || !state.questionPack) return state;

      const snapshot = createSnapshot(state, 'All answers revealed');
      const round = state.questionPack.rounds[state.roundIndex];
      
      // Calculate total pot from all answers
      const totalPot = round.answers.reduce((sum, ans) => sum + ans.points, 0);

      return {
        ...state,
        currentRound: {
          ...state.currentRound,
          revealed: new Array(round.answers.length).fill(true),
          roundPot: totalPot,
        },
        historyStack: [...state.historyStack, snapshot],
      };
    }

    case 'UNDO': {
      if (state.historyStack.length === 0) return state;

      const lastSnapshot = state.historyStack[state.historyStack.length - 1];

      return {
        ...state,
        teams: lastSnapshot.teams,
        roundIndex: lastSnapshot.roundIndex,
        currentRound: lastSnapshot.currentRound,
        historyStack: state.historyStack.slice(0, -1),
      };
    }

    case 'ADJUST_SCORE': {
      const newScore = Math.max(0, state.teams[action.team].score + action.amount);

      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: {
            ...state.teams[action.team],
            score: newScore,
          },
        },
      };
    }

    case 'SET_SCORE': {
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: {
            ...state.teams[action.team],
            score: Math.max(0, action.score),
          },
        },
      };
    }

    case 'RESTART_GAME': {
      if (!state.questionPack) return state;

      return {
        ...state,
        phase: 'playing',
        teams: {
          A: { ...state.teams.A, score: 0 },
          B: { ...state.teams.B, score: 0 },
        },
        roundIndex: 0,
        currentRound: createRoundState(
          0,
          state.settings.multipliers[0],
          state.questionPack.rounds[0].answers.length
        ),
        historyStack: [],
      };
    }

    case 'RESET_ALL':
      clearGameState();
      return initialGameState;

    default:
      return state;
  }
}

// ===== Context =====

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  startGame: (settings: GameSettings, questionPack: QuestionPack) => void;
  // Face-off actions
  faceoffSetBuzzer: (team: 'A' | 'B') => void;
  faceoffCorrect: (team: 'A' | 'B', answerIndex: number) => void;
  faceoffStrike: (team: 'A' | 'B') => void;
  faceoffDecide: (team: 'A' | 'B', choice: 'play' | 'pass') => void;
  // Play actions
  revealAnswer: (answerIndex: number) => void;
  addStrike: () => void;
  removeStrike: () => void;
  enterStealMode: () => void;
  setStealGuess: (guess: string) => void;
  resolveSteal: (success: boolean, matchIndex?: number) => void;
  endRound: (winningTeam: 'A' | 'B') => void;
  nextRound: () => void;
  skipRound: () => void;
  revealAll: () => void;
  undo: () => void;
  adjustScore: (team: 'A' | 'B', amount: number) => void;
  setScore: (team: 'A' | 'B', score: number) => void;
  restartGame: () => void;
  resetAll: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState && savedState.phase !== 'setup') {
      dispatch({ type: 'LOAD_STATE', state: savedState });
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    if (state.phase !== 'setup') {
      saveGameState(state);
    }
  }, [state]);

  // Action creators
  const startGame = useCallback((settings: GameSettings, questionPack: QuestionPack) => {
    dispatch({ type: 'START_GAME', settings, questionPack });
  }, []);

  // Face-off actions
  const faceoffSetBuzzer = useCallback((team: 'A' | 'B') => {
    dispatch({ type: 'FACEOFF_SET_BUZZER', team });
  }, []);

  const faceoffCorrect = useCallback((team: 'A' | 'B', answerIndex: number) => {
    dispatch({ type: 'FACEOFF_CORRECT', team, answerIndex });
  }, []);

  const faceoffStrike = useCallback((team: 'A' | 'B') => {
    dispatch({ type: 'FACEOFF_STRIKE', team });
  }, []);

  const faceoffDecide = useCallback((team: 'A' | 'B', choice: 'play' | 'pass') => {
    dispatch({ type: 'FACEOFF_DECIDE', team, choice });
  }, []);

  const revealAnswer = useCallback((answerIndex: number) => {
    dispatch({ type: 'REVEAL_ANSWER', answerIndex });
  }, []);

  const addStrike = useCallback(() => {
    dispatch({ type: 'ADD_STRIKE' });
  }, []);

  const removeStrike = useCallback(() => {
    dispatch({ type: 'REMOVE_STRIKE' });
  }, []);

  const enterStealMode = useCallback(() => {
    dispatch({ type: 'ENTER_STEAL_MODE' });
  }, []);

  const setStealGuess = useCallback((guess: string) => {
    dispatch({ type: 'SET_STEAL_GUESS', guess });
  }, []);

  const resolveSteal = useCallback((success: boolean, matchIndex?: number) => {
    dispatch({ type: 'RESOLVE_STEAL', success, matchIndex });
  }, []);

  const endRound = useCallback((winningTeam: 'A' | 'B') => {
    dispatch({ type: 'END_ROUND', winningTeam });
  }, []);

  const nextRound = useCallback(() => {
    dispatch({ type: 'NEXT_ROUND' });
  }, []);

  const skipRound = useCallback(() => {
    dispatch({ type: 'SKIP_ROUND' });
  }, []);

  const revealAll = useCallback(() => {
    dispatch({ type: 'REVEAL_ALL' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const adjustScore = useCallback((team: 'A' | 'B', amount: number) => {
    dispatch({ type: 'ADJUST_SCORE', team, amount });
  }, []);

  const setScore = useCallback((team: 'A' | 'B', score: number) => {
    dispatch({ type: 'SET_SCORE', team, score });
  }, []);

  const restartGame = useCallback(() => {
    dispatch({ type: 'RESTART_GAME' });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  const value: GameContextType = {
    state,
    dispatch,
    startGame,
    faceoffSetBuzzer,
    faceoffCorrect,
    faceoffStrike,
    faceoffDecide,
    revealAnswer,
    addStrike,
    removeStrike,
    enterStealMode,
    setStealGuess,
    resolveSteal,
    endRound,
    nextRound,
    skipRound,
    revealAll,
    undo,
    adjustScore,
    setScore,
    restartGame,
    resetAll,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export { defaultSettings };

