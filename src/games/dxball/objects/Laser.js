/**
 * DX-Ball Laser Projectile
 */
export class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 16;
    this.speed = 1100; // px/sec upwards
    this.isDestroyed = false;
  }

  update(dt) {
    this.y -= this.speed * dt;
    if (this.y < -20) {
      this.isDestroyed = true;
    }
  }

  render(ctx) {
    if (this.isDestroyed) return;

    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ef4444';

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x - 1, this.y + 2, 2, this.height - 4);

    ctx.restore();
  }
}
