import React from 'react';
import { Team } from '../types';

interface TeamScoreProps {
  team: Team;
  isController: boolean;
  isStealing?: boolean;
}

export function TeamScore({ team, isController, isStealing }: TeamScoreProps) {
  return (
    <div
      className={`
        relative p-6 rounded-2xl text-center transition-all duration-300
        ${isController
          ? 'bg-gradient-to-br from-feud-gold/30 to-feud-gold/10 border-4 border-feud-gold animate-pulse-glow'
          : isStealing
            ? 'bg-gradient-to-br from-feud-red/30 to-feud-red/10 border-4 border-feud-red'
            : 'bg-feud-panel/50 border-2 border-gray-600'
        }
      `}
    >
      {/* Team Label */}
      <div className="mb-2">
        {isController && (
          <span className="inline-block px-3 py-1 bg-feud-gold text-feud-dark text-xs font-bold rounded-full mb-2">
            CONTROL
          </span>
        )}
        {isStealing && (
          <span className="inline-block px-3 py-1 bg-feud-red text-white text-xs font-bold rounded-full mb-2 animate-pulse">
            STEALING
          </span>
        )}
      </div>

      {/* Team Name */}
      <h2 className="text-2xl md:text-3xl font-display text-white tracking-wide mb-2">
        {team.name}
      </h2>

      {/* Score */}
      <div className="team-score text-5xl md:text-6xl font-display text-feud-gold">
        {team.score}
      </div>
    </div>
  );
}

