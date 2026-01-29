import { Answer, MatchResult } from '../types';

// Normalize text for matching
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Calculate Levenshtein distance between two strings
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity score (0-1)
export function calculateSimilarity(a: string, b: string): number {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);

  if (normalizedA === normalizedB) return 1;

  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(normalizedA, normalizedB);
  return 1 - distance / maxLength;
}

// Check if guess matches any answer (including aliases)
export function findBestMatch(
  guess: string,
  answers: Answer[],
  revealed: boolean[],
  threshold: number = 0.7
): MatchResult {
  const normalizedGuess = normalizeText(guess);
  
  let bestMatch: MatchResult = {
    matched: false,
    answerIndex: null,
    confidence: 0,
  };

  answers.forEach((answer, index) => {
    // Skip already revealed answers
    if (revealed[index]) return;

    // Check main answer text
    const mainSimilarity = calculateSimilarity(normalizedGuess, answer.text);
    if (mainSimilarity > bestMatch.confidence) {
      bestMatch = {
        matched: mainSimilarity >= threshold,
        answerIndex: index,
        confidence: mainSimilarity,
      };
    }

    // Check aliases
    if (answer.aliases) {
      answer.aliases.forEach((alias) => {
        const aliasSimilarity = calculateSimilarity(normalizedGuess, alias);
        if (aliasSimilarity > bestMatch.confidence) {
          bestMatch = {
            matched: aliasSimilarity >= threshold,
            answerIndex: index,
            confidence: aliasSimilarity,
          };
        }
      });
    }
  });

  return bestMatch;
}

// Get potential matches for host to choose from
export function getPotentialMatches(
  guess: string,
  answers: Answer[],
  revealed: boolean[],
  minConfidence: number = 0.3
): Array<{ index: number; answer: Answer; confidence: number }> {
  const normalizedGuess = normalizeText(guess);
  const matches: Array<{ index: number; answer: Answer; confidence: number }> = [];

  answers.forEach((answer, index) => {
    if (revealed[index]) return;

    // Calculate best confidence between main text and aliases
    let bestConfidence = calculateSimilarity(normalizedGuess, answer.text);

    if (answer.aliases) {
      answer.aliases.forEach((alias) => {
        const aliasSimilarity = calculateSimilarity(normalizedGuess, alias);
        if (aliasSimilarity > bestConfidence) {
          bestConfidence = aliasSimilarity;
        }
      });
    }

    if (bestConfidence >= minConfidence) {
      matches.push({
        index,
        answer,
        confidence: bestConfidence,
      });
    }
  });

  return matches.sort((a, b) => b.confidence - a.confidence);
}

