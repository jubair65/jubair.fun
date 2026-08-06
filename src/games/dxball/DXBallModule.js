import { Game } from './engine/Game.js';

export class DXBallModule {
  constructor() {
    this.game = null;
  }

  init(canvasId = 'dxball-canvas') {
    const canvas = typeof canvasId === 'string'
      ? (document.getElementById(canvasId) || document.querySelector(canvasId))
      : canvasId;

    if (!canvas) {
      console.warn(`[DXBallModule] Canvas with selector "${canvasId}" not found.`);
      return;
    }

    if (this.game) {
      this.destroy();
    }

    this.game = new Game(canvas);
    this.game.start();
    console.log('[DXBallModule] Engine Phase 1 initialized.');
  }

  destroy() {
    if (this.game) {
      if (this.game.canvas) {
        this.game.canvas.style.cursor = 'default';
        if (this.game.canvas.parentElement) {
          this.game.canvas.parentElement.style.cursor = 'default';
        }
      }
      this.game.stop();
      this.game = null;
      console.log('[DXBallModule] Engine destroyed.');
    }
  }
}

export const dxBallModule = new DXBallModule();
