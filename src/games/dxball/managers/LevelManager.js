/**
 * DX-Ball Level Manager
 * Orchestrates level loading, brick grid generation, and progression.
 */
import { LEVELS_DATA } from '../levels/levelData.js';
import { Brick } from '../objects/Brick.js';

export class LevelManager {
  constructor(game) {
    this.game = game;
    this.currentLevelIndex = 0;
    this.maxLevels = LEVELS_DATA.length;
  }

  getCurrentLevelNumber() {
    return this.currentLevelIndex + 1;
  }

  getCurrentLevelData() {
    return LEVELS_DATA[this.currentLevelIndex] || LEVELS_DATA[0];
  }

  loadLevel(levelNumber) {
    const targetIndex = Math.max(0, Math.min(this.maxLevels - 1, levelNumber - 1));
    this.currentLevelIndex = targetIndex;
    const levelData = LEVELS_DATA[targetIndex];

    const bricks = [];
    const grid = levelData.grid;
    const rows = grid.length;
    const cols = grid[0].length;

    const brickWidth = 92;
    const brickHeight = 30;
    const padding = 14;

    const totalWidth = cols * brickWidth + (cols - 1) * padding;
    const offsetX = (this.game.renderer.virtualWidth - totalWidth) / 2;
    const offsetY = 100;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = grid[r][c];
        if (type !== 0) {
          const x = offsetX + c * (brickWidth + padding);
          const y = offsetY + r * (brickHeight + padding);
          bricks.push(new Brick(x, y, brickWidth, brickHeight, type));
        }
      }
    }

    this.game.bricks = bricks;
    this.game.level = this.getCurrentLevelNumber();

    // Scale ball speed per level
    if (this.game.ball) {
      this.game.ball.increaseSpeedForLevel(this.game.level);
      this.game.ball.resetOnPaddle(this.game.paddle);
    }
  }

  nextLevel() {
    if (this.currentLevelIndex + 1 < this.maxLevels) {
      this.loadLevel(this.currentLevelIndex + 2);
      return true;
    }
    return false; // Reached last level (Game Completed)
  }
}
