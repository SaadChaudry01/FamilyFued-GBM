import { QuestionPack, ValidationResult } from '../types';

export function validateQuestionPack(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid JSON structure'] };
  }

  const pack = data as Record<string, unknown>;

  // Check title
  if (!pack.title || typeof pack.title !== 'string') {
    errors.push('Missing or invalid "title" field');
  }

  // Check rounds array
  if (!Array.isArray(pack.rounds)) {
    errors.push('Missing or invalid "rounds" array');
    return { valid: false, errors };
  }

  if (pack.rounds.length === 0) {
    errors.push('Question pack must have at least 1 round');
  }

  // Validate each round
  pack.rounds.forEach((round: unknown, index: number) => {
    if (!round || typeof round !== 'object') {
      errors.push(`Round ${index + 1}: Invalid round structure`);
      return;
    }

    const r = round as Record<string, unknown>;

    if (!r.question || typeof r.question !== 'string' || r.question.trim() === '') {
      errors.push(`Round ${index + 1}: Missing or empty question`);
    }

    if (!Array.isArray(r.answers)) {
      errors.push(`Round ${index + 1}: Missing or invalid answers array`);
      return;
    }

    if (r.answers.length < 3 || r.answers.length > 10) {
      errors.push(`Round ${index + 1}: Answers must be between 3 and 10 (found ${r.answers.length})`);
    }

    // Validate each answer
    r.answers.forEach((answer: unknown, ansIndex: number) => {
      if (!answer || typeof answer !== 'object') {
        errors.push(`Round ${index + 1}, Answer ${ansIndex + 1}: Invalid answer structure`);
        return;
      }

      const a = answer as Record<string, unknown>;

      if (!a.text || typeof a.text !== 'string' || a.text.trim() === '') {
        errors.push(`Round ${index + 1}, Answer ${ansIndex + 1}: Missing or empty text`);
      }

      if (typeof a.points !== 'number' || a.points <= 0) {
        errors.push(`Round ${index + 1}, Answer ${ansIndex + 1}: Points must be a positive number`);
      }

      if (a.aliases !== undefined && !Array.isArray(a.aliases)) {
        errors.push(`Round ${index + 1}, Answer ${ansIndex + 1}: Aliases must be an array`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

export function normalizeQuestionPack(data: unknown): QuestionPack {
  const pack = data as Record<string, unknown>;
  
  return {
    title: pack.title as string,
    rounds: (pack.rounds as Array<Record<string, unknown>>).map((round, index) => ({
      id: (round.id as string) || `round-${index + 1}`,
      question: round.question as string,
      answers: (round.answers as Array<Record<string, unknown>>)
        .map(answer => ({
          text: answer.text as string,
          points: answer.points as number,
          aliases: (answer.aliases as string[] | undefined) || [],
        }))
        .sort((a, b) => b.points - a.points), // Sort by points descending
    })),
  };
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

