import { GameState, GameSettings, QuestionPack } from '../types';

const STORAGE_KEYS = {
  GAME_STATE: 'familyFeud_gameState',
  SETTINGS: 'familyFeud_settings',
  QUESTION_PACK: 'familyFeud_questionPack',
};

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function loadGameState(): GameState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
    if (stored) {
      const state = JSON.parse(stored) as GameState;
      // Validate the state has the new faceoff format
      // If it has the old faceoffGuesses format, discard it
      if (state.currentRound && 'faceoffGuesses' in state.currentRound) {
        console.log('Old game state format detected, clearing...');
        clearGameState();
        return null;
      }
      // Also check if faceoff property exists when in faceoff phase
      if (state.currentRound && !state.currentRound.faceoff) {
        console.log('Invalid game state, clearing...');
        clearGameState();
        return null;
      }
      return state;
    }
  } catch (error) {
    console.error('Failed to load game state:', error);
    clearGameState();
  }
  return null;
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function loadSettings(): GameSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return JSON.parse(stored) as GameSettings;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return null;
}

export function saveQuestionPack(pack: QuestionPack): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTION_PACK, JSON.stringify(pack));
  } catch (error) {
    console.error('Failed to save question pack:', error);
  }
}

export function loadQuestionPack(): QuestionPack | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.QUESTION_PACK);
    if (stored) {
      return JSON.parse(stored) as QuestionPack;
    }
  } catch (error) {
    console.error('Failed to load question pack:', error);
  }
  return null;
}

export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

