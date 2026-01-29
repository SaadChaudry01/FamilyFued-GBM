import React from 'react';
import { Answer } from '../types';

interface AnswerCardProps {
  index: number;
  answer: Answer;
  revealed: boolean;
  onClick?: () => void;
  showPoints?: boolean;
}

export function AnswerCard({ index, answer, revealed, onClick, showPoints = true }: AnswerCardProps) {
  return (
    <div
      className={`answer-card w-full h-20 cursor-pointer ${revealed ? 'revealed' : ''}`}
      onClick={onClick}
    >
      <div className="answer-card-inner">
        {/* Front - Unrevealed */}
        <div className="answer-card-front">
          <span className="text-5xl font-display text-feud-gold drop-shadow-lg">
            {index + 1}
          </span>
        </div>

        {/* Back - Revealed */}
        <div className="answer-card-back flex justify-between items-center px-6">
          <span className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide">
            {answer.text}
          </span>
          {showPoints && (
            <span className="text-2xl md:text-3xl font-display text-feud-gold ml-4">
              {answer.points}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

