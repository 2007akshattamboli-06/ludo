export const TRACK_LENGTH = 52;
export const HOME_STRETCH_START = 51;
export const HOME_GOAL_STEPS = 56;
export const COLOR_ORDER = ['red', 'green', 'yellow', 'blue'];

export const START_INDICES = {
  red: 39,
  green: 0,
  yellow: 13,
  blue: 26,
};

export const SAFE_TRACK_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export function createInitialTokens(activeColors) {
  const tokens = [];
  for (const color of activeColors) {
    for (let i = 0; i < 4; i++) {
      tokens.push({
        id: `${color}-${i}`,
        color,
        index: i,
        steps: -1,
      });
    }
  }
  return tokens;
}

export function getGlobalTrackIndex(color, steps) {
  if (steps < 0 || steps >= HOME_STRETCH_START) return null;
  return (START_INDICES[color] + steps) % TRACK_LENGTH;
}

export function isSafeGlobalIndex(globalIndex) {
  if (globalIndex === null) return true;
  return SAFE_TRACK_INDICES.has(globalIndex);
}

export function canTokenMove(token, diceValue) {
  if (token.steps === -1) return diceValue === 6;
  if (token.steps >= HOME_GOAL_STEPS) return false;
  return token.steps + diceValue <= HOME_GOAL_STEPS;
}

export function getValidMoves(tokens, activeColor, diceValue) {
  return tokens.filter((t) => t.color === activeColor && canTokenMove(t, diceValue));
}

export function evaluateMove(token, diceValue, allTokens) {
  const fromSteps = token.steps;
  const toSteps = fromSteps === -1 ? 0 : fromSteps + diceValue;
  const reachesHome = toSteps === HOME_GOAL_STEPS;
  const isDeploy = fromSteps === -1 && toSteps === 0;

  const targetGlobalIdx = getGlobalTrackIndex(token.color, toSteps);
  const landsOnSafe = isSafeGlobalIndex(targetGlobalIdx);

  let captures = [];
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

export function hasPlayerWon(tokens, color) {
  const playerTokens = tokens.filter((t) => t.color === color);
  return playerTokens.length === 4 && playerTokens.every((t) => t.steps >= HOME_GOAL_STEPS);
}

export function getNextActivePlayerColor(currentColor, activeColors, tokens) {
  const startIdx = COLOR_ORDER.indexOf(currentColor);
  for (let offset = 1; offset <= 4; offset++) {
    const candidate = COLOR_ORDER[(startIdx + offset) % 4];
    if (activeColors.includes(candidate) && !hasPlayerWon(tokens, candidate)) {
      return candidate;
    }
  }
  return currentColor;
}