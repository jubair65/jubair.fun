import { PowerUp, POWERUP_TYPES } from '../objects/PowerUp.js';
import { Laser } from '../objects/Laser.js';
import { Ball } from '../objects/Ball.js';

export class PowerUpManager {
  constructor(game) {
    this.game = game;
    this.activePowerUps = [];
    this.activeLasers = [];

    this.shieldActive = false;
    this.shieldDuration = 0;
    this.scoreMultiplier = 1;
    this.scoreMultiplierDuration = 0;

    this.laserCooldown = 0;
  }

  onBrickDestroyed(brick) {
    const shouldDrop = brick.type === 7 || Math.random() < 0.18;
    if (!shouldDrop) return;

    const typesList = Object.values(POWERUP_TYPES);
    let selectedType;

    if (brick.type === 7) {
      const bonusTypes = [
        POWERUP_TYPES.EXTRA_LIFE,
        POWERUP_TYPES.MULTI_BALL,
        POWERUP_TYPES.FIRE_BALL,
        POWERUP_TYPES.LASER_PADDLE,
        POWERUP_TYPES.LARGE_PADDLE
      ];
      selectedType = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
    } else {
      selectedType = typesList[Math.floor(Math.random() * typesList.length)];
    }

    const item = new PowerUp(brick.x + brick.width / 2 - 18, brick.y + brick.height / 2 - 9, selectedType);
    this.activePowerUps.push(item);
  }

  update(dt) {
    const paddle = this.game.paddle;

    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const item = this.activePowerUps[i];
      item.update(dt);

      if (
        item.y + item.height >= paddle.y &&
        item.y <= paddle.y + paddle.height &&
        item.x + item.width >= paddle.x &&
        item.x <= paddle.x + paddle.width
      ) {
        if (this.game.audioManager) this.game.audioManager.playPowerUp();
        this.applyEffect(item.type);
        item.isCollected = true;
        this.activePowerUps.splice(i, 1);
        continue;
      }

      if (item.y > this.game.renderer.virtualHeight + 50) {
        this.activePowerUps.splice(i, 1);
      }
    }

    if (paddle.laserMode) {
      this.laserCooldown -= dt;
      if (this.game.input.keys.space && this.laserCooldown <= 0) {
        this.activeLasers.push(new Laser(paddle.x + 12, paddle.y));
        this.activeLasers.push(new Laser(paddle.x + paddle.width - 12, paddle.y));
        this.laserCooldown = 0.25;
        if (this.game.audioManager) this.game.audioManager.playLaser();
      }
    }

    for (let l = this.activeLasers.length - 1; l >= 0; l--) {
      const laser = this.activeLasers[l];
      laser.update(dt);

      if (laser.isDestroyed) {
        this.activeLasers.splice(l, 1);
        continue;
      }

      for (let b = 0; b < this.game.bricks.length; b++) {
        const brick = this.game.bricks[b];
        if (brick.isDestroyed) continue;

        if (
          laser.x >= brick.x &&
          laser.x <= brick.x + brick.width &&
          laser.y >= brick.y &&
          laser.y <= brick.y + brick.height
        ) {
          const res = brick.hit(false, false);
          if (res.score > 0) {
            this.game.score += res.score * this.scoreMultiplier;
          }
          if (this.game.audioManager) this.game.audioManager.playBrickHit();
          laser.isDestroyed = true;
          this.activeLasers.splice(l, 1);
          break;
        }
      }
    }

    if (this.shieldActive) {
      this.shieldDuration -= dt;
      if (this.shieldDuration <= 0) {
        this.shieldActive = false;
      }
    }

    if (this.scoreMultiplier > 1) {
      this.scoreMultiplierDuration -= dt;
      if (this.scoreMultiplierDuration <= 0) {
        this.scoreMultiplier = 1;
      }
    }
  }

  applyEffect(type) {
    let effectType = type;
    if (effectType.id === 'RANDOM_ITEM') {
      const all = Object.values(POWERUP_TYPES).filter(t => t.id !== 'RANDOM_ITEM');
      effectType = all[Math.floor(Math.random() * all.length)];
    }

    const paddle = this.game.paddle;
    const ball = this.game.ball;

    switch (effectType.id) {
      case 'LARGE_PADDLE':
        paddle.width = Math.min(240, paddle.baseWidth * 1.5);
        break;

      case 'SMALL_PADDLE':
        paddle.width = Math.max(80, paddle.baseWidth * 0.75);
        break;

      case 'EXTRA_LIFE':
        this.game.lives++;
        break;

      case 'MULTI_BALL':
        this.spawnMultiBalls();
        break;

      case 'LASER_PADDLE':
        paddle.laserMode = true;
        break;

      case 'FIRE_BALL':
        ball.fireBall = true;
        ball.thruBall = false;
        break;

      case 'SLOW_BALL':
        ball.speed = Math.max(300, ball.speed * 0.7);
        if (!ball.onPaddle) {
          ball.vx *= 0.7;
          ball.vy *= 0.7;
        }
        break;

      case 'FAST_BALL':
        ball.speed = Math.min(900, ball.speed * 1.3);
        if (!ball.onPaddle) {
          ball.vx *= 1.3;
          ball.vy *= 1.3;
        }
        break;

      case 'SHIELD':
        this.shieldActive = true;
        this.shieldDuration = 16;
        break;

      case 'MAGNET_PADDLE':
      case 'STICKY_PADDLE':
        paddle.catchMode = true;
        break;

      case 'DOUBLE_SCORE':
        this.scoreMultiplier = 2;
        this.scoreMultiplierDuration = 15;
        break;

      case 'GHOST_BALL':
        ball.thruBall = true;
        ball.fireBall = false;
        break;
    }
  }

  spawnMultiBalls() {
    if (!this.game.balls) {
      this.game.balls = [this.game.ball];
    }
    const current = this.game.ball;
    if (current.onPaddle) return;

    for (let i = 0; i < 2; i++) {
      const newBall = new Ball(this.game.renderer.virtualWidth, this.game.renderer.virtualHeight);
      newBall.x = current.x;
      newBall.y = current.y;
      newBall.onPaddle = false;
      newBall.speed = current.speed;

      const angle = (Math.random() - 0.5) * 1.2;
      newBall.vx = current.speed * Math.sin(angle);
      newBall.vy = -current.speed * Math.cos(angle);

      this.game.balls.push(newBall);
    }
  }

  render(ctx) {
    this.activePowerUps.forEach(p => p.render(ctx));
    this.activeLasers.forEach(l => l.render(ctx));

    if (this.shieldActive) {
      ctx.save();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 6;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#818cf8';

      const y = this.game.renderer.virtualHeight - 8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.game.renderer.virtualWidth, y);
      ctx.stroke();

      ctx.restore();
    }
  }

  reset() {
    this.activePowerUps = [];
    this.activeLasers = [];
    this.shieldActive = false;
    this.shieldDuration = 0;
    this.scoreMultiplier = 1;
    this.scoreMultiplierDuration = 0;
  }
}
