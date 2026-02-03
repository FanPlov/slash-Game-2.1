import React from 'react';
import { SymbolType } from '../types';

interface CellProps {
  value: SymbolType;
  onClick: () => void;
  isLastMove: boolean;
  isValid: boolean; // Optional: could allow highlighting valid moves
  disabled: boolean;
}

export const Cell: React.FC<CellProps> = ({ value, onClick, isLastMove, disabled }) => {
  
  // Icon Rendering
  const renderContent = () => {
    switch (value) {
      case SymbolType.V:
        return (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-2 h-3/5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          </div>
        );
      case SymbolType.H:
        return (
          <div className="h-full w-full flex items-center justify-center">
            <div className="h-2 w-3/5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          </div>
        );
      case SymbolType.PLUS:
        return (
          <div className="h-full w-full relative flex items-center justify-center">
            <div className="absolute w-2 h-3/5 bg-purple-400 rounded-full"></div>
            <div className="absolute h-2 w-3/5 bg-purple-400 rounded-full"></div>
          </div>
        );
      case SymbolType.SLASH:
        return (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-2 h-4/5 bg-yellow-400 rotate-45 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.8)]"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full h-full border border-gray-700 
        flex items-center justify-center text-2xl
        transition-all duration-200
        ${isLastMove ? 'bg-gray-800 ring-2 ring-inset ring-green-500/50' : 'bg-transparent'}
        ${!disabled ? 'hover:bg-gray-800/50 active:bg-gray-700' : 'cursor-not-allowed'}
      `}
    >
      {renderContent()}
    </button>
  );
};
