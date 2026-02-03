import React, { useRef, useState } from 'react';
import { Lang } from '../types';
import { TRANSLATIONS } from '../constants';

interface ControlsProps {
  lang: Lang;
  onMenu: () => void;
  onPause: () => void;
  onBack: () => void;
  onForward: () => void;
  onReset: () => void;
  onShowLastMove: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  showLastMoveActive: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  lang, onMenu, onPause, onBack, onForward, onReset, onShowLastMove,
  canGoBack, canGoForward, showLastMoveActive
}) => {
  const t = TRANSLATIONS[lang];
  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

  // Hold Menu Logic
  const handleMenuDown = () => {
    menuTimerRef.current = setTimeout(() => {
      // Logic to copy telegram link
      navigator.clipboard.writeText('https://t.me/slashclassic').then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }, 1000); // 1 second hold
  };

  const handleMenuUp = () => {
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
      menuTimerRef.current = null;
      if (!copied) {
        onMenu(); // If not held long enough, open Rules menu
      }
    }
  };

  const btnBase = "flex-1 py-3 px-1 rounded bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-xs sm:text-sm font-medium transition-colors border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-200";

  return (
    <div className="w-full max-w-md px-2 relative">
       {copied && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded shadow-lg animate-bounce">
          {t.telegram}
        </div>
      )}
      
      <div className="flex gap-2 w-full justify-between">
        <button 
          className={btnBase}
          onMouseDown={handleMenuDown}
          onMouseUp={handleMenuUp}
          onTouchStart={handleMenuDown}
          onTouchEnd={handleMenuUp}
        >
          {t.menu}
        </button>
        
        <button className={btnBase} onClick={onPause}>
          {t.pause}
        </button>

        <button className={btnBase} onClick={onBack} disabled={!canGoBack}>
          {/* Back Icon */}
          <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <button className={btnBase} onClick={onForward} disabled={!canGoForward}>
           {/* Fwd Icon */}
           <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        <button 
          className={`${btnBase} ${showLastMoveActive ? 'bg-blue-900 border-blue-500' : ''}`} 
          onClick={onShowLastMove}
        >
           {/* Eye Icon */}
           <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>

        <button className={`${btnBase} text-red-400`} onClick={onReset}>
          {t.reset}
        </button>
      </div>
    </div>
  );
};