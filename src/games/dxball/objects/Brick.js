/**
 * DX-Ball Brick Object
 * Supports 7 types:
 * 1. Normal (1 hit)
 * 2. Strong (2 hits, cracks/changes color)
 * 3. Steel (Indestructible)
 * 4. Explosive (Triggers area detonation)
 * 5. Moving (Patrols left/right)
 * 6. Glass (Instant shatter)
 * 7. Bonus (Guaranteed item drop)
 */
export const BRICK_TYPES = {
  NORMAL: 1,
  STRONG: 2,
  STEEL: 3,
  EXPLOSIVE: 4,
  MOVING: 5,
  GLASS: 6,
  BONUS: 7
};

export const BRICK_COLORS = {
  [BRICK_TYPES.NORMAL]: '#06b6d4',   // Cyan
  [BRICK_TYPES.STRONG]: '#3b82f6',   // Blue (cracks to cyan)
  [BRICK_TYPES.STEEL]: '#94a3b8',    // Steel Silver
  [BRICK_TYPES.EXPLOSIVE]: '#ef4444',// Red
  [BRICK_TYPES.MOVING]: '#8b5cf6',   // Purple
  [BRICK_TYPES.GLASS]: 'rgba(255, 255, 255, 0.45)', // Translucent Glass
  [BRICK_TYPES.BONUS]: '#f59e0b'    // Gold
};

export class Brick {
  constructor(x, y, width = 76, height = 28, type = BRICK_TYPES.NORMAL) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;

    this.isDestroyed = false;

    // Hits configuration
    switch (type) {
      case BRICK_TYPES.STRONG:
        this.hits = 2;
        this.maxHits = 2;
        break;
      case BRICK_TYPES.STEEL:
        this.hits = Infinity;
        this.maxHits = Infinity;
        break;
      default:
        this.hits = 1;
        this.maxHits = 1;
        break;
    }

    // Moving brick patrol state
    if (type === BRICK_TYPES.MOVING) {
      this.startX = x;
      this.patrolDistance = 90;
      this.speed = 80; // px/sec
      this.direction = 1;
    }
  }

  hit(thruBall = false, fireBall = false) {
    if (this.isDestroyed) return { destroyed: false, score: 0 };

    if (this.type === BRICK_TYPES.STEEL) {
      if (fireBall || thruBall) {
        this.hits = 0;
        this.isDestroyed = true;
        return { destroyed: true, score: 300, isSteel: true };
      }
      return { destroyed: false, score: 0, isSteel: true };
    }

    if (fireBall) {
      this.hits = 0;
    } else {
      this.hits--;
    }

    if (this.hits <= 0) {
      this.isDestroyed = true;
      const scores = {
        [BRICK_TYPES.NORMAL]: 100,
        [BRICK_TYPES.STRONG]: 200,
        [BRICK_TYPES.STEEL]: 300,
        [BRICK_TYPES.EXPLOSIVE]: 250,
        [BRICK_TYPES.MOVING]: 180,
        [BRICK_TYPES.GLASS]: 80,
        [BRICK_TYPES.BONUS]: 150
      };
      return {
        destroyed: true,
        score: scores[this.type] || 100,
        isExplosive: this.type === BRICK_TYPES.EXPLOSIVE,
        isBonus: this.type === BRICK_TYPES.BONUS
      };
    }

    return { destroyed: false, score: 50 };
  }

  update(dt) {
    if (this.isDestroyed) return;

    if (this.type === BRICK_TYPES.MOVING) {
      this.x += this.speed * this.direction * dt;
      if (this.x > this.startX + this.patrolDistance) {
        this.x = this.startX + this.patrolDistance;
        this.direction = -1;
      } else if (this.x < this.startX - this.patrolDistance) {
        this.x = this.startX - this.patrolDistance;
        this.direction = 1;
      }
    }
  }

  render(ctx) {
    if (this.isDestroyed) return;

    ctx.save();

    let color = BRICK_COLORS[this.type];

    // Color shift for damaged Strong brick
    if (this.type === BRICK_TYPES.STRONG && this.hits === 1) {
      color = '#60a5fa'; // Lightened blue showing crack damage
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = '#070a13';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 3);
    ctx.fill();
    ctx.stroke();

    // 3D Retro Bevels & Highlights
    if (this.type === BRICK_TYPES.STEEL) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x + 3, this.y + this.height - 3);
      ctx.lineTo(this.x + 3, this.y + 3);
      ctx.lineTo(this.x + this.width - 3, this.y + 3);
      ctx.stroke();
    } else if (this.type === BRICK_TYPES.GLASS) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x + 6, this.y + this.height - 6);
      ctx.lineTo(this.x + this.width - 6, this.y + 6);
      ctx.stroke();
    } else {
      // Top Highlight Glow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, 4);
    }

    // Icon Markings for Explosive & Bonus
    if (this.type === BRICK_TYPES.EXPLOSIVE) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💣', this.x + this.width / 2, this.y + this.height / 2 + 4);
    } else if (this.type === BRICK_TYPES.BONUS) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★', this.x + this.width / 2, this.y + this.height / 2 + 4);
    }

    ctx.restore();
  }
}
