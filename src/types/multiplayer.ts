import { AvatarId } from './auth';
import { PlayerColor, Token, TurnPhase } from './game';

export type LobbyMode = 'online-quick' | 'online-private' | 'vs-ai' | 'local';

export interface OnlinePlayer {
  uid: string;
  username: string;
  avatar: AvatarId;
  color: PlayerColor;
  connected: boolean;
}

export interface OnlineRoomState {
  code: string;
  isPrivate: boolean;
  maxPlayers: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  hostUid: string;
  players: OnlinePlayer[];
  tokens: Token[];
  turnColor: PlayerColor;
  phase: TurnPhase;
  diceValue: number;
  validTokenIds: string[];
  winner: PlayerColor | null;
  turnDeadline: number | null;
}

export interface DiceRolledPayload {
  color: PlayerColor;
  value: number;
  tripleSix: boolean;
  validTokenIds: string[];
}

export interface TokenMovedPayload {
  tokenId: string;
  color: PlayerColor;
  fromSteps: number;
  toSteps: number;
  capturedIds: string[];
  reachesHome: boolean;
  room: OnlineRoomState;
}

export interface PlayerReactionPayload {
  id: string;
  color: PlayerColor;
  username: string;
  emoji: string;
  text: string;
}