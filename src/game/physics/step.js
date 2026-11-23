import { beamEndpoints } from '../obstacles/beam.js';
import { rectangleCenterAt } from '../obstacles/rectangle.js';
import { BALL_RADIUS, GAME_HEIGHT, GAME_WIDTH, GRAVITY } from './constants.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Un tick deterministico della fisica custom. Non usare Arcade Physics qui:
 * il tiro e la previsione condividono questo solver per restare coerenti.
 */
export function stepBall(ball, obstacles, tick) {
  const events = [];
  const radius = ball.r ?? BALL_RADIUS;
  if (!ball.ng) ball.vy += GRAVITY;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x < radius || ball.x > GAME_WIDTH - radius) {
    ball.x = clamp(ball.x, radius, GAME_WIDTH - radius);
    ball.vx *= -0.7;
  }
  if (ball.y > GAME_HEIGHT - radius) {
    ball.y = GAME_HEIGHT - radius;
    ball.vy = -ball.vy * 0.55;
    ball.vx *= 0.97;
  }

  for (const obstacle of obstacles) {
    if (obstacle.dr != null && obstacle.disabled) continue;
    const wave = Math.sin(obstacle.sp * tick);

    if (obstacle.mg) {
      const dx = obstacle.x + obstacle.mx * wave - ball.x;
      const dy = obstacle.y + obstacle.my * wave - ball.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 1 && distance < obstacle.mr) {
        const force = obstacle.mg * (1 - distance / obstacle.mr);
        ball.vx += (dx / distance) * force;
        ball.vy += (dy / distance) * force;
      }
    }

    if (obstacle.pt) {
      if (!ball.portalCooldown && Math.hypot(ball.x - obstacle.x, ball.y - obstacle.y) < 14) {
        const exit = obstacle.to;
        const speed = Math.max(7, Math.hypot(ball.vx, ball.vy));
        ball.x = exit.x + Math.cos(exit.a) * 22;
        ball.y = exit.y + Math.sin(exit.a) * 22;
        ball.vx = Math.cos(exit.a) * speed;
        ball.vy = Math.sin(exit.a) * speed;
        ball.portalCooldown = 14;
      }
      continue;
    }

    if (obstacle.stn || obstacle.r && !obstacle.len && !obstacle.w) {
      const dx = ball.x - obstacle.x;
      const dy = ball.y - obstacle.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      const minDistance = radius + obstacle.r;
      if (distance < minDistance) {
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        ball.x += nx * overlap;
        ball.y += ny * overlap;
        const velocity = ball.vx * nx + ball.vy * ny;
        if (velocity < 0) {
          const bounce = obstacle.bo ? 2.25 : 1.6;
          ball.vx -= bounce * velocity * nx;
          ball.vy -= bounce * velocity * ny;
          if (obstacle.bo) events.push({ type: 'booster-hit', x: ball.x, y: ball.y, obstacle });
        }
        if (obstacle.hz) ball.dead = true;
        events.push({ type: 'obstacle-hit', x: ball.x, y: ball.y, obstacle });
      }
      continue;
    }

    if (obstacle.w) {
      const { x: centerX, y: centerY } = rectangleCenterAt(obstacle, tick);
      const nearestX = clamp(ball.x, centerX - obstacle.w / 2, centerX + obstacle.w / 2);
      const nearestY = clamp(ball.y, centerY - obstacle.h / 2, centerY + obstacle.h / 2);
      const dx = ball.x - nearestX;
      const dy = ball.y - nearestY;
      const distance = Math.hypot(dx, dy);
      if (distance < radius) {
        const nx = distance > 0.001 ? dx / distance : 0;
        const ny = distance > 0.001 ? dy / distance : -1;
        ball.x += nx * (radius - distance);
        ball.y += ny * (radius - distance);
        const velocity = ball.vx * nx + ball.vy * ny;
        if (velocity < 0) {
          const bounce = obstacle.bo ? 2.25 : 1.6;
          ball.vx -= bounce * velocity * nx;
          ball.vy -= bounce * velocity * ny;
          if (obstacle.bo) events.push({ type: 'booster-hit', x: ball.x, y: ball.y, obstacle });
        }
        if (obstacle.hz) ball.dead = true;
        if (obstacle.sw != null) ball.switchId = obstacle.sw;
        events.push({ type: 'obstacle-hit', x: ball.x, y: ball.y, obstacle });
      }
      continue;
    }

    // Segment capsule: proietta il centro della palla sul segmento e risolve l'urto.
    if (obstacle.len) {
      const [x1, y1, x2, y2] = beamEndpoints(obstacle, tick);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lengthSquared = dx * dx + dy * dy || 1;
      const projection = clamp(((ball.x - x1) * dx + (ball.y - y1) * dy) / lengthSquared, 0, 1);
      const nearestX = x1 + dx * projection;
      const nearestY = y1 + dy * projection;
      const offsetX = ball.x - nearestX;
      const offsetY = ball.y - nearestY;
      const distance = Math.hypot(offsetX, offsetY) || 0.001;
      const minDistance = radius + (obstacle.r || 7);
      if (distance < minDistance) {
        const nx = offsetX / distance;
        const ny = offsetY / distance;
        ball.x += nx * (minDistance - distance);
        ball.y += ny * (minDistance - distance);
        const velocity = ball.vx * nx + ball.vy * ny;
        if (velocity < 0) {
          const bounce = obstacle.bo ? 2.25 : 1.6;
          ball.vx -= bounce * velocity * nx;
          ball.vy -= bounce * velocity * ny;
          if (obstacle.bo) events.push({ type: 'booster-hit', x: ball.x, y: ball.y, obstacle });
        }
        if (obstacle.hz) ball.dead = true;
        if (obstacle.sw != null) ball.switchId = obstacle.sw;
        events.push({ type: 'obstacle-hit', x: ball.x, y: ball.y, obstacle });
      }
    }
  }
  if (ball.portalCooldown > 0) ball.portalCooldown -= 1;
  return events;
}

export function isBasketScored(ball, basket, previousY = ball.y) {
  const enteredFromAbove = ball.vy > 0 && previousY <= basket.y + 6 && ball.y > basket.y + 6;
  return enteredFromAbove &&
    ball.x > basket.x - basket.width + 5 &&
    ball.x < basket.x + basket.width - 5 &&
    ball.y < basket.y + 34;
}
