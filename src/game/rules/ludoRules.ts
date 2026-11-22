import { MoveEvaluation, PlayerColor, PlayerConfig, Token } from '../../types/game';
import {
  COLOR_ORDER,
  HOME_GOAL_STEPS,
  HOME_POCKET_COORDS,
  HOME_STRETCH_COORDS,
  HOME_STRETCH_START,
  MAIN_TRACK_COORDS,
  PLAYER_THEMES,
  SAFE_TRACK_INDICES,
  TRACK_LENGTH,
} from '../constants/boardConstants';

export function createInitialTokens(players: PlayerConfig[]): Token[] {
  const tokens: Token[] = [];
  for (const player of players) {
    if (!player.active) continue;
    for (let i = 0; i < 4; i++) {
      tokens.push({
        id: `${player.color}-${i}`,
        color: player.color,
        index: i,
        steps: -1,
      });
    }
  }
  return tokens;
}

export function getGlobalTrackIndex(color: PlayerColor, steps: number): number | null {
  if (steps < 0 || steps >= HOME_STRETCH_START) return null;
  const startOffset = PLAYER_THEMES[color].startIndex;
  return (startOffset + steps) % TRACK_LENGTH;
}

export function isSafeGlobalIndex(globalIndex: number | null): boolean {
  if (globalIndex === null) return true;
  return SAFE_TRACK_INDICES.has(globalIndex);
}

export function getTokenGridCoords(token: Token): [number, number] {
  const theme = PLAYER_THEMES[token.color];
  if (token.steps === -1) {
    return theme.baseSlots[token.index];
  }
  if (token.steps >= HOME_GOAL_STEPS) {
    const [hx, hy] = HOME_POCKET_COORDS[token.color];
    const jitterX = ((token.index % 2) - 0.5) * 0.28;
    const jitterY = (Math.floor(token.index / 2) - 0.5) * 0.28;
    return [hx + jitterX, hy + jitterY];
  }
  if (token.steps >= HOME_STRETCH_START) {
    const stretchIdx = token.steps - HOME_STRETCH_START;
    return HOME_STRETCH_COORDS[token.color][stretchIdx];
  }
  const globalIdx = getGlobalTrackIndex(token.color, token.steps)!;
  return MAIN_TRACK_COORDS[globalIdx];
}

export function canTokenMove(token: Token, diceValue: number): boolean {
  if (token.steps === -1) {
    return diceValue === 6;
  }
  if (token.steps >= HOME_GOAL_STEPS) {
    return false;
  }
  return token.steps + diceValue <= HOME_GOAL_STEPS;
}

export function getValidMoves(tokens: Token[], activeColor: PlayerColor, diceValue: number): Token[] {
  return tokens.filter((t) => t.color === activeColor && canTokenMove(t, diceValue));
}

export function evaluateMove(token: Token, diceValue: number, allTokens: Token[]): MoveEvaluation {
  const fromSteps = token.steps;
  const toSteps = fromSteps === -1 ? 0 : fromSteps + diceValue;
  const reachesHome = toSteps === HOME_GOAL_STEPS;
  const isDeploy = fromSteps === -1 && toSteps === 0;

  const targetGlobalIdx = getGlobalTrackIndex(token.color, toSteps);
  const landsOnSafe = isSafeGlobalIndex(targetGlobalIdx);

  let captures: Token[] = [];
  if (targetGlobalIdx !== null && !landsOnSafe) {
    captures = allTokens.filter((other) => {
      if (other.color === token.color) return false;
      const otherGlobalIdx = getGlobalTrackIndex(other.color, other.steps);
      return otherGlobalIdx !== null && otherGlobalIdx === targetGlobalIdx;
    });
  }

  return {
    tokenId: token.id,
    fromSteps,
    toSteps,
    captures,
    reachesHome,
    landsOnSafe,
    isDeploy,
  };
}

export function hasPlayerWon(tokens: Token[], color: PlayerColor): boolean {
  const playerTokens = tokens.filter((t) => t.color === color);
  return playerTokens.length === 4 && playerTokens.every((t) => t.steps >= HOME_GOAL_STEPS);
}

export function getNextActivePlayerColor(
  currentColor: PlayerColor,
  players: PlayerConfig[],
  tokens: Token[]
): PlayerColor {
  const startIdx = COLOR_ORDER.indexOf(currentColor);
  for (let offset = 1; offset <= 4; offset++) {
    const candidate = COLOR_ORDER[(startIdx + offset) % 4];
    const cfg = players.find((p) => p.color === candidate);
    if (cfg && cfg.active && !hasPlayerWon(tokens, candidate)) {
      return candidate;
    }
  }
  return currentColor;
}