/**
 * DX-Ball PowerUp Pill Object
 * Supports 14 items:
 * LARGE_PADDLE, SMALL_PADDLE, EXTRA_LIFE, MULTI_BALL, LASER_PADDLE,
 * FIRE_BALL, SLOW_BALL, FAST_BALL, SHIELD, MAGNET_PADDLE, DOUBLE_SCORE,
 * GHOST_BALL, STICKY_PADDLE, RANDOM_ITEM
 */
export const POWERUP_TYPES = {
  LARGE_PADDLE: { id: 'LARGE_PADDLE', label: 'W', color: '#06b6d4' },
  SMALL_PADDLE: { id: 'SMALL_PADDLE', label: 'p', color: '#ef4444' },
  EXTRA_LIFE: { id: 'EXTRA_LIFE', label: '+', color: '#10b981' },
  MULTI_BALL: { id: 'MULTI_BALL', label: 'M', color: '#3b82f6' },
  LASER_PADDLE: { id: 'LASER_PADDLE', label: 'L', color: '#f43f5e' },
  FIRE_BALL: { id: 'FIRE_BALL', label: 'F', color: '#f97316' },
  SLOW_BALL: { id: 'SLOW_BALL', label: 'D', color: '#a855f7' },
  FAST_BALL: { id: 'FAST_BALL', label: 'U', color: '#eab308' },
  SHIELD: { id: 'SHIELD', label: 'B', color: '#6366f1' },
  MAGNET_PADDLE: { id: 'MAGNET_PADDLE', label: 'C', color: '#059669' },
  DOUBLE_SCORE: { id: 'DOUBLE_SCORE', label: '2x', color: '#e11d48' },
  GHOST_BALL: { id: 'GHOST_BALL', label: 'G', color: '#f59e0b' },
  STICKY_PADDLE: { id: 'STICKY_PADDLE', label: 'K', color: '#14b8a6' },
  RANDOM_ITEM: { id: 'RANDOM_ITEM', label: '?', color: '#ec4899' }
};

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 36;
    this.height = 18;
    this.type = type;
    this.speed = 180; // Falling speed px/sec
    this.isCollected = false;
  }

  update(dt) {
    this.y += this.speed * dt;
  }

  render(ctx) {
    if (this.isCollected) return;

    ctx.save();

    // Capsule Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.type.color;

    ctx.fillStyle = this.type.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    // Draw Capsule Pill Shape
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 9);
    ctx.fill();
    ctx.stroke();

    // Capsule Label Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.label, this.x + this.width / 2, this.y + this.height / 2);

    ctx.restore();
  }
}
