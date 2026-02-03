export enum SymbolType {
  EMPTY = 'EMPTY',
  V = 'V',      // | (Player 1)
  H = 'H',      // — (Player 2)
  PLUS = 'PLUS',// +
  SLASH = 'SLASH' // /
}

export enum Player {
  P1 = 'P1', // Vertical
  P2 = 'P2'  // Horizontal
}

export enum GamePhase {
  EXPANSION = 'EXPANSION',
  BATTLE = 'BATTLE'
}

export enum Lang {
  RU = 'RU',
  EN = 'EN',
  UZ = 'UZ'
}

export interface GameState {
  board: SymbolType[];
  currentPlayer: Player;
  phase: GamePhase;
  lastMoveIndex: number | null; // For Ko Rule and Highlighting
  winner: Player | null;
  isDraw: boolean;
  history: HistoryState[]; // For undo/redo/review
  currentHistoryStep: number;
}

export interface HistoryState {
  board: SymbolType[];
  currentPlayer: Player;
  phase: GamePhase;
  lastMoveIndex: number | null;
}

export type GameMode = 'MENU' | 'PVP' | 'PVE';
