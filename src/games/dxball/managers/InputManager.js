/**
 * DX-Ball Input Manager
 * Tracks Keyboard, Mouse states, and HTML5 Pointer Lock API.
 */
export class InputManager {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;

    this.keys = {
      left: false,
      right: false,
      space: false,
      escape: false
    };

    this.mouse = {
      x: renderer ? renderer.virtualWidth / 2 : 640,
      y: renderer ? renderer.virtualHeight - 50 : 670,
      isDown: false,
      isMoved: false,
      isPointerLocked: false
    };

    this.onPointerLockChangeCallback = null;
    this.onWindowBlurCallback = null;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onPointerLockError = this._onPointerLockError.bind(this);
    this._onWindowBlur = this._onWindowBlur.bind(this);

    this.attachListeners();
  }

  attachListeners() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('blur', this._onWindowBlur);

    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('pointerlockerror', this._onPointerLockError);
  }

  detachListeners() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('blur', this._onWindowBlur);

    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('pointerlockerror', this._onPointerLockError);

    this.exitPointerLock();
  }

  requestPointerLock() {
    if (!this.canvas) return;
    if (document.pointerLockElement === this.canvas) return;

    try {
      const lockPromise = this.canvas.requestPointerLock();
      if (lockPromise && typeof lockPromise.catch === 'function') {
        lockPromise.catch(err => console.warn('[InputManager] Pointer lock request rejected:', err));
      }
    } catch (e) {
      console.warn('[InputManager] Pointer lock error:', e);
    }
  }

  exitPointerLock() {
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch (e) {
        console.warn('[InputManager] Pointer lock exit error:', e);
      }
    }
  }

  _onPointerLockChange() {
    const isLocked = document.pointerLockElement === this.canvas;
    this.mouse.isPointerLocked = isLocked;

    if (this.onPointerLockChangeCallback) {
      this.onPointerLockChangeCallback(isLocked);
    }
  }

  _onPointerLockError(err) {
    console.warn('[InputManager] Pointer lock error:', err);
    this.mouse.isPointerLocked = false;
  }

  _onWindowBlur() {
    if (this.onWindowBlurCallback) {
      this.onWindowBlurCallback();
    }
  }

  _onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keys.right = true;
    }
    if (e.key === ' ' || e.code === 'Space') {
      this.keys.space = true;
    }
    if (e.key === 'Escape') {
      this.keys.escape = true;
    }
  }

  _onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keys.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keys.right = false;
    }
    if (e.key === ' ' || e.code === 'Space') {
      this.keys.space = false;
    }
    if (e.key === 'Escape') {
      this.keys.escape = false;
    }
  }

  _onMouseMove(e) {
    if (!this.renderer) return;

    if (document.pointerLockElement === this.canvas) {
      // Relative movement delta via Pointer Lock API
      const scale = this.renderer.scale || 1;
      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      const deltaX = movementX / scale;
      const deltaY = movementY / scale;

      this.mouse.x = Math.max(0, Math.min(this.renderer.virtualWidth, this.mouse.x + deltaX));
      this.mouse.y = Math.max(0, Math.min(this.renderer.virtualHeight, this.mouse.y + deltaY));
      this.mouse.isMoved = true;
    } else {
      // Standard screen coordinate mapping for menu UI
      const coords = this.renderer.screenToCanvasCoords(e.clientX, e.clientY);
      this.mouse.x = coords.x;
      this.mouse.y = coords.y;
      this.mouse.isMoved = true;
    }
  }

  _onMouseDown(e) {
    if (e.button === 0) {
      this.mouse.isDown = true;
    }
  }

  _onMouseUp(e) {
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
  }

  resetActionFlags() {
    this.mouse.isMoved = false;
  }
}
