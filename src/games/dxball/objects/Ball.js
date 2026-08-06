/**
 * DX-Ball Ball Object
 * Handles ball trajectory, reflection physics (center vs edge hit), max angle cap (75°),
 * anti-horizontal bounce locks, and speed scaling per level.
 */
export class Ball {
  constructor(virtualWidth = 1280, virtualHeight = 720) {
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;

    this.radius = 9;
    this.baseSpeed = 520; // Pixels per second
    this.speed = 520;

    this.x = virtualWidth / 2;
    this.y = virtualHeight - 60;
    this.vx = 0;
    this.vy = -this.speed;

    this.onPaddle = true;
    this.thruBall = false;
    this.fireBall = false;

    // Angle caps (75 degrees max deflection from vertical)
    this.maxAngleRad = 75 * (Math.PI / 180); 
    this.minVy = 120; // Prevent infinite horizontal bouncing
  }

  resetOnPaddle(paddle) {
    this.onPaddle = true;
    this.vx = 0;
    this.vy = 0;
    this.thruBall = false;
    this.fireBall = false;

    if (paddle) {
      this.x = paddle.x + paddle.width / 2;
      this.y = paddle.y - this.radius - 1;
    }
  }

  launch() {
    if (!this.onPaddle) return;
    this.onPaddle = false;
    // Initial launch angle slightly offset or straight up
    const launchAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    this.vx = Math.cos(launchAngle) * this.speed;
    this.vy = Math.sin(launchAngle) * this.speed;
  }

  update(dt, paddle) {
    if (this.onPaddle) {
      if (paddle) {
        this.x = paddle.x + paddle.width / 2;
        this.y = paddle.y - this.radius - 1;
      }
      return;
    }

    // Move ball by velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 1. Boundary Wall Bounces (Left, Right, Top)
    if (this.x - this.radius <= 10) {
      this.x = 10 + this.radius;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.radius >= this.virtualWidth - 10) {
      this.x = this.virtualWidth - 10 - this.radius;
      this.vx = -Math.abs(this.vx);
    }

    if (this.y - this.radius <= 10) {
      this.y = 10 + this.radius;
      this.vy = Math.abs(this.vy);
    }

    // 2. Anti-Horizontal Lock Check
    this.enforceMinVerticalVelocity();

    // 3. Check Paddle Collision & Reflection Physics
    if (paddle) {
      this.checkPaddleBounce(paddle);
    }
  }

  checkPaddleBounce(paddle) {
    if (
      this.y + this.radius >= paddle.y &&
      this.y - this.radius <= paddle.y + paddle.height &&
      this.x + this.radius >= paddle.x &&
      this.x - this.radius <= paddle.x + paddle.width &&
      this.vy > 0 // Only bounce when moving downwards
    ) {
      if (paddle.catchMode) {
        this.onPaddle = true;
        this.vx = 0;
        this.vy = 0;
        this.x = Math.max(paddle.x + this.radius, Math.min(paddle.x + paddle.width - this.radius, this.x));
        this.y = paddle.y - this.radius - 1;
        return;
      }

      // Calculate relative hit position from -1 (far left) to +1 (far right)
      const paddleCenter = paddle.x + paddle.width / 2;
      const hitRatio = (this.x - paddleCenter) / (paddle.width / 2);
      const clampedRatio = Math.max(-1, Math.min(1, hitRatio));

      // Calculate reflection angle based on hit position (0 ratio = 90 deg / straight up)
      const bounceAngle = clampedRatio * this.maxAngleRad;

      // New velocity vector based on angle
      this.vx = this.speed * Math.sin(bounceAngle);
      this.vy = -this.speed * Math.cos(bounceAngle);

      // Reposition above paddle to prevent stuck clipping
      this.y = paddle.y - this.radius - 1;
    }
  }

  enforceMinVerticalVelocity() {
    if (Math.abs(this.vy) < this.minVy) {
      this.vy = (this.vy < 0 ? -1 : 1) * this.minVy;
      // Recalculate vx to preserve current overall speed
      const remainingSpeedSq = this.speed * this.speed - this.vy * this.vy;
      if (remainingSpeedSq > 0) {
        this.vx = (this.vx < 0 ? -1 : 1) * Math.sqrt(remainingSpeedSq);
      }
    }
  }

  increaseSpeedForLevel(levelNumber) {
    // Increase speed slightly per level (+4% per level)
    this.speed = this.baseSpeed * (1 + (levelNumber - 1) * 0.04);
  }

  render(ctx) {
    ctx.save();

    // Outer Glow
    ctx.shadowBlur = this.fireBall ? 18 : 10;
    ctx.shadowColor = this.fireBall ? '#f97316' : (this.thruBall ? '#f59e0b' : '#ffffff');

    // DX-Ball Style Shiny Metallic / Glowing Sphere
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      this.radius * 0.1,
      this.x,
      this.y,
      this.radius
    );

    if (this.fireBall) {
      gradient.addColorStop(0, '#fff7ed');
      gradient.addColorStop(0.5, '#f97316');
      gradient.addColorStop(1, '#ea580c');
    } else if (this.thruBall) {
      gradient.addColorStop(0, '#fef3c7');
      gradient.addColorStop(0.5, '#f59e0b');
      gradient.addColorStop(1, '#d97706');
    } else {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.6, '#cbd5e1');
      gradient.addColorStop(1, '#64748b');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
