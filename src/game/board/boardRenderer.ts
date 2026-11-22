import { Particle, PlayerColor, Token } from '../../types/game';
import {
  GRID_SIZE,
  HOME_STRETCH_COORDS,
  MAIN_TRACK_COORDS,
  PLAYER_THEMES,
  SAFE_TRACK_INDICES,
} from '../constants/boardConstants';
import { getTokenGridCoords } from '../rules/ludoRules';

const PERSPECTIVE_ANGLES: Record<PlayerColor, number> = {
  red: 0,
  green: -Math.PI / 2,
  yellow: Math.PI,
  blue: Math.PI / 2,
};

export function rotateGridCoords(
  [gx, gy]: [number, number],
  perspective: PlayerColor = 'red'
): [number, number] {
  switch (perspective) {
    case 'green':
      return [gy, GRID_SIZE - 1 - gx];
    case 'yellow':
      return [GRID_SIZE - 1 - gx, GRID_SIZE - 1 - gy];
    case 'blue':
      return [GRID_SIZE - 1 - gy, gx];
    default:
      return [gx, gy];
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fill: string
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export function renderStaticBoard(
  ctx: CanvasRenderingContext2D,
  size: number,
  perspective: PlayerColor = 'red'
): void {
  const cell = size / GRID_SIZE;
  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(PERSPECTIVE_ANGLES[perspective]);
  ctx.translate(-size / 2, -size / 2);

  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#FFFDF9');
  bgGrad.addColorStop(1, '#F1ECE1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
  ctx.lineWidth = Math.max(1, size * 0.002);
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      ctx.strokeRect(c * cell, r * cell, cell, cell);
    }
  }

  (Object.keys(HOME_STRETCH_COORDS) as PlayerColor[]).forEach((color) => {
    const theme = PLAYER_THEMES[color];
    HOME_STRETCH_COORDS[color].forEach(([c, r]) => {
      ctx.fillStyle = theme.primary;
      ctx.fillRect(c * cell, r * cell, cell, cell);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.strokeRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2);
    });
  });

  MAIN_TRACK_COORDS.forEach(([c, r], idx) => {
    const startOwner = (Object.keys(PLAYER_THEMES) as PlayerColor[]).find(
      (col) => PLAYER_THEMES[col].startIndex === idx
    );
    if (startOwner) {
      ctx.fillStyle = PLAYER_THEMES[startOwner].primary;
      ctx.fillRect(c * cell, r * cell, cell, cell);
      drawStar(ctx, (c + 0.5) * cell, (r + 0.5) * cell, 5, cell * 0.3, cell * 0.14, 'rgba(255,255,255,0.92)');
    } else if (SAFE_TRACK_INDICES.has(idx)) {
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(c * cell, r * cell, cell, cell);
      drawStar(ctx, (c + 0.5) * cell, (r + 0.5) * cell, 5, cell * 0.3, cell * 0.14, '#64748B');
    }
  });

  const yardOrigins: Record<PlayerColor, [number, number]> = {
    red: [0, 9],
    green: [0, 0],
    yellow: [9, 0],
    blue: [9, 9],
  };

  (Object.keys(yardOrigins) as PlayerColor[]).forEach((color) => {
    const [ox, oy] = yardOrigins[color];
    const theme = PLAYER_THEMES[color];
    const yardSize = cell * 6;
    const x = ox * cell;
    const y = oy * cell;

    const grad = ctx.createLinearGradient(x, y, x + yardSize, y + yardSize);
    grad.addColorStop(0, theme.primary);
    grad.addColorStop(1, theme.dark);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, yardSize, yardSize);

    const pad = cell * 0.85;
    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, yardSize - pad * 2, yardSize - pad * 2, cell * 0.65);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    theme.baseSlots.forEach(([sc, sr]) => {
      const sx = (sc + 0.5) * cell;
      const sy = (sr + 0.5) * cell;
      ctx.beginPath();
      ctx.arc(sx, sy, cell * 0.44, 0, Math.PI * 2);
      ctx.fillStyle = theme.light;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = theme.primary;
      ctx.stroke();
    });
  });

  const cx = 7.5 * cell;
  const cy = 7.5 * cell;
  const left = 6 * cell;
  const right = 9 * cell;
  const top = 6 * cell;
  const bottom = 9 * cell;

  const triangles: { color: PlayerColor; pts: [number, number][] }[] = [
    { color: 'red', pts: [[left, bottom], [right, bottom], [cx, cy]] },
    { color: 'green', pts: [[left, top], [cx, cy], [left, bottom]] },
    { color: 'yellow', pts: [[left, top], [right, top], [cx, cy]] },
    { color: 'blue', pts: [[right, top], [right, bottom], [cx, cy]] },
  ];

  triangles.forEach(({ color, pts }) => {
    const theme = PLAYER_THEMES[color];
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = theme.primary;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, cell * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = '#0F172A';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FBBF24';
  ctx.stroke();
  drawStar(ctx, cx, cy, 5, cell * 0.25, cell * 0.11, '#FBBF24');

  ctx.restore();
}

export function renderDynamicLayer(
  ctx: CanvasRenderingContext2D,
  size: number,
  tokens: Token[],
  validTokenIds: Set<string>,
  animatedCoords: Map<string, [number, number]>,
  particles: Particle[],
  timeMs: number,
  perspective: PlayerColor = 'red'
): void {
  const cell = size / GRID_SIZE;
  ctx.clearRect(0, 0, size, size);

  const cellGroups = new Map<string, Token[]>();
  tokens.forEach((t) => {
    const rawCoords = animatedCoords.get(t.id) ?? getTokenGridCoords(t);
    const [gx, gy] = rotateGridCoords(rawCoords, perspective);
    const key = `${gx.toFixed(1)},${gy.toFixed(1)}`;
    const list = cellGroups.get(key) ?? [];
    list.push(t);
    cellGroups.set(key, list);
  });

  tokens.forEach((token) => {
    const rawCoords = animatedCoords.get(token.id) ?? getTokenGridCoords(token);
    const [gx, gy] = rotateGridCoords(rawCoords, perspective);
    const key = `${gx.toFixed(1)},${gy.toFixed(1)}`;
    const siblings = cellGroups.get(key) ?? [token];
    const stackIdx = siblings.findIndex((s) => s.id === token.id);
    const count = siblings.length;

    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;

    if (count > 1 && token.steps >= 0 && token.steps < 56) {
      const angle = (stackIdx / count) * Math.PI * 2;
      offsetX = Math.cos(angle) * cell * 0.17;
      offsetY = Math.sin(angle) * cell * 0.17;
      scale = 0.82;
    }

    const px = (gx + 0.5) * cell + offsetX;
    const py = (gy + 0.5) * cell + offsetY;
    const radius = cell * 0.36 * scale;
    const theme = PLAYER_THEMES[token.color];
    const isSelectable = validTokenIds.has(token.id);

    if (isSelectable) {
      const pulse = 1 + Math.sin(timeMs * 0.008) * 0.18;
      ctx.beginPath();
      ctx.arc(px, py, radius * 1.38 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, radius * 1.24 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.ellipse(px, py + radius * 0.35, radius * 0.95, radius * 0.65, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
    ctx.fill();

    const lift = isSelectable ? Math.abs(Math.sin(timeMs * 0.007)) * (cell * 0.09) : 0;
    const bodyY = py - lift;

    const sphereGrad = ctx.createRadialGradient(
      px - radius * 0.32,
      bodyY - radius * 0.35,
      radius * 0.1,
      px,
      bodyY,
      radius
    );
    sphereGrad.addColorStop(0, '#FFFFFF');
    sphereGrad.addColorStop(0.28, theme.light);
    sphereGrad.addColorStop(0.65, theme.primary);
    sphereGrad.addColorStop(1, theme.dark);

    ctx.beginPath();
    ctx.arc(px, bodyY, radius, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, bodyY, radius * 0.52, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  });
}