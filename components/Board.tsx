import React from 'react';
import { Cell } from './Cell';
import { SymbolType } from '../types';

interface BoardProps {
  board: SymbolType[];
  onCellClick: (index: number) => void;
  lastMoveIndex: number | null;
  interactive: boolean;
}

export const Board: React.FC<BoardProps> = ({ board, onCellClick, lastMoveIndex, interactive }) => {
  return (
    <div className="relative p-4">
      {/* Coordinates Wrapper */}
      <div className="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] gap-2">
        
        {/* Left Coordinates (1, 2, 3) - Reversed visually (3 top, 1 bottom) usually in chess, 
            but prompt says "1, 2, 3 (bottom up)". So 3 is top. */}
        <div className="flex flex-col justify-around text-gray-500 text-xs font-mono py-2">
          <span>3</span>
          <span>2</span>
          <span>1</span>
        </div>

        {/* The Grid */}
        <div className="w-64 h-64 sm:w-80 sm:h-80 bg-gray-900 border-2 border-gray-600 rounded-lg shadow-2xl overflow-hidden grid grid-cols-3 grid-rows-3 relative">
           {/* Grid Lines Overlay for aesthetics */}
           <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-0">
             <div className="border-r border-b border-gray-800/50"></div>
             <div className="border-r border-b border-gray-800/50"></div>
             <div className="border-b border-gray-800/50"></div>
             <div className="border-r border-b border-gray-800/50"></div>
             <div className="border-r border-b border-gray-800/50"></div>
             <div className="border-b border-gray-800/50"></div>
             <div className="border-r border-gray-800/50"></div>
             <div className="border-r border-gray-800/50"></div>
             <div></div>
           </div>

           {board.map((symbol, index) => (
             <div key={index} className="z-10 w-full h-full">
               <Cell 
                 value={symbol}
                 onClick={() => onCellClick(index)}
                 isLastMove={index === lastMoveIndex}
                 disabled={!interactive}
               />
             </div>
           ))}
        </div>

        {/* Bottom Coordinates (a, b, c) */}
        <div className="col-start-2 flex justify-around text-gray-500 text-xs font-mono uppercase">
          <span>a</span>
          <span>b</span>
          <span>c</span>
        </div>
      </div>
    </div>
  );
};
