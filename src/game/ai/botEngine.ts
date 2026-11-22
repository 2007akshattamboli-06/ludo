import { AIDifficulty, Token } from '../../types/game';
import { HOME_STRETCH_START } from '../constants/boardConstants';
import { evaluateMove, getGlobalTrackIndex, isSafeGlobalIndex } from '../rules/ludoRules';

export function chooseAIMove(
  validTokens: Token[],
  allTokens: Token[],
  diceValue: number,
  difficulty: AIDifficulty = 'medium'
): Token {
  if (validTokens.length === 1 || difficulty === 'easy') {
    return validTokens[Math.floor(Math.random() * validTokens.length)];
  }

  let bestToken = validTokens[0];
  let bestScore = -Infinity;

  for (const token of validTokens) {
    const evalResult = evaluateMove(token, diceValue, allTokens);
    let score = 0;

    if (evalResult.captures.length > 0) {
      score += 120 * evalResult.captures.length;
    }
    if (evalResult.reachesHome) {
      score += 100;
    }
    if (evalResult.isDeploy) {
      score += 75;
    }
    if (evalResult.fromSteps < HOME_STRETCH_START && evalResult.toSteps >= HOME_STRETCH_START) {
      score += 65;
    }
    if (evalResult.landsOnSafe && evalResult.toSteps < HOME_STRETCH_START) {
      score += 45;
    }
    if (difficulty === 'hard') {
      const currentGlobal = getGlobalTrackIndex(token.color, token.steps);
      if (currentGlobal !== null && !isSafeGlobalIndex(currentGlobal)) {
        score += 20;
      }
    }

    score += evalResult.toSteps * 0.5 + Math.random() * 5;

    if (score > bestScore) {
      bestScore = score;
      bestToken = token;
    }
  }

  return bestToken;
}