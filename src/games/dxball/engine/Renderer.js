/**
 * DX-Ball Renderer Engine
 * Handles responsive scaling, fixed aspect ratio (1280x720), clearing, and drawing.
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.virtualWidth = 1280;
    this.virtualHeight = 720;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.resize();
  }

  resize() {
    if (!this.canvas || !this.canvas.parentElement) return;

    const rect = this.canvas.getBoundingClientRect();
    const borderLeft = this.canvas.clientLeft || 0;
    const borderTop = this.canvas.clientTop || 0;

    const displayWidth = Math.max(100, (rect.width - borderLeft * 2) || this.canvas.parentElement.clientWidth || window.innerWidth);
    const displayHeight = Math.max(100, (rect.height - borderTop * 2) || this.canvas.parentElement.clientHeight || window.innerHeight);

    // High DPI / Device Pixel Ratio support
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;

    // Calculate scale factor maintaining 16:9 aspect ratio
    const scaleX = displayWidth / this.virtualWidth;
    const scaleY = displayHeight / this.virtualHeight;
    this.scale = Math.min(scaleX, scaleY);

    this.offsetX = (displayWidth - this.virtualWidth * this.scale) / 2;
    this.offsetY = (displayHeight - this.virtualHeight * this.scale) / 2;
  }

  clear() {
    this.ctx.save();
    // Reset transform for full clearing
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#070a13';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  beginFrame() {
    this.clear();
    this.ctx.save();

    const dpr = window.devicePixelRatio || 1;
    this.ctx.scale(dpr, dpr);
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    // Draw game viewport boundary box
    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.virtualWidth, this.virtualHeight);
  }

  endFrame() {
    this.ctx.restore();
  }

  /**
   * Helper to convert screen mouse coordinates to internal 1280x720 canvas space
   */
  screenToCanvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const borderLeft = this.canvas.clientLeft || 0;
    const borderTop = this.canvas.clientTop || 0;

    const displayWidth = rect.width - borderLeft * 2;
    const displayHeight = rect.height - borderTop * 2;

    const scale = Math.min(displayWidth / this.virtualWidth, displayHeight / this.virtualHeight);
    const offsetX = (displayWidth - this.virtualWidth * scale) / 2;
    const offsetY = (displayHeight - this.virtualHeight * scale) / 2;

    const xRelativeToCanvas = clientX - rect.left - borderLeft;
    const yRelativeToCanvas = clientY - rect.top - borderTop;

    const canvasX = (xRelativeToCanvas - offsetX) / scale;
    const canvasY = (yRelativeToCanvas - offsetY) / scale;

    return {
      x: Math.max(0, Math.min(this.virtualWidth, canvasX)),
      y: Math.max(0, Math.min(this.virtualHeight, canvasY))
    };
  }
}
