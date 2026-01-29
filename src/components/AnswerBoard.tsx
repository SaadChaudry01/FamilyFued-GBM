import React from 'react';
import { Answer } from '../types';
import { soundManager } from '../utils/sounds';

interface AnswerBoardProps {
  answers: Answer[];
  revealed: boolean[];
  onReveal?: (index: number) => void;
  showNumbers?: boolean;
}

export function AnswerBoard({ answers, revealed, onReveal, showNumbers = true }: AnswerBoardProps) {
  const handleClick = (index: number) => {
    if (onReveal && !revealed[index]) {
      soundManager.playFlip();
      onReveal(index);
    }
  };

  // Split answers into left (1-4) and right (5-8) columns
  const midPoint = Math.ceil(answers.length / 2);
  const leftAnswers = answers.slice(0, midPoint);
  const rightAnswers = answers.slice(midPoint);

  const renderAnswerSlot = (answer: Answer, index: number) => (
    <div
      key={index}
      onClick={() => handleClick(index)}
      className={`answer-slot ${revealed[index] ? 'revealed' : ''} ${onReveal && !revealed[index] ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    >
      {revealed[index] ? (
        // Revealed - show answer and points
        <div className="flex justify-between items-center w-full px-4">
          <div className="flex items-center gap-3">
            <span className="answer-slot-number text-xl opacity-60">{index + 1}</span>
            <span className="answer-text text-lg">{answer.text}</span>
          </div>
          <span className="answer-points">{answer.points}</span>
        </div>
      ) : (
        // Not revealed - show number
        <span className="answer-slot-number">{showNumbers ? index + 1 : '?'}</span>
      )}
    </div>
  );

  return (
    <div className="answer-board w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Answers 1 to midPoint */}
        <div className="space-y-3">
          {leftAnswers.map((answer, idx) => renderAnswerSlot(answer, idx))}
        </div>
        
        {/* Right Column - Answers midPoint+1 to end */}
        <div className="space-y-3">
          {rightAnswers.map((answer, idx) => renderAnswerSlot(answer, midPoint + idx))}
        </div>
      </div>
    </div>
  );
}
