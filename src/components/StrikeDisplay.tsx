import React from 'react';

interface StrikeDisplayProps {
  strikes: number;
  maxStrikes: number;
}

export function StrikeDisplay({ strikes, maxStrikes }: StrikeDisplayProps) {
  return (
    <div className="strike-container">
      {Array.from({ length: maxStrikes }).map((_, i) => (
        <div
          key={i}
          className={`strike-x ${i < strikes ? 'active' : 'empty'}`}
        >
          X
        </div>
      ))}
    </div>
  );
}
