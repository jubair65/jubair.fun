import { Renderer } from './Renderer.js';
import { InputManager } from '../managers/InputManager.js';
import { LevelManager } from '../managers/LevelManager.js';
import { PowerUpManager } from '../managers/PowerUpManager.js';
import { ParticleSystem } from '../managers/ParticleSystem.js';
import { AudioManager } from '../managers/AudioManager.js';
import { Menu } from '../ui/Menu.js';
import { Paddle } from '../objects/Paddle.js';
import { Ball } from '../objects/Ball.js';
import { BRICK_TYPES } from '../objects/Brick.js';
import { CollisionSystem } from '../managers/CollisionSystem.js';

export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_SELECT: 'LEVEL_SELECT',
  GAMEOVER: 'GAMEOVER',
  VICTORY: 'VICTORY'
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas, this.renderer);
    this.audioManager = new AudioManager();

    this.paddle = new Paddle(this.renderer.virtualWidth, this.renderer.virtualHeight);
    this.ball = new Ball(this.renderer.virtualWidth, this.renderer.virtualHeight);
    this.balls = [this.ball];

    this.particleSystem = new ParticleSystem(450);
    this.powerUpManager = new PowerUpManager(this);

    this.bricks = [];
    this.levelManager = new LevelManager(this);
    this.levelManager.loadLevel(1);

    this.menu = new Menu(this);

    this.state = GAME_STATES.MENU; // Start at Main Menu
    this.isRunning = false;
    this.animFrameId = null;

    this.lastTime = 0;
    this.lives = 3;
    this.score = 0;
    this.escapeLock = false;

    // Pointer Lock & Focus Change Callbacks
    this.input.onPointerLockChangeCallback = (isLocked) => {
      if (this.state === GAME_STATES.PLAYING && !isLocked) {
        this.state = GAME_STATES.PAUSED;
      }
    };

    this.input.onWindowBlurCallback = () => {
      if (this.state === GAME_STATES.PLAYING) {
        this.input.exitPointerLock();
        this.state = GAME_STATES.PAUSED;
      }
    };

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _onResize() {
    if (this.renderer) {
      this.renderer.resize();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.menu) {
      this.menu.destroy();
    }
    if (this.input) {
      this.input.detachListeners();
    }
    window.removeEventListener('resize', this._onResize);
  }

  setState(newState) {
    this.state = newState;
    if (newState !== GAME_STATES.PLAYING) {
      this.input.exitPointerLock();
    }
  }

  loop(currentTime) {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.input.resetActionFlags();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    // Handle Escape Key Pause Toggle
    if (this.input.keys.escape && !this.escapeLock) {
      this.escapeLock = true;
      if (this.state === GAME_STATES.PLAYING) {
        this.input.exitPointerLock();
        this.state = GAME_STATES.PAUSED;
      } else if (this.state === GAME_STATES.PAUSED) {
        this.state = GAME_STATES.PLAYING;
        this.input.requestPointerLock();
      }
    } else if (!this.input.keys.escape) {
      this.escapeLock = false;
    }

    // Re-request Pointer Lock on click during gameplay if unlocked
    if (this.state === GAME_STATES.PLAYING && this.input.mouse.isDown) {
      this.input.requestPointerLock();
    }

    // Handle cursor hiding across game container during gameplay
    if (this.canvas) {
      const container = this.canvas.parentElement;
      if (this.state === GAME_STATES.PLAYING) {
        this.canvas.style.cursor = 'none';
        if (container) container.style.cursor = 'none';
      } else {
        if (container) container.style.cursor = 'default';
      }
    }

    if (this.state !== GAME_STATES.PLAYING) return;

    // Launch attached balls
    this.balls.forEach(ball => {
      if (ball.onPaddle && (this.input.keys.space || this.input.mouse.isDown)) {
        ball.launch();
        if (this.audioManager) this.audioManager.playPaddleBounce();
      }
    });

    // Update Paddle & Balls
    this.paddle.update(dt, this.input);
    
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      ball.update(dt, this.paddle);

      if (ball.y - ball.radius > this.renderer.virtualHeight) {
        this.balls.splice(i, 1);
      }
    }

    // Handle losing all balls
    if (this.balls.length === 0) {
      this.lives--;
      if (this.audioManager) this.audioManager.playLifeLost();

      if (this.lives <= 0) {
        this.state = GAME_STATES.GAMEOVER;
      } else {
        this.ball = new Ball(this.renderer.virtualWidth, this.renderer.virtualHeight);
        this.ball.resetOnPaddle(this.paddle);
        this.balls = [this.ball];
      }
    }

    // Update Moving Bricks
    this.bricks.forEach(brick => brick.update(dt));

    // Update PowerUps & Lasers
    this.powerUpManager.update(dt);

    // Update Particle System
    this.particleSystem.update(dt);

    // Execute Collision Checks
    CollisionSystem.checkCollisions(this);

    // Check Level Progression
    const breakableLeft = this.bricks.some(b => !b.isDestroyed && b.type !== BRICK_TYPES.STEEL);
    if (!breakableLeft && this.bricks.length > 0) {
      const hasNext = this.levelManager.nextLevel();
      if (hasNext) {
        this.ball = new Ball(this.renderer.virtualWidth, this.renderer.virtualHeight);
        this.ball.resetOnPaddle(this.paddle);
        this.balls = [this.ball];
        this.powerUpManager.reset();
        this.particleSystem.clear();
      } else {
        this.state = GAME_STATES.VICTORY;
      }
    }
  }

  render() {
    this.renderer.beginFrame();
    const ctx = this.renderer.ctx;

    // Draw level background theme
    const currentLevelData = this.levelManager.getCurrentLevelData();
    if (currentLevelData && currentLevelData.theme) {
      ctx.fillStyle = currentLevelData.theme;
      ctx.fillRect(0, 0, this.renderer.virtualWidth, this.renderer.virtualHeight);
    }

    // Render Gameplay Elements
    this.bricks.forEach(brick => brick.render(ctx));
    this.powerUpManager.render(ctx);
    this.paddle.render(ctx);
    this.balls.forEach(ball => ball.render(ctx));
    this.particleSystem.render(ctx);

    // Render Gameplay HUD (if playing or paused)
    if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
      ctx.save();
      ctx.fillStyle = '#06b6d4';
      ctx.font = '16px "Share Tech Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`LIVES: ${'❤️'.repeat(Math.max(0, this.lives))}`, 30, 40);
      ctx.fillText(`SCORE: ${String(this.score).padStart(6, '0')}`, 200, 40);
      ctx.fillText(`LEVEL: ${this.level} (${currentLevelData.name || ''})`, 380, 40);
      
      if (this.powerUpManager.scoreMultiplier > 1) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`[2X MULTIPLIER]`, 740, 40);
      }

      if (this.state === GAME_STATES.PLAYING && this.balls.some(b => b.onPaddle)) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACEBAR OR CLICK TO LAUNCH BALL', 640, 450);
      }

      ctx.restore();
    }

    // Render Menu Overlays (Menu, Pause, Level Select, Game Over, Victory)
    if (this.state !== GAME_STATES.PLAYING) {
      this.menu.render(ctx);
    }

    this.renderer.endFrame();
  }
}
