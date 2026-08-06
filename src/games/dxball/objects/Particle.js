/**
 * DX-Ball Particle Object
 * Represents lightweight visual particle fragments (brick debris, sparks, fire trails).
 */
export class Particle {
  constructor(x, y, vx, vy, size, color, maxLife = 0.5, gravity = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.life = maxLife;
    this.maxLife = maxLife;
    this.gravity = gravity;
    this.alpha = 1;
    this.isDead = false;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }

    this.alpha = Math.max(0, this.life / this.maxLife);
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    if (this.isDead || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.5, this.size * this.alpha), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
