/**
 * DX-Ball Paddle Object
 * Handles smooth movement, acceleration, friction, mouse tracking, and boundaries.
 */
export class Paddle {
  constructor(virtualWidth = 1280, virtualHeight = 720) {
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;

    this.baseWidth = 140;
    this.width = 140;
    this.height = 20;

    // Position centered near bottom
    this.x = (virtualWidth - this.width) / 2;
    this.y = virtualHeight - 45;

    // Physics
    this.vx = 0;
    this.acceleration = 2400; // Acceleration rate (px/s^2)
    this.maxSpeed = 850;      // Top speed (px/s)
    this.friction = 0.88;     // Damping factor when no key pressed

    // Special Modes
    this.catchMode = false;
    this.laserMode = false;
    this.glowColor = '#06b6d4';
  }

  update(dt, inputManager) {
    let inputDirection = 0;

    // 1. Keyboard Controls
    if (inputManager.keys.left) {
      inputDirection -= 1;
    }
    if (inputManager.keys.right) {
      inputDirection += 1;
    }

    // Apply keyboard acceleration
    if (inputDirection !== 0) {
      this.vx += inputDirection * this.acceleration * dt;
      this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));
    } else if (!inputManager.mouse.isMoved) {
      // Apply friction if no keyboard or mouse active
      this.vx *= Math.pow(this.friction, dt * 60);
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // 2. Mouse Controls (Smooth Acceleration towards Mouse X)
    if (inputManager.mouse.isMoved) {
      const targetX = inputManager.mouse.x - this.width / 2;
      const dx = targetX - this.x;
      // Lerp paddle velocity towards mouse target
      this.vx = dx * 14; 
    }

    // Update position
    this.x += this.vx * dt;

    // Clamp inside virtual boundaries
    if (this.x < 10) {
      this.x = 10;
      this.vx = 0;
    } else if (this.x + this.width > this.virtualWidth - 10) {
      this.x = this.virtualWidth - 10 - this.width;
      this.vx = 0;
    }
  }

  render(ctx) {
    ctx.save();

    // Glow Effect
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.glowColor;

    // DX-Ball Style Metallic Gradient
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
    gradient.addColorStop(0, '#0891b2');
    gradient.addColorStop(0.3, '#22d3ee');
    gradient.addColorStop(0.5, '#ecfeff');
    gradient.addColorStop(0.7, '#22d3ee');
    gradient.addColorStop(1, '#0891b2');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#070a13';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 6);
    ctx.fill();
    ctx.stroke();

    // Highlights & Indicators
    if (this.catchMode) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.x + 8, this.y + 4);
      ctx.lineTo(this.x + this.width - 8, this.y + 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  reset() {
    this.width = this.baseWidth;
    this.x = (this.virtualWidth - this.width) / 2;
    this.vx = 0;
    this.catchMode = false;
    this.laserMode = false;
  }
}
