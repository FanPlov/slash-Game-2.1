import React from 'react';
import { Player } from '../types';

interface PlayerInfoProps {
  player: Player;
  name: string;
  timeLeft: number;
  isActive: boolean;
  isFlipped?: boolean;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, name, timeLeft, isActive, isFlipped = false }) => {
  const isDanger = timeLeft <= 5;
  const isP1 = player === Player.P1;

  // P1 is Vertical (Blue), P2 is Horizontal (Red)
  const colorClass = isP1 ? 'text-blue-500' : 'text-red-500';
  const borderClass = isActive 
    ? (isP1 ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]')
    : 'border-transparent opacity-60';

  return (
    <div 
      className={`
        w-full max-w-sm px-4 py-2 
        flex justify-between items-center 
        bg-gray-800 rounded-lg border-2 
        transition-all duration-300
        ${borderClass}
        ${isFlipped ? 'rotate-180' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        {/* Simple Avatar/Icon */}
        <div className={`w-8 h-8 rounded flex items-center justify-center bg-gray-900 ${colorClass} font-bold`}>
           {isP1 ? '|' : '—'}
        </div>
        <span className={`font-semibold tracking-wide ${isActive ? 'text-white' : 'text-gray-400'}`}>
          {name}
        </span>
      </div>

      <div className={`
        font-mono text-xl font-bold 
        ${isActive ? (isDanger ? 'text-red-500 animate-pulse' : 'text-white') : 'text-gray-500'}
      `}>
        00:{timeLeft.toString().padStart(2, '0')}
      </div>
    </div>
  );
};
