/**
 * DX-Ball Menu & UI Renderer
 * Renders Start Menu, Pause Overlay, Level Select Grid, Game Over, and Victory Screens.
 */
export class Menu {
  constructor(game) {
    this.game = game;
    this.selectedLevelIndex = 0;

    // Hover button region tracking
    this.buttons = [];
    this._onClick = this._onClick.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);

    window.addEventListener('click', this._onClick);
    window.addEventListener('mousemove', this._onMouseMove);
  }

  destroy() {
    window.removeEventListener('click', this._onClick);
    window.removeEventListener('mousemove', this._onMouseMove);
  }

  _onMouseMove(e) {
    if (this.game.state === 'PLAYING') return;

    const coords = this.game.renderer.screenToCanvasCoords(e.clientX, e.clientY);
    let isHovering = false;

    this.buttons.forEach(btn => {
      if (
        coords.x >= btn.x &&
        coords.x <= btn.x + btn.width &&
        coords.y >= btn.y &&
        coords.y <= btn.y + btn.height
      ) {
        btn.isHovered = true;
        isHovering = true;
      } else {
        btn.isHovered = false;
      }
    });

    if (this.game.canvas) {
      this.game.canvas.style.cursor = isHovering ? 'pointer' : 'default';
      if (this.game.canvas.parentElement) {
        this.game.canvas.parentElement.style.cursor = isHovering ? 'pointer' : 'default';
      }
    }
  }

  _onClick(e) {
    if (this.game.state === 'PLAYING') return;

    const coords = this.game.renderer.screenToCanvasCoords(e.clientX, e.clientY);

    this.buttons.forEach(btn => {
      if (
        coords.x >= btn.x &&
        coords.x <= btn.x + btn.width &&
        coords.y >= btn.y &&
        coords.y <= btn.y + btn.height
      ) {
        if (btn.onClick) btn.onClick();
      }
    });
  }

  render(ctx) {
    this.buttons = []; // Reset active buttons for current state frame

    switch (this.game.state) {
      case 'MENU':
        this.renderMainMenu(ctx);
        break;
      case 'PAUSED':
        this.renderPauseMenu(ctx);
        break;
      case 'LEVEL_SELECT':
        this.renderLevelSelect(ctx);
        break;
      case 'GAMEOVER':
        this.renderGameOver(ctx);
        break;
      case 'VICTORY':
        this.renderVictory(ctx);
        break;
    }
  }

  renderMainMenu(ctx) {
    // Backdrop overlay
    ctx.save();
    ctx.fillStyle = 'rgba(7, 10, 19, 0.92)';
    ctx.fillRect(0, 0, 1280, 720);

    // Title Banner
    ctx.fillStyle = '#06b6d4';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#06b6d4';
    ctx.font = '900 64px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DX-BALL', 640, 220);

    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.fillText('CLASSIC ARCADE REIMAGINED (1996)', 640, 270);

    // Action Buttons
    this.createButton(ctx, 490, 340, 300, 54, 'START GAME', '#06b6d4', () => {
      this.game.score = 0;
      this.game.lives = 3;
      this.game.levelManager.loadLevel(1);
      this.game.setState('PLAYING');
      this.game.input.requestPointerLock();
    });

    this.createButton(ctx, 490, 420, 300, 54, 'SELECT LEVEL (20)', '#3b82f6', () => {
      this.game.setState('LEVEL_SELECT');
    });

    // Controls Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '14px monospace';
    ctx.fillText('CONTROLS: ARROW KEYS / A D / MOUSE to Move | SPACEBAR to Launch & Fire', 640, 580);
    ctx.fillText('PRESS ESC TO PAUSE DURING GAMEPLAY', 640, 610);

    ctx.restore();
  }

  renderPauseMenu(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 10, 19, 0.85)';
    ctx.fillRect(0, 0, 1280, 720);

    ctx.fillStyle = '#f59e0b';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#f59e0b';
    ctx.font = 'bold 54px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME PAUSED', 640, 200);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Game Paused - Click Resume to continue.', 640, 250);

    this.createButton(ctx, 490, 310, 300, 50, 'RESUME', '#10b981', () => {
      this.game.setState('PLAYING');
      this.game.input.requestPointerLock();
    });

    this.createButton(ctx, 490, 380, 300, 50, 'RESTART LEVEL', '#06b6d4', () => {
      this.game.levelManager.loadLevel(this.game.level);
      this.game.setState('PLAYING');
      this.game.input.requestPointerLock();
    });

    this.createButton(ctx, 490, 450, 300, 50, 'LEVEL SELECT', '#3b82f6', () => {
      this.game.setState('LEVEL_SELECT');
    });

    this.createButton(ctx, 490, 520, 300, 50, 'MAIN MENU', '#ef4444', () => {
      this.game.setState('MENU');
    });

    ctx.restore();
  }

  renderLevelSelect(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 10, 19, 0.95)';
    ctx.fillRect(0, 0, 1280, 720);

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 42px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT LEVEL (1 - 20)', 640, 80);

    const cols = 5;
    const cardW = 190;
    const cardH = 90;
    const paddingX = 24;
    const paddingY = 16;
    const startX = (1280 - (cols * cardW + (cols - 1) * paddingX)) / 2;
    const startY = 130;

    for (let i = 0; i < 20; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + paddingX);
      const y = startY + row * (cardH + paddingY);
      const lvlNum = i + 1;

      this.createLevelCard(ctx, x, y, cardW, cardH, lvlNum, () => {
        this.game.score = 0;
        this.game.lives = 3;
        this.game.levelManager.loadLevel(lvlNum);
        this.game.setState('PLAYING');
        this.game.input.requestPointerLock();
      });
    }

    this.createButton(ctx, 490, 620, 300, 48, 'BACK TO MENU', '#64748b', () => {
      this.game.setState('MENU');
    });

    ctx.restore();
  }

  renderGameOver(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 10, 19, 0.9)';
    ctx.fillRect(0, 0, 1280, 720);

    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ef4444';
    ctx.font = 'bold 64px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 640, 240);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "Share Tech Mono", monospace';
    ctx.fillText(`FINAL SCORE: ${String(this.game.score).padStart(6, '0')}`, 640, 310);
    ctx.fillText(`REACHED LEVEL: ${this.game.level}`, 640, 350);

    this.createButton(ctx, 490, 430, 300, 52, 'TRY AGAIN', '#06b6d4', () => {
      this.game.score = 0;
      this.game.lives = 3;
      this.game.levelManager.loadLevel(this.game.level);
      this.game.setState('PLAYING');
      this.game.input.requestPointerLock();
    });

    this.createButton(ctx, 490, 500, 300, 52, 'MAIN MENU', '#64748b', () => {
      this.game.setState('MENU');
    });

    ctx.restore();
  }

  renderVictory(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 10, 19, 0.92)';
    ctx.fillRect(0, 0, 1280, 720);

    ctx.fillStyle = '#10b981';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#10b981';
    ctx.font = 'bold 58px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY! ALL LEVELS CLEARED!', 640, 230);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px "Share Tech Mono", monospace';
    ctx.fillText(`TOTAL SCORE: ${String(this.game.score).padStart(6, '0')}`, 640, 310);

    this.createButton(ctx, 490, 420, 300, 54, 'PLAY AGAIN', '#10b981', () => {
      this.game.score = 0;
      this.game.lives = 3;
      this.game.levelManager.loadLevel(1);
      this.game.setState('PLAYING');
      this.game.input.requestPointerLock();
    });

    this.createButton(ctx, 490, 490, 300, 54, 'MAIN MENU', '#64748b', () => {
      this.game.setState('MENU');
    });

    ctx.restore();
  }

  createButton(ctx, x, y, width, height, text, color, onClick) {
    const btnObj = { x, y, width, height, onClick, isHovered: false };
    this.buttons.push(btnObj);

    ctx.save();
    if (btnObj.isHovered) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
    } else {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = btnObj.isHovered ? '#070a13' : '#ffffff';
    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2);

    ctx.restore();
  }

  createLevelCard(ctx, x, y, width, height, levelNum, onClick) {
    const btnObj = { x, y, width, height, onClick, isHovered: false };
    this.buttons.push(btnObj);

    ctx.save();
    const isHovered = btnObj.isHovered;
    ctx.fillStyle = isHovered ? '#06b6d4' : 'rgba(30, 41, 59, 0.7)';
    ctx.strokeStyle = isHovered ? '#ffffff' : '#334155';
    ctx.lineWidth = isHovered ? 2 : 1;

    if (isHovered) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#06b6d4';
    }

    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isHovered ? '#070a13' : '#ffffff';
    ctx.font = 'bold 20px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${levelNum}`, x + width / 2, y + height / 2);

    ctx.restore();
  }
}
