/**
 * DX-Ball Collision System
 * Handles Circle-AABB collision detection, reflection normal calculation,
 * anti-tunneling position adjustment, explosive chain reactions, particle emissions, and audio triggers.
 */
import { BRICK_TYPES, BRICK_COLORS } from '../objects/Brick.js';

export class CollisionSystem {
  static checkCollisions(game) {
    const balls = game.balls || [game.ball];
    const bricks = game.bricks;

    balls.forEach(ball => {
      if (!ball || ball.onPaddle || game.state !== 'PLAYING') return;

      // Motion Trail
      if (game.particleSystem) {
        game.particleSystem.emitBallTrail(ball.x, ball.y, '#22d3ee', ball.fireBall);
      }

      // Bottom Shield Bounce check
      if (game.powerUpManager && game.powerUpManager.shieldActive) {
        const bottomY = game.renderer.virtualHeight - 12;
        if (ball.y + ball.radius >= bottomY) {
          ball.y = bottomY - ball.radius - 1;
          ball.vy = -Math.abs(ball.vy);
          if (game.audioManager) game.audioManager.playPaddleBounce();
        }
      }

      // Ball vs Bricks
      for (let i = 0; i < bricks.length; i++) {
        const brick = bricks[i];
        if (brick.isDestroyed) continue;

        const collision = this.circleVsAABB(ball, brick);
        if (collision.hit) {
          // Position resolution
          ball.x += collision.normalX * collision.depth;
          ball.y += collision.normalY * collision.depth;

          // Bounce reflection
          if (!ball.thruBall || brick.type === BRICK_TYPES.STEEL) {
            if (Math.abs(collision.normalX) > Math.abs(collision.normalY)) {
              ball.vx = (collision.normalX > 0 ? 1 : -1) * Math.abs(ball.vx);
            } else {
              ball.vy = (collision.normalY > 0 ? 1 : -1) * Math.abs(ball.vy);
            }
          }

          // Apply hit damage
          const hitResult = brick.hit(ball.thruBall, ball.fireBall);
          if (hitResult.score > 0) {
            const multiplier = (game.powerUpManager ? game.powerUpManager.scoreMultiplier : 1);
            game.score += hitResult.score * multiplier;
          }

          // Trigger Sound Effects
          if (game.audioManager) {
            if (hitResult.isSteel && !hitResult.destroyed) {
              game.audioManager.playSteelHit();
            } else {
              game.audioManager.playBrickHit(brick.type === BRICK_TYPES.GLASS);
            }
          }

          // Emit Brick Shatter Particles
          if (game.particleSystem) {
            const color = BRICK_COLORS[brick.type] || '#ffffff';
            game.particleSystem.emitBrickDebris(brick.x, brick.y, brick.width, brick.height, color);
          }

          // Item Drop Trigger
          if (hitResult.destroyed && game.powerUpManager) {
            game.powerUpManager.onBrickDestroyed(brick);
          }

          // Explosive Detonation
          if (hitResult.isExplosive) {
            this.triggerExplosion(game, brick.x + brick.width / 2, brick.y + brick.height / 2);
          }

          break;
        }
      }
    });
  }

  static circleVsAABB(circle, box) {
    const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq < circle.radius * circle.radius) {
      const distance = Math.sqrt(distanceSq) || 0.001;
      const depth = circle.radius - distance;
      const normalX = dx / distance;
      const normalY = dy / distance;

      return { hit: true, depth, normalX, normalY };
    }

    return { hit: false, depth: 0, normalX: 0, normalY: 0 };
  }

  static triggerExplosion(game, centerX, centerY, radius = 120) {
    if (game.audioManager) {
      game.audioManager.playExplosion();
    }
    if (game.particleSystem) {
      game.particleSystem.emitExplosion(centerX, centerY);
    }

    game.bricks.forEach(brick => {
      if (brick.isDestroyed) return;

      const brickCenterX = brick.x + brick.width / 2;
      const brickCenterY = brick.y + brick.height / 2;
      const distSq = (brickCenterX - centerX) ** 2 + (brickCenterY - centerY) ** 2;

      if (distSq <= radius * radius) {
        const hitResult = brick.hit(true, true);
        if (hitResult.score > 0) {
          const multiplier = (game.powerUpManager ? game.powerUpManager.scoreMultiplier : 1);
          game.score += hitResult.score * multiplier;
        }

        if (game.particleSystem) {
          const color = BRICK_COLORS[brick.type] || '#ffffff';
          game.particleSystem.emitBrickDebris(brick.x, brick.y, brick.width, brick.height, color);
        }

        if (hitResult.destroyed && game.powerUpManager) {
          game.powerUpManager.onBrickDestroyed(brick);
        }
      }
    });
  }
}
