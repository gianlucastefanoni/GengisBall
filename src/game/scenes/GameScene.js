import Phaser from 'phaser';
import { BALL_SKINS, getTrailColor } from '../balls/skins.js';
import { drawBall } from '../balls/drawBall.js';
import { LEVELS } from '../data/levels.js';
import { beam, beamEndpoints } from '../obstacles/beam.js';
import { rectangleCenterAt } from '../obstacles/rectangle.js';
import { WORLDS } from '../data/worlds.js';
import { BALL_RADIUS, FIXED_STEP_MS, GAME_HEIGHT, GAME_WIDTH, SHOT_POWER } from '../physics/constants.js';
import { isBasketScored, stepBall } from '../physics/step.js';

/** Scena di gioco: possiede input, stato della partita, simulazione e disegno. */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.bridge = null;
    this.accumulator = 0;
    this.tick = 0;
    this.shots = 0;
    this.drag = null;
    this.ended = false;
    this.flightTicks = 0;
    this.completed = 0;
    this.lives = 3;
    this.levelOrder = [];
    this.deadline = 0;
    this.lastHudSecond = -1;
    this.trail = [];
    this.impactRings = [];
    this.impactParticles = [];
  }

  setBridge(bridge) {
    this.bridge = bridge;
  }

  create() {
    this.graphics = this.add.graphics();
    this.createSkinTextures();
    this.createWorldBackgroundTextures();
    this.backgroundSprite = this.add.image(0, 0, 'world-background-0').setOrigin(0).setDepth(-10);
    this.ballSprite = this.add.image(0, 0, 'ball-skin-0').setDepth(10);
    this.input.on('pointerdown', (pointer) => {
      if (!this.ball || this.ended || this.ball.state !== 'ready') return;
      // L'origine del gesto è il punto di pressione, non la pallina: si può mirare ovunque sul campo.
      this.drag = { startX: pointer.x, startY: pointer.y, x: pointer.x, y: pointer.y };
    });
    this.input.on('pointermove', (pointer) => {
      if (this.drag) {
        this.drag.x = pointer.x;
        this.drag.y = pointer.y;
      }
    });
    this.input.on('pointerup', () => this.releaseShot());
    this.input.on('pointerupoutside', () => this.releaseShot());
    this.scale.on('resize', () => this.cameras.main.setViewport(0, 0, GAME_WIDTH, GAME_HEIGHT));
  }

  startLevel(levelIndex, skinId = 0, mode = 'campaign') {
    this.mode = mode;
    this.skin = BALL_SKINS[skinId] || BALL_SKINS[0];
    this.completed = 0;
    this.lives = 3;
    this.levelOrder = [];
    this.deadline = mode === 'timed' ? Date.now() + 5 * 60 * 1000 : 0;
    this.lastHudSecond = -1;
    if (mode === 'timed') {
      this.nextTimedLevel();
      return;
    }
    this.loadLevel(levelIndex);
  }

  loadLevel(levelIndex) {
    this.levelIndex = Phaser.Math.Clamp(levelIndex, 0, LEVELS.length - 1);
    this.level = structuredClone(LEVELS[this.levelIndex]);
    this.backgroundSprite?.setTexture(`world-background-${this.level.worldIndex}`);
    this.basketColliders = this.createBasketColliders(this.level.basket);
    this.collisionObstacles = [...this.level.obstacles, ...this.basketColliders];
    this.trail = [];
    this.impactRings = [];
    this.impactParticles = [];
    this.shots = 0;
    this.tick = 0;
    this.accumulator = 0;
    this.ended = false;
    this.drag = null;
    this.resetBall();
    this.updateHud();
  }

  createSkinTextures() {
    for (const skin of BALL_SKINS) {
      const key = `ball-skin-${skin.id}`;
      if (this.textures.exists(key)) continue;
      const texture = this.textures.createCanvas(key, 64, 64);
      drawBall(texture.getContext(), 32, 32, 28, 0.4, skin.id);
      texture.refresh();
    }
  }

  createWorldBackgroundTextures() {
    for (const [index, world] of WORLDS.entries()) {
      const key = `world-background-${index}`;
      if (this.textures.exists(key)) continue;
      const texture = this.textures.createCanvas(key, GAME_WIDTH, GAME_HEIGHT);
      const context = texture.getContext();
      const gradient = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, world.sky[0]);
      gradient.addColorStop(1, world.sky[1]);
      context.fillStyle = gradient;
      context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      texture.refresh();
    }
  }

  updateHud(secondsLeft = null) {
    this.bridge?.onHud?.({
      level: this.levelIndex + 1,
      shots: this.shots,
      mode: this.mode,
      lives: this.lives,
      completed: this.completed,
      secondsLeft: secondsLeft ?? (this.mode === 'timed' ? Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000)) : 0),
    });
  }

  resetBall() {
    this.ball = { x: this.level.start.x, y: this.level.start.y, vx: 0, vy: 0, r: BALL_RADIUS, state: 'ready' };
    this.ended = false;
  }

  /**
   * Replica il canestro del gioco originale: due montanti e una base del cono-rete.
   * Sono ostacoli del solver, quindi il ferro/rete respinge la palla anche dal basso.
   */
  createBasketColliders(basket) {
    const { x, y, width } = basket;
    return [
      beam(x - width, y + 18, 36, 90, { r: 3 }),
      beam(x + width, y + 18, 36, 90, { r: 3 }),
      beam(x, y + 40, width * 2, 0, { r: 3 }),
    ];
  }

  retry() {
    if (!this.level) return;
    if (this.mode === 'timed') {
      this.nextTimedLevel();
    } else if (this.mode === 'survival') {
      this.resolveAttempt(false);
    } else {
      this.loadLevel(this.levelIndex);
    }
  }

  releaseShot() {
    if (!this.drag || !this.ball || this.ball.state !== 'ready') {
      this.drag = null;
      return;
    }
    const dx = this.drag.startX - this.drag.x;
    const dy = this.drag.startY - this.drag.y;
    const distance = Math.hypot(dx, dy);
    const scale = distance > 90 ? 90 / distance : 1;
    if (distance > 14) {
      this.ball.vx = dx * scale * SHOT_POWER;
      this.ball.vy = dy * scale * SHOT_POWER;
      this.ball.state = 'flying';
      this.flightTicks = 0;
      this.shots += 1;
      this.updateHud();
    }
    this.drag = null;
  }

  update(_time, delta) {
    if (!this.level || !this.ball) return;
    if (this.ended) {
      this.drawGame();
      return;
    }
    if (this.mode === 'timed' && !this.ended) {
      const secondsLeft = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000));
      if (secondsLeft !== this.lastHudSecond) {
        this.lastHudSecond = secondsLeft;
        this.updateHud(secondsLeft);
      }
      if (secondsLeft === 0) {
        this.endSession('timed');
        return;
      }
    }
    this.accumulator += Math.min(delta, 100);
    while (this.accumulator >= FIXED_STEP_MS) {
      this.accumulator -= FIXED_STEP_MS;
      this.tick += 1;
      this.advanceEffects();
      this.advanceStones();
      if (this.ball.state === 'flying') {
        this.flightTicks += 1;
        const previousY = this.ball.y;
        const events = stepBall(this.ball, this.collisionObstacles, this.tick);
        for (const event of events) {
          if (event.type === 'booster-hit') this.triggerBoosterEffect(event);
          if (event.type === 'obstacle-hit' && this.level.dark) this.revealDarkObstacle(event);
        }
        if (this.ball.dead) {
          this.triggerDeathEffect(this.ball.x, this.ball.y);
          return this.resolveAttempt(false);
        }
        if (isBasketScored(this.ball, this.level.basket, previousY)) return this.resolveAttempt(true);
        if (this.ball.y > GAME_HEIGHT - this.ball.r - 1 && Math.hypot(this.ball.vx, this.ball.vy) < 0.9) {
          this.ball.state = 'ready';
          this.ball.x = this.level.start.x;
          this.ball.y = this.level.start.y;
          this.ball.vx = 0;
          this.ball.vy = 0;
        }
        if (this.ball.state === 'flying') this.addTrailSample();
        if (this.ball.y > GAME_HEIGHT + 45 || this.flightTicks > 600) return this.resolveAttempt(false);
      }
    }
    this.drawGame();
  }

  finish(won) {
    if (this.ended) return;
    this.ended = true;
    this.ball.state = 'ready';
    const stars = won ? (this.shots <= this.level.par ? 3 : this.shots <= this.level.par + 1 ? 2 : 1) : 0;
    this.bridge?.onOutcome?.({ won, stars, shots: this.shots, levelIndex: this.levelIndex, mode: this.mode });
  }

  resolveAttempt(won) {
    if (this.mode === 'campaign') {
      if (won) {
        this.finish(true);
      } else {
        // Un errore in campagna rimette la pallina alla partenza senza azzerare i tiri.
        this.resetBall();
        this.updateHud();
      }
      return;
    }

    if (this.mode === 'timed') {
      if (won) {
        this.completed += 1;
        this.nextTimedLevel();
      } else {
        this.resetBall();
        this.updateHud();
      }
      return;
    }

    if (won) {
      if (this.levelIndex >= LEVELS.length - 1) {
        this.endSession('survival', true);
      } else {
        this.loadLevel(this.levelIndex + 1);
      }
      return;
    }

    this.lives -= 1;
    if (this.lives <= 0) {
      this.endSession('survival');
    } else {
      this.resetBall();
      this.updateHud();
    }
  }

  nextTimedLevel() {
    if (this.deadline && Date.now() >= this.deadline) {
      this.endSession('timed');
      return;
    }
    if (this.levelOrder.length === 0) {
      this.levelOrder = LEVELS.map((_, index) => index);
      for (let index = this.levelOrder.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [this.levelOrder[index], this.levelOrder[swapIndex]] = [this.levelOrder[swapIndex], this.levelOrder[index]];
      }
    }
    this.loadLevel(this.levelOrder.pop());
  }

  endSession(mode, won = false) {
    if (this.ended) return;
    this.ended = true;
    this.bridge?.onOutcome?.({
      sessionOver: true,
      won,
      mode,
      completed: this.completed,
      reachedLevel: won ? LEVELS.length : this.levelIndex + 1,
    });
  }

  advanceEffects() {
    for (const obstacle of this.level.obstacles) {
      if (obstacle.flash > 0) obstacle.flash -= 1;
      if (obstacle.rv > 0) obstacle.rv -= 1;
    }
    for (const point of this.trail) point.life -= 1;
    this.trail = this.trail.filter((point) => point.life > 0);
    for (const ring of this.impactRings) ring.life -= 1;
    this.impactRings = this.impactRings.filter((ring) => ring.life > 0);
    for (const particle of this.impactParticles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.15;
      particle.life -= 1;
    }
    this.impactParticles = this.impactParticles.filter((particle) => particle.life > 0);
    if (this.ball.boost > 0) this.ball.boost -= 1;
  }

  advanceStones() {
    const stones = this.level.obstacles.filter((obstacle) => obstacle.stn);
    for (const stone of stones) {
      const colliders = this.collisionObstacles.filter((obstacle) => obstacle !== stone);
      stepBall(stone, colliders, this.tick);
      stone.vx *= 0.994;
      stone.vy *= 0.994;
      if (Math.hypot(stone.vx, stone.vy) < 0.12) {
        stone.vx = 0;
        stone.vy = 0;
      }
    }
  }

  addTrailSample() {
    const boosted = this.ball.boost > 0;
    const maxLife = boosted ? 26 : 16;
    this.trail.push({
      x: this.ball.x,
      y: this.ball.y,
      life: maxLife,
      maxLife,
      color: getTrailColor(this.skin.id, this.tick, { boosted, dark: this.level.dark }),
    });
  }

  triggerBoosterEffect({ x, y, obstacle }) {
    obstacle.flash = 14;
    this.ball.boost = 24;
    this.impactRings.push({ x, y, life: 16, maxLife: 16, color: '#7dffa0' });
    for (let index = 0; index < 12; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.impactParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 22,
        maxLife: 22,
        color: '#b6ffc8',
      });
    }
  }

  triggerDeathEffect(x, y) {
    this.impactRings.push({ x, y, life: 16, maxLife: 16, color: '#ff4d4d' });
    for (let index = 0; index < 26; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.impactParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 22,
        maxLife: 22,
        color: '#ff4d4d',
      });
    }
  }

  drawGame() {
    const g = this.graphics;
    const world = WORLDS[this.level.worldIndex];
    g.clear();

    for (const obstacle of this.level.obstacles) this.drawObstacle(g, obstacle, world);
    this.drawZones(g);
    this.drawBasket(g, world);
    this.drawEffects(g);
    if (this.drag && this.ball.state === 'ready') this.drawAim(g);
    this.ballSprite.setTexture(`ball-skin-${this.skin.id}`);
    this.ballSprite.setPosition(this.ball.x, this.ball.y);
    this.ballSprite.setDisplaySize(this.ball.r * 2, this.ball.r * 2);
    this.ballSprite.setRotation(this.ball.x * 0.05);
  }

  drawObstacle(g, obstacle, world) {
    if (this.level.dark && !(obstacle.rv > 0)) return;
    const swatches = [
      ['#fff3a0', '#ffc400', '#8a5a00'],
      ['#ffc2e0', '#ff4fa3', '#7a0f45'],
    ];
    const colors = this.level.dark
      ? obstacle.hz ? ['#ffb3b3', '#ff3b3b', '#7a0f0f'] : ['#d6fbff', '#19c7ff', '#0a4d73']
      : obstacle.hz ? ['#ff8a8a', '#d6213a', '#5a0b16']
        : obstacle.mr ? ['#e8c4ff', '#8e5fd0', '#3b2166']
          : obstacle.sw != null || obstacle.dr != null ? swatches[obstacle.sw ?? obstacle.dr] ?? swatches[0]
            : obstacle.bo ? ['#c4ffd0', '#35b86a', '#14562a']
              : [world.top, world.body, world.edge];
    const color = (value) => Number.parseInt(value.slice(1), 16);

    if (obstacle.pt) {
      const pulse = 1 + 0.12 * Math.sin(this.tick * 0.12);
      const portalColor = color(obstacle.c);
      g.fillStyle(portalColor, 0.25);
      g.fillEllipse(obstacle.x, obstacle.y, 24 * pulse, 52 * pulse);
      g.lineStyle(5, portalColor, 1);
      g.strokeEllipse(obstacle.x, obstacle.y, 14, 44);
      g.lineStyle(1.5, 0xffffff, 1);
      g.strokeEllipse(obstacle.x, obstacle.y, 8, 34);
      return;
    }

    if (obstacle.stn) {
      const radius = obstacle.r;
      if (Math.hypot(obstacle.vx, obstacle.vy) > 0.6) {
        for (let index = 1; index <= 4; index += 1) {
          g.fillStyle(0xbfe9ff, (0.16 * (5 - index)) / 4);
          g.fillRoundedRect(
            obstacle.x - obstacle.vx * index * 1.6 - radius,
            obstacle.y - obstacle.vy * index * 1.6 - radius,
            radius * 2,
            radius * 2,
            radius * 0.45,
          );
        }
      }
      g.fillGradientStyle(0xf2fcff, 0xf2fcff, 0x5aaee6, 0x5aaee6, 1, 1, 1, 1);
      g.fillRoundedRect(obstacle.x - radius, obstacle.y - radius, radius * 2, radius * 2, radius * 0.45);
      g.lineStyle(2.5, 0x2f6fa3, 1);
      g.strokeRoundedRect(obstacle.x - radius, obstacle.y - radius, radius * 2, radius * 2, radius * 0.45);
      g.lineStyle(2, 0xffffff, 0.85);
      g.lineBetween(obstacle.x - radius * 0.65, obstacle.y - radius * 0.1, obstacle.x - radius * 0.1, obstacle.y - radius * 0.65);
      g.lineBetween(obstacle.x - radius * 0.65, obstacle.y + radius * 0.3, obstacle.x + radius * 0.3, obstacle.y - radius * 0.65);
      return;
    }

    if (obstacle.w) {
      const { x, y } = rectangleCenterAt(obstacle, this.tick);
      g.fillGradientStyle(color(colors[1]), color(colors[1]), color(colors[2]), color(colors[2]), 1, 1, 1, 1);
      g.fillRoundedRect(x - obstacle.w / 2, y - obstacle.h / 2, obstacle.w, obstacle.h, 6);
      g.lineStyle(2.5, color(colors[2]), 1);
      g.strokeRoundedRect(x - obstacle.w / 2, y - obstacle.h / 2, obstacle.w, obstacle.h, 6);
      g.fillStyle(color(colors[0]), 0.9);
      g.fillRoundedRect(x - obstacle.w / 2 + 1, y - obstacle.h / 2 + 1, obstacle.w - 2, Math.min(8, obstacle.h / 3), 5);
      g.lineStyle(1.5, 0x000000, 0.18);
      g.lineBetween(x, y - obstacle.h / 2 + 10, x, y + obstacle.h / 2 - 3);
    } else if (!obstacle.len) {
      const wave = Math.sin(obstacle.sp * this.tick);
      const x = obstacle.x + obstacle.mx * wave;
      const y = obstacle.y + obstacle.my * wave;
      if (obstacle.mr) this.drawMagneticHalo(g, obstacle, x, y);
      if (obstacle.hz) {
        g.fillStyle(color(colors[2]), 1);
        for (let index = 0; index < 10; index += 1) {
          const angle = index * Math.PI * 0.2 + this.tick * 0.02;
          g.fillTriangle(
            x + Math.cos(angle) * (obstacle.r + 6), y + Math.sin(angle) * (obstacle.r + 6),
            x + Math.cos(angle - 0.22) * (obstacle.r - 2), y + Math.sin(angle - 0.22) * (obstacle.r - 2),
            x + Math.cos(angle + 0.22) * (obstacle.r - 2), y + Math.sin(angle + 0.22) * (obstacle.r - 2),
          );
        }
      }
      g.fillStyle(color(colors[1]), 1);
      g.fillCircle(x, y, obstacle.r);
      g.fillStyle(0xffffff, 0.55);
      g.fillCircle(x - obstacle.r * 0.25, y - obstacle.r * 0.3, obstacle.r * 0.63);
      g.lineStyle(2.5, color(colors[2]), 1);
      g.strokeCircle(x, y, obstacle.r);
    } else {
      const [x1, y1, x2, y2] = beamEndpoints(obstacle, this.tick);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.hypot(dx, dy) || 1;
      const offsetX = (dy / length) * ((obstacle.r || 7) * 0.5);
      const offsetY = -(dx / length) * ((obstacle.r || 7) * 0.5);
      g.lineStyle((obstacle.r || 7) * 2 + 5, color(colors[2]), 1);
      g.lineBetween(x1, y1, x2, y2);
      g.lineStyle((obstacle.r || 7) * 2, color(colors[1]), 1);
      g.lineBetween(x1, y1, x2, y2);
      g.lineStyle(3, color(colors[0]), 1);
      g.lineBetween(x1 + offsetX, y1 + offsetY, x2 + offsetX, y2 + offsetY);
      if (obstacle.hz || obstacle.bo) {
        const markColor = obstacle.hz ? 0xffe14d : 0xffffff;
        const markWidth = obstacle.hz ? (obstacle.r || 7) * 1.2 : 2;
        const dashLength = obstacle.hz ? 8 : 5;
        const gapLength = obstacle.hz ? 8 : 7;
        g.lineStyle(markWidth, markColor, obstacle.hz ? 1 : 0.8);
        for (let position = 0; position < length; position += dashLength + gapLength) {
          const end = Math.min(position + dashLength, length);
          g.lineBetween(
            x1 + (dx / length) * position, y1 + (dy / length) * position,
            x1 + (dx / length) * end, y1 + (dy / length) * end,
          );
        }
      }
      if (obstacle.rot) {
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        g.fillStyle(0xf08a1c, 1);
        g.fillCircle(centerX, centerY, 6);
        g.lineStyle(2, color(world.edge), 1);
        g.strokeCircle(centerX, centerY, 6);
      }
    }
    if (obstacle.bo && obstacle.flash > 0) this.drawBoosterGlow(g, obstacle);
  }

  drawMagneticHalo(g, obstacle, x, y) {
    const color = obstacle.mg > 0 ? 0xbe82ff : 0xff8c5a;
    const direction = obstacle.mg > 0 ? -1 : 1;
    for (let ring = 0; ring < 3; ring += 1) {
      const phase = ((this.tick * 0.012 * direction + ring / 3) % 1 + 1) % 1;
      const radius = obstacle.r + (obstacle.mr - obstacle.r) * phase;
      const alpha = 0.6 * (1 - phase);
      g.lineStyle(1.5, color, alpha);
      for (let segment = 0; segment < 24; segment += 2) {
        const start = (segment * Math.PI * 2) / 24;
        const end = ((segment + 1) * Math.PI * 2) / 24;
        g.lineBetween(x + Math.cos(start) * radius, y + Math.sin(start) * radius, x + Math.cos(end) * radius, y + Math.sin(end) * radius);
      }
    }
  }

  revealDarkObstacle({ x, y, obstacle }) {
    if (!(obstacle.rv > 35)) {
      this.impactRings.push({
        x, y,
        life: 16,
        maxLife: 16,
        color: obstacle.hz ? '#ff5a5a' : '#7df9ff',
        radius: 95,
      });
    }
    obstacle.rv = 60;
  }

  drawZones(g) {
    for (const zone of this.level.zones || []) {
      const x = zone.x - zone.w / 2;
      const y = zone.y - zone.h / 2;
      g.fillStyle(0x3cdcc8, 0.18 + 0.08 * Math.sin(this.tick * 0.1));
      g.fillRect(x, y, zone.w, zone.h);
      g.lineStyle(2, 0x19d3c0, 0.95);
      g.strokeRect(x, y, zone.w, zone.h);
      g.fillStyle(0x0b7d70, 0.9);
      for (let index = 0; index < Math.floor(zone.h / 26); index += 1) {
        const arrowY = y + 13 + index * 26;
        g.fillTriangle(x + 3, arrowY - 5, x + 3, arrowY + 5, x + 10, arrowY);
        g.fillTriangle(x + zone.w - 3, arrowY - 5, x + zone.w - 3, arrowY + 5, x + zone.w - 10, arrowY);
      }
    }
  }

  drawBoosterGlow(g, obstacle) {
    const alpha = obstacle.flash / 14;
    g.lineStyle((obstacle.r || 7) * 2 + 10, 0xb6ffc8, alpha);
    if (obstacle.w) {
      const { x, y } = rectangleCenterAt(obstacle, this.tick);
      g.strokeRect(x - obstacle.w / 2, y - obstacle.h / 2, obstacle.w, obstacle.h);
    } else if (obstacle.len) {
      const [x1, y1, x2, y2] = beamEndpoints(obstacle, this.tick);
      g.lineBetween(x1, y1, x2, y2);
    } else {
      g.strokeCircle(obstacle.x, obstacle.y, obstacle.r + 5);
    }
  }

  drawEffects(g) {
    for (const point of this.trail) {
      const alpha = (0.55 * point.life) / point.maxLife;
      const radius = (BALL_RADIUS * 0.8 * point.life) / point.maxLife + 1;
      g.fillStyle(parseInt(point.color.slice(1), 16), alpha);
      g.fillCircle(point.x, point.y, radius);
    }
    for (const ring of this.impactRings) {
      const progress = 1 - ring.life / ring.maxLife;
      g.lineStyle(4, parseInt(ring.color.slice(1), 16), 1 - progress);
      g.strokeCircle(ring.x, ring.y, 10 + progress * (ring.radius ?? 38));
    }
    for (const particle of this.impactParticles) {
      g.fillStyle(parseInt(particle.color.slice(1), 16), particle.life / particle.maxLife);
      g.fillCircle(particle.x, particle.y, 3);
    }
    if (this.ball.boost > 0) {
      g.fillStyle(0x8dff9a, 0.5);
      g.fillCircle(this.ball.x, this.ball.y, BALL_RADIUS + 6);
    }
  }

  drawBasket(g, world) {
    const { x, y, width } = this.level.basket;
    const edge = parseInt(world.edge.slice(1), 16);
    const halfBottom = width * 0.74;

    // Rete a tronco di cono, stretta verso il basso, disegnata dietro al ferro.
    g.fillStyle(0xffffff, 0.28);
    g.fillTriangle(x - width, y, x + width, y, x + halfBottom, y + 42);
    g.fillTriangle(x - width, y, x - halfBottom, y + 42, x + halfBottom, y + 42);
    g.lineStyle(1.3, this.level.dark ? 0xffe9a8 : edge, 0.62);
    for (let index = 0; index <= 6; index += 1) {
      const ratio = index / 6;
      const topX = x - width + width * 2 * ratio;
      const bottomX = x - halfBottom + halfBottom * 2 * ratio;
      g.lineBetween(topX, y, bottomX, y + 42);
    }
    for (let row = 1; row < 4; row += 1) {
      const ratio = row / 4;
      const rowY = y + 42 * ratio;
      const rowHalfWidth = width - (width - halfBottom) * ratio;
      g.lineBetween(x - rowHalfWidth, rowY, x + rowHalfWidth, rowY);
    }

    // Cerchio rosso del ferro e due piccoli supporti laterali.
    g.lineStyle(5, 0xd63a22, 1);
    g.strokeEllipse(x, y, width * 2, 9);
    g.fillStyle(0xd63a22, 1);
    g.fillCircle(x - width, y, 4.5);
    g.fillCircle(x + width, y, 4.5);
  }

  drawAim(g) {
    const dx = this.drag.startX - this.drag.x;
    const dy = this.drag.startY - this.drag.y;
    const distance = Math.hypot(dx, dy);
    const scale = distance > 90 ? 90 / distance : 1;
    const preview = { ...this.ball, vx: dx * scale * SHOT_POWER, vy: dy * scale * SHOT_POWER };
    const isDarkWorld = this.level.dark;
    const color = isDarkWorld ? 0xe7f5ff : 0x2b2118;
    g.lineStyle(3, color, 0.75);
    g.fillStyle(color, 0.95);
    g.lineBetween(this.ball.x, this.ball.y, this.ball.x - dx * scale, this.ball.y - dy * scale);
    for (let i = 1; i <= 24; i += 1) {
      stepBall(preview, this.collisionObstacles, this.tick + i);
      if (i % 3 === 0) g.fillCircle(preview.x, preview.y, 2.5);
    }
  }
}
