import React from 'react';
import { RoundPhase } from '../types';

interface TopBarProps {
  roundNumber: number;
  totalRounds: number;
  multiplier: number;
  phase: RoundPhase;
  roundPot: number;
}

export function TopBar({ roundNumber, totalRounds, multiplier, phase, roundPot }: TopBarProps) {
  const getPhaseLabel = () => {
    switch (phase) {
      case 'faceoff':
        return '⚔️ FACE-OFF';
      case 'play':
        return '🎮 PLAYING';
      case 'steal':
        return '🎯 STEAL';
      case 'ended':
        return '✅ ROUND ENDED';
      default:
        return '';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'faceoff':
        return 'bg-purple-600';
      case 'play':
        return 'bg-feud-green';
      case 'steal':
        return 'bg-feud-red';
      case 'ended':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-feud-dark/80 backdrop-blur-sm border-b border-feud-gold/30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Round Info */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-sm text-gray-400 block">Round</span>
            <span className="text-3xl font-display text-feud-gold">
              {roundNumber} / {totalRounds}
            </span>
          </div>

          <div className="h-12 w-px bg-feud-gold/30" />

          <div className="text-center">
            <span className="text-sm text-gray-400 block">Multiplier</span>
            <span className="text-3xl font-display text-feud-gold">
              ×{multiplier}
            </span>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className={`${getPhaseColor()} px-6 py-2 rounded-full`}>
          <span className="text-white font-bold text-lg">
            {getPhaseLabel()}
          </span>
        </div>

        {/* Round Pot */}
        <div className="text-center">
          <span className="text-sm text-gray-400 block">Round Pot</span>
          <span className="text-3xl font-display text-feud-gold">
            {roundPot} pts
          </span>
          <span className="text-sm text-gray-400 block">
            (×{multiplier} = {roundPot * multiplier})
          </span>
        </div>
      </div>
    </div>
  );
}

