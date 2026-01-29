// ===== Core Game Types =====

export interface Answer {
  text: string;
  points: number;
  aliases?: string[];
}

export interface Round {
  id: string;
  question: string;
  answers: Answer[];
}

export interface QuestionPack {
  title: string;
  rounds: Round[];
}

export interface Team {
  id: 'A' | 'B';
  name: string;
  score: number;
}

// ===== Game Phase Types =====

export type GamePhase = 'setup' | 'playing' | 'gameOver';
export type RoundPhase = 'faceoff' | 'play' | 'steal' | 'ended';

// ===== Round Runtime State =====

export interface RoundState {
  roundIndex: number;
  revealed: boolean[];
  strikes: number;
  controller: 'A' | 'B' | null;
  phase: RoundPhase;
  roundPot: number;
  multiplier: number;
  // Face-off tracking
  faceoff: {
    currentTurn: 'A' | 'B' | 'decide'; // Whose turn to answer, or decision time
    teamAAnswerIndex: number | null; // Which answer Team A got (null = strike/hasn't answered)
    teamBAnswerIndex: number | null; // Which answer Team B got
    teamAStrike: boolean; // Did Team A get a strike?
    teamBStrike: boolean; // Did Team B get a strike?
    winner: 'A' | 'B' | null; // Who won the face-off
  };
  stealGuess: string | null;
  stealResult: 'pending' | 'success' | 'failed' | null;
}

// ===== Game Settings =====

export interface GameSettings {
  gameTitle: string;
  teamAName: string;
  teamBName: string;
  numberOfRounds: number;
  enableFastMoney: boolean;
  strikeLimit: number;
  customRules: boolean;
  multipliers: number[];
}

// ===== Full Game State =====

export interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  teams: {
    A: Team;
    B: Team;
  };
  questionPack: QuestionPack | null;
  roundIndex: number;
  currentRound: RoundState | null;
  historyStack: GameSnapshot[];
}

// ===== Snapshot for Undo =====

export interface GameSnapshot {
  teams: {
    A: Team;
    B: Team;
  };
  roundIndex: number;
  currentRound: RoundState | null;
  action: string;
  timestamp: number;
}

// ===== Fast Money Types =====

export interface FastMoneyQuestion {
  id: string;
  question: string;
  answers: Answer[];
}

export interface FastMoneyState {
  questions: FastMoneyQuestion[];
  player1Answers: (string | null)[];
  player2Answers: (string | null)[];
  player1Points: number[];
  player2Points: number[];
  currentPlayer: 1 | 2;
  currentQuestionIndex: number;
  phase: 'player1' | 'player2' | 'reveal' | 'ended';
  totalScore: number;
}

// ===== Action Types =====

export type GameAction =
  | { type: 'START_GAME'; settings: GameSettings; questionPack: QuestionPack }
  | { type: 'SET_FACEOFF_WINNER'; team: 'A' | 'B' }
  | { type: 'SET_FACEOFF_GUESS'; team: 'A' | 'B'; guess: string; matchIndex: number | null }
  | { type: 'RESOLVE_FACEOFF'; controllingTeam: 'A' | 'B'; playOrPass: 'play' | 'pass' }
  | { type: 'REVEAL_ANSWER'; answerIndex: number }
  | { type: 'ADD_STRIKE' }
  | { type: 'REMOVE_STRIKE' }
  | { type: 'ENTER_STEAL_MODE' }
  | { type: 'RESOLVE_STEAL'; success: boolean; matchIndex?: number }
  | { type: 'END_ROUND'; winningTeam: 'A' | 'B' }
  | { type: 'NEXT_ROUND' }
  | { type: 'REVEAL_ALL' }
  | { type: 'UNDO' }
  | { type: 'ADJUST_SCORE'; team: 'A' | 'B'; amount: number }
  | { type: 'SET_SCORE'; team: 'A' | 'B'; score: number }
  | { type: 'RESTART_GAME' }
  | { type: 'RESET_ALL' };

// ===== Validation Types =====

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ===== Match Result =====

export interface MatchResult {
  matched: boolean;
  answerIndex: number | null;
  confidence: number;
}

