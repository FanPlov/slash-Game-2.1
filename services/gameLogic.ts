import { SymbolType, Player, GamePhase, GameState } from '../types';
import { GRID_SIZE } from '../constants';

// --- Helpers ---

export const getInitialBoard = (): SymbolType[] => Array(GRID_SIZE * GRID_SIZE).fill(SymbolType.EMPTY);

export const getOtherPlayer = (p: Player): Player => (p === Player.P1 ? Player.P2 : Player.P1);

export const getPlayerSymbol = (p: Player): SymbolType => (p === Player.P1 ? SymbolType.V : SymbolType.H);

// --- Core Logic ---

export const checkWin = (board: SymbolType[]): boolean => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const line of lines) {
    if (line.every(idx => board[idx] === SymbolType.SLASH)) {
      return true;
    }
  }
  return false;
};

export const checkPhaseChange = (board: SymbolType[]): boolean => {
  // Phase 1 ends when no EMPTY cells are left
  return !board.includes(SymbolType.EMPTY);
};

export const isValidMove = (
  board: SymbolType[],
  index: number,
  player: Player,
  phase: GamePhase,
  lastMoveIndex: number | null
): boolean => {
  // Global Constraints
  if (index < 0 || index >= board.length) return false;
  if (board[index] === SymbolType.SLASH) return false; // Cannot touch Slash
  if (index === lastMoveIndex) return false; // Ko Rule: Cannot play on immediate previous spot

  const currentCell = board[index];
  const playerSymbol = getPlayerSymbol(player);
  const otherSymbol = getPlayerSymbol(getOtherPlayer(player));

  if (phase === GamePhase.EXPANSION) {
    // 1. Empty cell -> OK
    if (currentCell === SymbolType.EMPTY) return true;
    // 2. Opponent Symbol -> PLUS
    if (currentCell === otherSymbol) return true;
    
    // Cannot overwrite own symbol or PLUS in Phase 1
    return false;
  } else {
    // Phase 2: Battle
    // 1. PLUS -> SLASH (Attack)
    if (currentCell === SymbolType.PLUS) return true;
    // 2. Opponent Symbol -> PLUS (Reload)
    if (currentCell === otherSymbol) return true;

    return false;
  }
};

export const applyMove = (
  board: SymbolType[],
  index: number,
  player: Player,
  phase: GamePhase
): { newBoard: SymbolType[], causedWin: boolean } => {
  const newBoard = [...board];
  const currentCell = board[index];
  const playerSymbol = getPlayerSymbol(player);

  if (phase === GamePhase.EXPANSION) {
    if (currentCell === SymbolType.EMPTY) {
      newBoard[index] = playerSymbol;
    } else {
      // Must be opponent symbol based on isValidMove
      newBoard[index] = SymbolType.PLUS;
    }
  } else {
    if (currentCell === SymbolType.PLUS) {
      newBoard[index] = SymbolType.SLASH;
    } else {
      newBoard[index] = SymbolType.PLUS;
    }
  }

  const causedWin = checkWin(newBoard);
  return { newBoard, causedWin };
};

// --- Bot Logic (Minimax) ---

export const getValidMoves = (
  board: SymbolType[],
  player: Player,
  phase: GamePhase,
  lastMoveIndex: number | null
): number[] => {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (isValidMove(board, i, player, phase, lastMoveIndex)) {
      moves.push(i);
    }
  }
  return moves;
};

const evaluateBoard = (board: SymbolType[], player: Player): number => {
  // Simple heuristic
  let score = 0;
  const pSymbol = getPlayerSymbol(player);
  
  // Count slashes (neutral, but dangerous if aligned)
  // We want to force slashes that align for us (captured by win check usually)
  
  // Phase independent scoring
  board.forEach(cell => {
    if (cell === SymbolType.PLUS) score += 5; // Potential for slash
    if (cell === pSymbol) score += 2; // Own territory
  });

  if (checkWin(board)) return 1000;

  return score;
};

const minimax = (
  board: SymbolType[],
  depth: number,
  isMaximizing: boolean,
  player: Player,
  phase: GamePhase,
  lastMoveIndex: number | null,
  alpha: number,
  beta: number
): number => {
  const win = checkWin(board);
  if (win) return isMaximizing ? -1000 + depth : 1000 - depth; // Opponent won previous turn effectively
  
  if (depth === 0) return evaluateBoard(board, player) * (isMaximizing ? 1 : -1);

  // Determine current phase for this simulation node
  // If we are simulating deep, phase might have changed in parents, 
  // but for simplicity in shallow depth, we re-check phase condition for next move
  const currentPhase = checkPhaseChange(board) ? GamePhase.BATTLE : GamePhase.EXPANSION;

  const currentPlayer = isMaximizing ? player : getOtherPlayer(player);
  const moves = getValidMoves(board, currentPlayer, currentPhase, lastMoveIndex);

  if (moves.length === 0) return 0; // Draw or stuck

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const { newBoard } = applyMove(board, move, currentPlayer, currentPhase);
      // Check for immediate win to short-circuit
      if (checkWin(newBoard)) return 1000;

      const evalScore = minimax(newBoard, depth - 1, false, player, currentPhase, move, alpha, beta);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const { newBoard } = applyMove(board, move, currentPlayer, currentPhase);
      if (checkWin(newBoard)) return -1000;

      const evalScore = minimax(newBoard, depth - 1, true, player, currentPhase, move, alpha, beta);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getBotMove = (
  board: SymbolType[],
  phase: GamePhase,
  lastMoveIndex: number | null,
  botPlayer: Player
): number => {
  const moves = getValidMoves(board, botPlayer, phase, lastMoveIndex);
  if (moves.length === 0) return -1;

  // 1. Check for immediate win
  for (const move of moves) {
    const { causedWin } = applyMove(board, move, botPlayer, phase);
    if (causedWin) return move;
  }

  // 2. Check for immediate loss prevention (block)
  const opponent = getOtherPlayer(botPlayer);
  const oppMoves = getValidMoves(board, opponent, phase, lastMoveIndex); // Note: lastMoveIndex logic is tricky for hypothetical blocking, but approx ok
  for (const move of oppMoves) {
    const { causedWin } = applyMove(board, move, opponent, phase);
    if (causedWin && moves.includes(move)) return move; // Block by taking that spot if valid
  }

  // 3. Minimax for strategic depth (limited depth for performance)
  // Reduce depth for expansion phase as it has high branching factor
  const depth = phase === GamePhase.EXPANSION ? 2 : 4; 
  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const { newBoard } = applyMove(board, move, botPlayer, phase);
    // Determine phase for next turn
    const nextPhase = checkPhaseChange(newBoard) ? GamePhase.BATTLE : GamePhase.EXPANSION;
    
    const score = minimax(newBoard, depth, false, botPlayer, nextPhase, move, -Infinity, Infinity);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};
