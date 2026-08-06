/**
 * DX-Ball Particle System
 * Manages particle pools, brick debris emission, explosions, and ball trails.
 */
import { Particle } from '../objects/Particle.js';

export class ParticleSystem {
  constructor(maxParticles = 400) {
    this.particles = [];
    this.maxParticles = maxParticles;
  }

  emitBrickDebris(x, y, width, height, color, count = 12) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const px = x + Math.random() * width;
      const py = y + Math.random() * height;
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 4;
      const life = 0.3 + Math.random() * 0.4;
      const gravity = 350; // Downward gravity force for falling brick fragments

      this.particles.push(new Particle(px, py, vx, vy, size, color, life, gravity));
    }
  }

  emitExplosion(centerX, centerY, count = 35) {
    const fireColors = ['#ef4444', '#f97316', '#f59e0b', '#ffffff'];

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 380;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 3 + Math.random() * 6;
      const color = fireColors[Math.floor(Math.random() * fireColors.length)];
      const life = 0.4 + Math.random() * 0.5;

      this.particles.push(new Particle(centerX, centerY, vx, vy, size, color, life, 0));
    }
  }

  emitLaserSparks(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = 60 + Math.random() * 180;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 3;

      this.particles.push(new Particle(x, y, vx, vy, size, '#f43f5e', 0.25, 0));
    }
  }

  emitBallTrail(x, y, color = '#22d3ee', fireBall = false) {
    if (this.particles.length >= this.maxParticles) return;

    const trailColor = fireBall ? '#f97316' : color;
    const size = fireBall ? 5 : 3;
    const vx = (Math.random() - 0.5) * 20;
    const vy = (Math.random() - 0.5) * 20;

    this.particles.push(new Particle(x, y, vx, vy, size, trailColor, 0.2, 0));
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.isDead) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    this.particles.forEach(p => p.render(ctx));
  }

  clear() {
    this.particles = [];
  }
}
