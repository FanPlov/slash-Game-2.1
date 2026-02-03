import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './components/Board';
import { PlayerInfo } from './components/PlayerInfo';
import { Controls } from './components/Controls';
import { 
  GameState, GameMode, Player, GamePhase, Lang, SymbolType, HistoryState 
} from './types';
import { 
  getInitialBoard, isValidMove, applyMove, getOtherPlayer, checkPhaseChange, getBotMove 
} from './services/gameLogic';
import { TRANSLATIONS } from './constants';

const INITIAL_TIME = 30;

const App: React.FC = () => {
  // --- Settings & UI State ---
  const [lang, setLang] = useState<Lang>(Lang.RU);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [showLastMoveHighlight, setShowLastMoveHighlight] = useState(true);

  // --- Game State ---
  const [mode, setMode] = useState<GameMode>('MENU');
  const [gameState, setGameState] = useState<GameState>({
    board: getInitialBoard(),
    currentPlayer: Player.P1,
    phase: GamePhase.EXPANSION,
    lastMoveIndex: null,
    winner: null,
    isDraw: false,
    history: [],
    currentHistoryStep: -1
  });

  // --- Timers ---
  const [p1Time, setP1Time] = useState(INITIAL_TIME);
  const [p2Time, setP2Time] = useState(INITIAL_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const t = TRANSLATIONS[lang];

  // --- Helpers ---
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetTimers = () => {
    stopTimer();
    setP1Time(INITIAL_TIME);
    setP2Time(INITIAL_TIME);
  };

  const startTimer = useCallback(() => {
    stopTimer();
    if (gameState.winner || mode === 'MENU' || pauseOpen) return;

    timerRef.current = setInterval(() => {
      if (gameState.currentPlayer === Player.P1) {
        setP1Time(prev => {
          if (prev <= 1) {
             handleTimeOut(Player.P1);
             return 0;
          }
          return prev - 1;
        });
      } else {
        setP2Time(prev => {
          if (prev <= 1) {
            handleTimeOut(Player.P2);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
  }, [gameState.currentPlayer, gameState.winner, mode, pauseOpen]);

  const handleTimeOut = (loser: Player) => {
    stopTimer();
    setGameState(prev => ({
      ...prev,
      winner: getOtherPlayer(loser)
    }));
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer]);

  // --- Game Logic Handling ---

  const initGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    const initialBoard = getInitialBoard();
    setGameState({
      board: initialBoard,
      currentPlayer: Player.P1,
      phase: GamePhase.EXPANSION,
      lastMoveIndex: null,
      winner: null,
      isDraw: false,
      history: [{
        board: initialBoard,
        currentPlayer: Player.P1,
        phase: GamePhase.EXPANSION,
        lastMoveIndex: null
      }],
      currentHistoryStep: 0
    });
    resetTimers();
    setRulesOpen(false);
    setSettingsOpen(false);
    setPauseOpen(false);
  };

  const handleMove = (index: number) => {
    if (gameState.winner || pauseOpen) return;
    
    // Check validity
    if (!isValidMove(
      gameState.board, 
      index, 
      gameState.currentPlayer, 
      gameState.phase, 
      gameState.lastMoveIndex
    )) return;

    // Apply Move
    const { newBoard, causedWin } = applyMove(
      gameState.board, 
      index, 
      gameState.currentPlayer, 
      gameState.phase
    );

    // Determine next phase (strictly based on board state)
    const nextPhase = checkPhaseChange(newBoard) ? GamePhase.BATTLE : GamePhase.EXPANSION;
    
    const nextPlayer = getOtherPlayer(gameState.currentPlayer);

    const newState: GameState = {
      ...gameState,
      board: newBoard,
      currentPlayer: nextPlayer,
      phase: nextPhase,
      lastMoveIndex: index,
      winner: causedWin ? gameState.currentPlayer : null,
      history: [
        ...gameState.history.slice(0, gameState.currentHistoryStep + 1),
        {
          board: newBoard,
          currentPlayer: nextPlayer,
          phase: nextPhase,
          lastMoveIndex: index
        }
      ],
      currentHistoryStep: gameState.currentHistoryStep + 1
    };

    setGameState(newState);
    
    // Reset timer for the player who just moved (per prompt req)
    if (gameState.currentPlayer === Player.P1) setP1Time(INITIAL_TIME);
    else setP2Time(INITIAL_TIME);
  };

  // Bot Effect
  useEffect(() => {
    if (mode === 'PVE' && gameState.currentPlayer === Player.P2 && !gameState.winner && !pauseOpen) {
      const delay = setTimeout(() => {
        const moveIndex = getBotMove(gameState.board, gameState.phase, gameState.lastMoveIndex, Player.P2);
        if (moveIndex !== -1) {
          handleMove(moveIndex);
        } else {
          // Bot has no moves? Should be draw or handled, but in this game logic it usually implies waiting or loss if strict. 
          // For simplicity, do nothing or force random if stuck (unlikely with valid moves).
        }
      }, 700); // Artificial thinking delay
      return () => clearTimeout(delay);
    }
  }, [gameState.currentPlayer, mode, gameState.winner, pauseOpen]);

  // --- History Controls ---

  const handleBack = () => {
    if (gameState.currentHistoryStep > 0) {
      const prevStep = gameState.currentHistoryStep - 1;
      const historyState = gameState.history[prevStep];
      restoreHistoryState(historyState, prevStep);
    }
  };

  const handleForward = () => {
    if (gameState.currentHistoryStep < gameState.history.length - 1) {
      const nextStep = gameState.currentHistoryStep + 1;
      const historyState = gameState.history[nextStep];
      restoreHistoryState(historyState, nextStep);
    }
  };

  const restoreHistoryState = (h: HistoryState, step: number) => {
    setGameState(prev => ({
      ...prev,
      board: h.board,
      currentPlayer: h.currentPlayer,
      phase: h.phase,
      lastMoveIndex: h.lastMoveIndex,
      winner: null, // Reset winner when navigating history
      currentHistoryStep: step
    }));
    // Note: Timers are not restored to history state in this implementation to keep it simple, 
    // but effectively pausing interaction if not current head.
  };
  
  const isViewingHistory = gameState.currentHistoryStep < gameState.history.length - 1;

  // --- Renders ---

  if (mode === 'MENU') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-400 mb-8 uppercase tracking-widest font-mono">
          Slash
        </h1>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button onClick={() => initGame('PVP')} className="p-4 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold shadow-lg transition transform hover:scale-105">
            {t.playPvP}
          </button>
          <button onClick={() => initGame('PVE')} className="p-4 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold shadow-lg transition transform hover:scale-105">
            {t.playPvE}
          </button>
          <button onClick={() => setRulesOpen(true)} className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 font-medium">
            {t.rules}
          </button>
        </div>

        {/* Floating Settings Icon */}
        <button 
          onClick={() => setSettingsOpen(true)} 
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        {/* Rules Modal */}
        {rulesOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
             <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full border border-gray-600">
               <h2 className="text-xl font-bold mb-4 text-white">{t.rules}</h2>
               <p className="whitespace-pre-wrap text-gray-300 text-sm mb-6 leading-relaxed">
                 {t.rulesText}
               </p>
               <button onClick={() => setRulesOpen(false)} className="w-full py-2 bg-gray-600 rounded text-white">{t.back}</button>
             </div>
          </div>
        )}

        {/* Settings Modal */}
        {settingsOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg max-w-xs w-full border border-gray-600">
              <h2 className="text-xl font-bold mb-4 text-white text-center">{t.settings}</h2>
              <div className="flex flex-col gap-2">
                {[Lang.RU, Lang.EN, Lang.UZ].map(l => (
                  <button 
                    key={l} 
                    onClick={() => setLang(l)} 
                    className={`py-2 rounded border ${lang === l ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                  >
                    {l === Lang.RU ? 'Русский' : l === Lang.EN ? 'English' : 'O‘zbekcha'}
                  </button>
                ))}
              </div>
              <button onClick={() => setSettingsOpen(false)} className="mt-6 w-full py-2 bg-gray-600 rounded text-white">{t.back}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Game View ---
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Header */}
      <div className="h-14 flex items-center justify-between px-4 bg-slate-800 border-b border-gray-700 shrink-0">
        <button onClick={() => setMode('MENU')} className="text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold tracking-wider text-gray-200">SLASH CLASSIC</h1>
        <button onClick={() => setSettingsOpen(true)} className="text-gray-400 hover:text-white">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4 w-full">
        
        {/* Opponent (Top) */}
        <div className="w-full flex justify-center">
          <PlayerInfo 
            player={Player.P2} 
            name={mode === 'PVE' ? t.botName : 'Player 2'} 
            timeLeft={p2Time}
            isActive={gameState.currentPlayer === Player.P2 && !gameState.winner && !isViewingHistory}
            isFlipped={true} // Rotated internal content
          />
        </div>

        {/* Status Text (Phase/Winner) */}
        <div className="h-8 flex items-center justify-center">
            {gameState.winner ? (
               <span className="text-yellow-400 font-bold text-xl animate-pulse">
                 {t.winner}: {gameState.winner === Player.P1 ? 'Player 1' : (mode === 'PVE' ? t.botName : 'Player 2')}
               </span>
            ) : (
               <span className="text-gray-400 text-sm uppercase tracking-widest font-mono">
                  {gameState.phase === GamePhase.EXPANSION ? t.phase1 : t.phase2}
               </span>
            )}
        </div>

        {/* Board */}
        <Board 
          board={gameState.board}
          onCellClick={handleMove}
          lastMoveIndex={showLastMoveHighlight ? gameState.lastMoveIndex : null}
          interactive={!gameState.winner && !isViewingHistory && !(mode === 'PVE' && gameState.currentPlayer === Player.P2)}
        />

        {/* Self (Bottom) */}
        <div className="w-full flex justify-center">
          <PlayerInfo 
            player={Player.P1} 
            name="Player 1" 
            timeLeft={p1Time}
            isActive={gameState.currentPlayer === Player.P1 && !gameState.winner && !isViewingHistory}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="pb-6 pt-2 flex justify-center bg-slate-900 sticky bottom-0 z-20 w-full">
         <Controls 
           lang={lang}
           onMenu={() => setRulesOpen(true)}
           onPause={() => setPauseOpen(true)}
           onBack={handleBack}
           onForward={handleForward}
           onReset={() => initGame(mode)}
           onShowLastMove={() => setShowLastMoveHighlight(!showLastMoveHighlight)}
           canGoBack={gameState.currentHistoryStep > 0}
           canGoForward={gameState.currentHistoryStep < gameState.history.length - 1}
           showLastMoveActive={showLastMoveHighlight}
         />
      </div>

      {/* Pause/Settings Modals (Reused from Menu logic mostly) */}
      {pauseOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-600 flex flex-col gap-4 w-64">
            <button onClick={() => setPauseOpen(false)} className="py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold">{t.resume}</button>
            <button onClick={() => setMode('MENU')} className="py-3 bg-gray-700 hover:bg-gray-600 rounded text-white">{t.menu}</button>
          </div>
        </div>
      )}

      {rulesOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
             <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full border border-gray-600">
               <h2 className="text-xl font-bold mb-4 text-white">{t.rules}</h2>
               <p className="whitespace-pre-wrap text-gray-300 text-sm mb-6 leading-relaxed">
                 {t.rulesText}
               </p>
               <button onClick={() => setRulesOpen(false)} className="w-full py-2 bg-gray-600 rounded text-white">{t.back}</button>
             </div>
          </div>
      )}

      {settingsOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg max-w-xs w-full border border-gray-600">
              <h2 className="text-xl font-bold mb-4 text-white text-center">{t.settings}</h2>
              <div className="flex flex-col gap-2">
                {[Lang.RU, Lang.EN, Lang.UZ].map(l => (
                  <button 
                    key={l} 
                    onClick={() => setLang(l)} 
                    className={`py-2 rounded border ${lang === l ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                  >
                    {l === Lang.RU ? 'Русский' : l === Lang.EN ? 'English' : 'O‘zbekcha'}
                  </button>
                ))}
              </div>
              <button onClick={() => setSettingsOpen(false)} className="mt-6 w-full py-2 bg-gray-600 rounded text-white">{t.back}</button>
            </div>
          </div>
        )}

    </div>
  );
};

export default App;