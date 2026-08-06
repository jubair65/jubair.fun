import './style.css';
import { dxBallModule } from './games/dxball/DXBallModule.js';

// ==========================================
// PHYSICALLY MODELED PARTICLE SYSTEM
// ==========================================
class Particle {
  constructor(x, y, color, isConfetti = false) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 1.0;
    this.isConfetti = isConfetti;

    if (isConfetti) {
      // Confetti shoots out in all directions at high velocities
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 4;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = Math.random() * 5 + 4;
      this.decay = Math.random() * 0.015 + 0.008;
    } else {
      // Trail sparks are slow drift particles
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = (Math.random() - 0.5) * 3;
      this.size = Math.random() * 3 + 2;
      this.decay = Math.random() * 0.04 + 0.02;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;

    if (this.isConfetti) {
      this.vy += 0.15; // heavier gravity for confetti fall
      this.vx *= 0.98; // air drag
    } else {
      this.vy += 0.04; // slight float gravity
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ==========================================
// SYNTHESIZED WEB AUDIO ENGINE
// ==========================================
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.drawOsc = null;
    this.drawGain = null;
    this.drawFilter = null;
    this.enabled = localStorage.getItem('sound_enabled') !== 'false';
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
  }

  toggle(forceState) {
    this.enabled = forceState !== undefined ? forceState : !this.enabled;
    localStorage.setItem('sound_enabled', this.enabled);
    if (!this.enabled && this.ctx) {
      this.stopDrawSound();
    }
    return this.enabled;
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  startDrawSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    this.stopDrawSound();

    this.drawOsc = this.ctx.createOscillator();
    this.drawGain = this.ctx.createGain();
    this.drawFilter = this.ctx.createBiquadFilter();

    this.drawOsc.type = 'triangle';
    this.drawOsc.frequency.setValueAtTime(160, this.ctx.currentTime);

    this.drawFilter.type = 'lowpass';
    this.drawFilter.frequency.setValueAtTime(300, this.ctx.currentTime);

    this.drawGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.drawGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);

    this.drawOsc.connect(this.drawFilter);
    this.drawFilter.connect(this.drawGain);
    this.drawGain.connect(this.ctx.destination);

    this.drawOsc.start();
  }

  updateDrawSound(speed) {
    if (!this.enabled || !this.ctx || !this.drawOsc) return;

    const baseFreq = 130;
    const targetFreq = baseFreq + Math.min(220, speed * 0.16);
    const filterFreq = 200 + Math.min(450, speed * 0.35);

    this.drawOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.04);
    this.drawFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.04);
  }

  stopDrawSound() {
    if (!this.drawOsc) return;

    const osc = this.drawOsc;
    const gain = this.drawGain;
    this.drawOsc = null;
    this.drawGain = null;
    this.drawFilter = null;

    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        gain.gain.cancelScheduledValues(this.ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.stop(this.ctx.currentTime + 0.1);
      } catch (e) {
        osc.stop();
      }
    }
  }

  playSuccess(isHighScore) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Glowing golden C-major pentatonic arpeggio for high scores
    const scale = isHighScore
      ? [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50] // C4, E4, G4, C5, E5, G5, C6
      : [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

    scale.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * (isHighScore ? 0.06 : 0.08);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.07, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.9);
    });
  }

  playFail() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(100, now);
    osc1.frequency.linearRampToValueAtTime(65, now + 0.45);
    osc2.frequency.setValueAtTime(98, now);
    osc2.frequency.linearRampToValueAtTime(63, now + 0.45);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  playPaddleBounce() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playBrickHit(isHard = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isHard ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isHard ? 180 : 380, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isHard ? 80 : 150, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playMetalClang() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(815, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.16);
    osc2.stop(this.ctx.currentTime + 0.16);
  }

  playPowerUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [330, 440, 550, 660, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.3);
    });
  }
}

// Global Sound Instance shared across games
const globalSound = new SoundSynth();

// ==========================================
// CORE GAME: PERFECT CIRCLE
// ==========================================
class CirclifyGame {
  constructor() {
    this.canvas = document.getElementById('paint-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.sound = globalSound;
    this.gameState = 'idle'; // 'idle', 'drawing', 'results'
    this.points = [];
    this.particles = [];
    this.bestScore = parseFloat(localStorage.getItem('circlify_best_score')) || 0;
    this.loopActive = false;
    
    // Centroid geometry
    this.centroid = { x: 0, y: 0 };
    this.meanRadius = 0;
    
    // HTML Elements Cache
    this.scoreContainer = document.getElementById('score-container');
    this.scoreNum = document.getElementById('score-num');
    this.scoreStatus = document.getElementById('score-status');
    this.bestScoreDisplay = document.getElementById('best-score-val');
    this.resetHint = document.getElementById('reset-hint');
    this.instruction = document.getElementById('game-title');
    this.resetBestBtn = document.getElementById('reset-best-btn');
    
    this.toastTimeout = null;
    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      if (this.loopActive) this.resizeCanvas();
    });

    this.setupSoundButton();
    this.setupResetBestButton();

    // Display best score
    this.bestScoreDisplay.textContent = this.bestScore.toFixed(1) + '%';

    // Event Listeners (Pointer Events)
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', () => this.onPointerUp());
    this.canvas.addEventListener('pointercancel', () => this.onPointerUp());
  }

  resumeGameLoop() {
    this.loopActive = true;
    this.resetGame();
    this.resizeCanvas();
    requestAnimationFrame(() => this.tick());
  }

  pauseGameLoop() {
    this.loopActive = false;
    this.sound.stopDrawSound();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.ctx.resetTransform();
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  setupSoundButton() {
    const soundToggle = document.getElementById('sound-toggle');
    const updateSoundIcons = (enabled) => {
      const iconOn = document.querySelector('#page-circle .icon-sound-on');
      const iconOff = document.querySelector('#page-circle .icon-sound-off');
      if (enabled) {
        iconOn.classList.remove('hidden');
        iconOff.classList.add('hidden');
      } else {
        iconOn.classList.add('hidden');
        iconOff.classList.remove('hidden');
      }
    };
    
    updateSoundIcons(this.sound.enabled);
    
    soundToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const state = this.sound.toggle();
      updateSoundIcons(state);
      this.sound.playClick();
    });
  }

  setupResetBestButton() {
    this.resetBestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.sound.playClick();
      
      this.bestScore = 0;
      localStorage.removeItem('circlify_best_score');
      this.bestScoreDisplay.textContent = '0.0%';
      this.showToast("High score reset!");
    });
  }

  showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastText = document.getElementById('toast-text');
    toastText.textContent = message;
    toast.classList.remove('hidden');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2200);
  }

  getCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  onPointerDown(e) {
    if (!this.loopActive) return;
    e.preventDefault();
    
    // Clear results state if tapping to start drawing a new one
    if (this.gameState === 'results') {
      this.resetGame();
    }

    this.gameState = 'drawing';
    this.points = [];
    this.particles = [];
    this.centroid = { x: 0, y: 0 };
    
    // Hide instructions and previous scores
    this.instruction.style.opacity = '0';
    this.scoreContainer.classList.add('hidden');
    this.scoreContainer.classList.remove('high-score-animation');
    this.scoreStatus.classList.remove('show');
    this.resetHint.classList.add('hidden');
    
    const coord = this.getCoords(e);
    this.points.push({
      x: coord.x,
      y: coord.y,
      t: Date.now()
    });

    this.sound.startDrawSound();
  }

  onPointerMove(e) {
    if (this.gameState !== 'drawing') return;
    e.preventDefault();

    const coord = this.getCoords(e);
    const lastPoint = this.points[this.points.length - 1];

    if (lastPoint && lastPoint.x === coord.x && lastPoint.y === coord.y) return;

    const now = Date.now();
    this.points.push({
      x: coord.x,
      y: coord.y,
      t: now
    });

    // Pitch modulation based on drawing speed
    if (lastPoint) {
      const dist = Math.hypot(coord.x - lastPoint.x, coord.y - lastPoint.y);
      const timeDiff = Math.max(1, now - lastPoint.t);
      const velocity = (dist / timeDiff) * 1000; // pixels per second
      this.sound.updateDrawSound(velocity);
    }

    // Add trail sparks
    this.particles.push(new Particle(coord.x, coord.y, '#39ff14'));
    if (this.particles.length > 80) this.particles.shift();

    // Calculate dynamic running score during draw
    if (this.points.length >= 15) {
      this.calculateRunningAccuracy();
    }
  }

  onPointerUp() {
    if (this.gameState !== 'drawing') return;

    this.sound.stopDrawSound();
    
    if (this.points.length < 15) {
      this.showToast("Draw longer to register!");
      this.resetGame();
      return;
    }

    this.evaluateFinalResult();
  }

  resetGame() {
    this.gameState = 'idle';
    this.points = [];
    this.particles = [];
    this.instruction.style.opacity = '1';
    this.scoreContainer.classList.add('hidden');
    this.scoreStatus.classList.remove('show');
    this.scoreContainer.classList.remove('high-score-animation');
  }

  calculateRunningAccuracy() {
    const N = this.points.length;
    
    let sumX = 0, sumY = 0;
    this.points.forEach(pt => {
      sumX += pt.x;
      sumY += pt.y;
    });
    const cx = sumX / N;
    const cy = sumY / N;

    const radii = this.points.map(pt => Math.hypot(pt.x - cx, pt.y - cy));
    const meanRadius = radii.reduce((sum, r) => sum + r, 0) / N;

    if (meanRadius < 20) return;

    const variance = radii.reduce((sum, r) => sum + Math.pow(r - meanRadius, 2), 0) / N;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / meanRadius;

    const circularity = Math.max(0, 1 - 2.2 * cv);
    const percentage = circularity * 100;

    this.centroid = { x: cx, y: cy };
    this.meanRadius = meanRadius;
    
    this.scoreContainer.style.left = `${cx}px`;
    this.scoreContainer.style.top = `${cy}px`;
    this.scoreNum.textContent = percentage.toFixed(1);
    
    this.scoreContainer.classList.remove('hidden');
  }

  evaluateFinalResult() {
    const N = this.points.length;
    const cx = this.centroid.x;
    const cy = this.centroid.y;

    // Angular Sweep Check (Minimum 275 degrees loop sweep)
    let totalAngle = 0;
    let lastTheta = Math.atan2(this.points[0].y - cy, this.points[0].x - cx);
    
    for (let i = 1; i < N; i++) {
      const theta = Math.atan2(this.points[i].y - cy, this.points[i].x - cx);
      let diff = theta - lastTheta;
      
      if (diff > Math.PI) diff -= 2 * Math.PI;
      else if (diff < -Math.PI) diff += 2 * Math.PI;
      
      totalAngle += diff;
      lastTheta = theta;
    }

    const rotationLimit = 4.8;
    if (Math.abs(totalAngle) < rotationLimit) {
      this.showToast("Draw a complete loop!");
      this.resetGame();
      return;
    }

    // Loop Closure Factor
    const pStart = this.points[0];
    const pEnd = this.points[N - 1];
    const closureDist = Math.hypot(pStart.x - pEnd.x, pStart.y - pEnd.y);
    const closureFactor = Math.max(0, 1 - 1.4 * (closureDist / this.meanRadius));

    const radii = this.points.map(pt => Math.hypot(pt.x - cx, pt.y - cy));
    const meanRadius = radii.reduce((sum, r) => sum + r, 0) / N;
    const variance = radii.reduce((sum, r) => sum + Math.pow(r - meanRadius, 2), 0) / N;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / meanRadius;
    
    const circularity = Math.max(0, 1 - 2.2 * cv);
    
    let finalScore = circularity * closureFactor * 100;
    if (finalScore > 100) finalScore = 100;
    if (finalScore < 0) finalScore = 0;

    // Update UI Results
    this.gameState = 'results';
    this.scoreNum.textContent = finalScore.toFixed(1);
    this.resetHint.classList.remove('hidden');

    const isHighScore = finalScore > this.bestScore && finalScore > 0;

    if (isHighScore) {
      this.bestScore = finalScore;
      localStorage.setItem('circlify_best_score', finalScore);
      this.bestScoreDisplay.textContent = finalScore.toFixed(1) + '%';
      
      this.scoreStatus.textContent = "NEW BEST!";
      this.scoreStatus.classList.add('show');
      this.scoreContainer.classList.add('high-score-animation');
      this.sound.playSuccess(true);
      
      this.triggerConfetti(180);
    } else {
      this.scoreStatus.textContent = finalScore >= 90 ? "EXCELLENT!" : finalScore >= 75 ? "GREAT JOB!" : "KEEP PRACTICING";
      this.scoreStatus.classList.add('show');
      this.sound.playSuccess(false);
      this.triggerConfetti(50);
    }
  }

  triggerConfetti(count) {
    const cx = this.centroid.x;
    const cy = this.centroid.y;
    const colors = ['#39ff14', '#00ff87', '#adff2f', '#ffffff', '#ffd700'];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle(cx, cy, color, true));
    }
  }

  tick() {
    if (!this.loopActive) return;

    // Clear canvas frame
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    const N = this.points.length;

    // 1. Draw ideal reference guide & spoke rays in Results state
    if (this.gameState === 'results' && N > 1) {
      const cx = this.centroid.x;
      const cy = this.centroid.y;
      const r = this.meanRadius;

      // Draw 16 radial division spokes
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(57, 255, 20, 0.08)';
      this.ctx.lineWidth = 1.5;
      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8;
        const targetX = cx + Math.cos(angle) * r;
        const targetY = cy + Math.sin(angle) * r;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(targetX, targetY);
        this.ctx.stroke();
      }
      this.ctx.restore();

      // Draw perfect reference circle outline
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(57, 255, 20, 0.25)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();

      // Draw deviation offsets in red
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 8, 68, 0.35)';
      this.ctx.lineWidth = 1;
      this.points.forEach(pt => {
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return;

        const perfectX = cx + (dx / dist) * r;
        const perfectY = cy + (dy / dist) * r;

        this.ctx.beginPath();
        this.ctx.moveTo(perfectX, perfectY);
        this.ctx.lineTo(pt.x, pt.y);
        this.ctx.stroke();
      });
      this.ctx.restore();
    }

    // 2. Draw active user path trace
    if (N > 1) {
      this.ctx.save();
      this.ctx.strokeStyle = '#39ff14';
      this.ctx.lineWidth = 6;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      this.ctx.shadowColor = 'rgba(57, 255, 20, 0.5)';
      this.ctx.shadowBlur = 12;

      this.ctx.beginPath();
      this.ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < N; i++) {
        this.ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      } else {
        p.draw(this.ctx);
      }
    }

    requestAnimationFrame(() => this.tick());
  }
}

// ==========================================
// SPA MULTI-GAME ROUTER
// ==========================================
class AppRouter {
  constructor() {
    this.game = new CirclifyGame();
    this.lifeStatsInterval = null;
    this.cascadeInterval = null;
    this.synthOsc = null;
    this.synthGain = null;
    this.synthAnimId = null;
    this.patternLoopId = null;

    window.addEventListener('hashchange', () => this.routePage());
    this.routePage();
  }

  routePage() {
    const hash = window.location.hash || '#home';
    let activePageId = 'page-home';

    if (hash === '#circle') activePageId = 'page-circle';
    else if (hash === '#life-stats') activePageId = 'page-life-stats';
    else if (hash === '#color-cascade') activePageId = 'page-color-cascade';
    else if (hash === '#soundwave-synth') activePageId = 'page-soundwave-synth';
    else if (hash === '#pattern-generator') activePageId = 'page-pattern-generator';
    else if (hash === '#dxball') activePageId = 'page-dxball';

    // Toggle hidden classes across sections
    document.querySelectorAll('.spa-page').forEach(page => {
      if (page.id === activePageId) {
        page.classList.remove('hidden');
      } else {
        page.classList.add('hidden');
      }
    });

    // Cleanup active threads
    this.cleanupActiveStates();

    // Trigger page hooks
    if (activePageId === 'page-circle') {
      this.game.resumeGameLoop();
    } else if (activePageId === 'page-life-stats') {
      this.startLifeStats();
    } else if (activePageId === 'page-color-cascade') {
      this.startColorCascade();
    } else if (activePageId === 'page-soundwave-synth') {
      this.startSoundwaveSynth();
    } else if (activePageId === 'page-pattern-generator') {
      this.startPatternGenerator();
    } else if (activePageId === 'page-dxball') {
      dxBallModule.init('#dxball-canvas');
    }
  }

  cleanupActiveStates() {
    this.game.pauseGameLoop();
    dxBallModule.destroy();

    if (this.lifeStatsInterval) {
      clearInterval(this.lifeStatsInterval);
      this.lifeStatsInterval = null;
    }

    if (this.cascadeInterval) {
      clearInterval(this.cascadeInterval);
      this.cascadeInterval = null;
    }

    if (this.synthOsc) {
      try { this.synthOsc.stop(); } catch (e) {}
      this.synthOsc = null;
    }
    if (this.synthAnimId) {
      cancelAnimationFrame(this.synthAnimId);
      this.synthAnimId = null;
    }

    if (this.patternLoopId) {
      cancelAnimationFrame(this.patternLoopId);
      this.patternLoopId = null;
    }
  }

  // ==========================================
  // LIFE STATS LOGIC
  // ==========================================
  startLifeStats() {
    const inputCard = document.getElementById('stats-input-card');
    const dashboard = document.getElementById('stats-dashboard');
    const birthInput = document.getElementById('birthdate-input');
    const calcBtn = document.getElementById('calculate-stats-btn');
    const displayDate = document.getElementById('birthdate-display');
    const reenterBtn = document.getElementById('stats-reenter-btn');

    // Set max date selector limit to today
    const today = new Date().toISOString().split('T')[0];
    birthInput.max = today;

    // Load saved birthdate
    const savedDate = localStorage.getItem('user_birthdate');
    if (savedDate) {
      birthInput.value = savedDate;
      this.runTickingStats(new Date(savedDate));
      inputCard.classList.add('hidden');
      dashboard.classList.remove('hidden');
    } else {
      inputCard.classList.remove('hidden');
      dashboard.classList.add('hidden');
    }

    calcBtn.onclick = () => {
      if (!birthInput.value) return;
      globalSound.playSuccess(true);
      
      const bdate = birthInput.value;
      localStorage.setItem('user_birthdate', bdate);
      this.runTickingStats(new Date(bdate));

      inputCard.classList.add('hidden');
      dashboard.classList.remove('hidden');
    };

    reenterBtn.onclick = () => {
      globalSound.playClick();
      localStorage.removeItem('user_birthdate');
      if (this.lifeStatsInterval) {
        clearInterval(this.lifeStatsInterval);
        this.lifeStatsInterval = null;
      }
      inputCard.classList.remove('hidden');
      dashboard.classList.add('hidden');
    };
  }

  runTickingStats(birthDate) {
    const heartbeatsText = document.getElementById('stat-heartbeats');
    const breathsText = document.getElementById('stat-breaths');
    const sleepText = document.getElementById('stat-sleep');
    const earthText = document.getElementById('stat-earth-travel');
    const popText = document.getElementById('stat-population');
    const tectonicText = document.getElementById('stat-tectonic');
    const displayDate = document.getElementById('birthdate-display');

    // Format birthdate header
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    displayDate.textContent = birthDate.toLocaleDateString(undefined, options);

    if (this.lifeStatsInterval) clearInterval(this.lifeStatsInterval);

    this.lifeStatsInterval = setInterval(() => {
      const diffMs = Date.now() - birthDate.getTime();
      const diffSecs = diffMs / 1000;
      const years = diffSecs / (365.25 * 24 * 60 * 60);

      // Calculations based on biological averages
      const heartbeats = diffSecs * (80 / 60);  // avg 80 bpm
      const breaths = diffSecs * (16 / 60);     // avg 16 breaths per min
      const sleepHours = (diffSecs / 3600) * (8 / 24); // avg 8 hours per day
      const earthTravelKm = (diffSecs / 3600) * 107000; // orbits at 107,000 km/h
      const popGrowth = years * 80000000;       // pop growth avg 80M per year
      const tectonicDriftCm = years * 3.0;      // avg plate drift 3cm per year

      heartbeatsText.textContent = Math.floor(heartbeats).toLocaleString();
      breathsText.textContent = Math.floor(breaths).toLocaleString();
      sleepText.textContent = Math.floor(sleepHours).toLocaleString();
      earthText.textContent = Math.floor(earthTravelKm).toLocaleString();
      popText.textContent = Math.floor(popGrowth).toLocaleString();
      tectonicText.textContent = tectonicDriftCm.toFixed(6);
    }, 100);
  }

  // ==========================================
  // COLOR CASCADE ENGINE
  // ==========================================
  startColorCascade() {
    const canvas = document.getElementById('cascade-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth || 800;
    canvas.height = canvas.offsetHeight || 400;

    let particles = [];
    let barriers = [];
    let colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    let paletteIndex = 0;
    
    let drawing = false;
    let currentBarrier = null;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    canvas.onmousedown = canvas.ontouchstart = (e) => {
      e.preventDefault();
      drawing = true;
      currentBarrier = [getPos(e)];
    };

    canvas.onmousemove = canvas.ontouchmove = (e) => {
      if (!drawing || !currentBarrier) return;
      currentBarrier.push(getPos(e));
    };

    canvas.onmouseup = canvas.ontouchend = () => {
      if (drawing && currentBarrier && currentBarrier.length > 1) {
        barriers.push(currentBarrier);
      }
      drawing = false;
      currentBarrier = null;
    };

    document.getElementById('clear-cascade-btn').onclick = () => {
      barriers = [];
      particles = [];
      globalSound.playClick();
    };

    document.getElementById('mode-cascade-btn').onclick = () => {
      paletteIndex = (paletteIndex + 1) % 3;
      if (paletteIndex === 0) {
        colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      } else if (paletteIndex === 1) {
        colors = ['#f472b6', '#db2777', '#9d174d', '#fda4af', '#f43f5e'];
      } else {
        colors = ['#06b6d4', '#0891b2', '#0e7490', '#22d3ee', '#67e8f9'];
      }
      globalSound.playPop();
    };

    const dist2 = (v, w) => (v.x - w.x)*(v.x - w.x) + (v.y - w.y)*(v.y - w.y);
    const distToSegment = (p, v, w) => {
      const l2 = dist2(v, w);
      if (l2 === 0) return dist2(p, v);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.sqrt(dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
    };

    if (this.cascadeInterval) clearInterval(this.cascadeInterval);
    this.cascadeInterval = setInterval(() => {
      if (particles.length < 180) {
        particles.push({
          x: Math.random() * canvas.width,
          y: 0,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3 + 2.5
        });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      barriers.forEach(b => {
        ctx.beginPath();
        ctx.moveTo(b[0].x, b[0].y);
        for (let i = 1; i < b.length; i++) {
          ctx.lineTo(b[i].x, b[i].y);
        }
        ctx.stroke();
      });

      if (currentBarrier && currentBarrier.length > 1) {
        ctx.strokeStyle = 'rgba(24, 24, 27, 0.4)';
        ctx.beginPath();
        ctx.moveTo(currentBarrier[0].x, currentBarrier[0].y);
        for (let i = 1; i < currentBarrier.length; i++) {
          ctx.lineTo(currentBarrier[i].x, currentBarrier[i].y);
        }
        ctx.stroke();
      }

      particles.forEach((p) => {
        p.vy += 0.08;
        p.x += p.vx;
        p.y += p.vy;

        barriers.forEach(b => {
          for (let i = 0; i < b.length - 1; i++) {
            const dist = distToSegment(p, b[i], b[i+1]);
            if (dist < p.size + 2) {
              const dx = b[i+1].x - b[i].x;
              const dy = b[i+1].y - b[i].y;
              const len = Math.sqrt(dx*dx + dy*dy);
              const nx = -dy / len;
              const ny = dx / len;

              const dot = p.vx*nx + p.vy*ny;
              p.vx = (p.vx - 2*dot*nx) * 0.6;
              p.vy = (p.vy - 2*dot*ny) * 0.6;

              p.x += nx * 4;
              p.y += ny * 4;

              if (Math.random() < 0.01) {
                globalSound.playClick();
              }
            }
          }
        });

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      particles = particles.filter(p => p.y < canvas.height && p.x > 0 && p.x < canvas.width);
    }, 1000 / 60);
  }

  // ==========================================
  // SOUNDWAVE SYNTH ENGINE
  // ==========================================
  startSoundwaveSynth() {
    const canvas = document.getElementById('synth-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 800;
    canvas.height = canvas.offsetHeight || 400;

    let active = false;
    let freq = 220;
    let gainVal = 0;
    let type = 'sine';

    const btn = document.getElementById('type-synth-btn');
    btn.textContent = `Oscillator: ${type.toUpperCase()}`;
    btn.onclick = () => {
      const types = ['sine', 'square', 'sawtooth', 'triangle'];
      const nextIdx = (types.indexOf(type) + 1) % types.length;
      type = types[nextIdx];
      btn.textContent = `Oscillator: ${type.toUpperCase()}`;
      globalSound.playClick();
    };

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) / rect.width,
        y: 1.0 - (clientY - rect.top) / rect.height
      };
    };

    const playSynth = () => {
      globalSound.init();
      if (!globalSound.ctx) return;
      this.synthOsc = globalSound.ctx.createOscillator();
      this.synthGain = globalSound.ctx.createGain();
      this.synthOsc.type = type;
      this.synthOsc.frequency.setValueAtTime(freq, globalSound.ctx.currentTime);
      this.synthGain.gain.setValueAtTime(0, globalSound.ctx.currentTime);
      
      this.synthOsc.connect(this.synthGain);
      this.synthGain.connect(globalSound.ctx.destination);
      this.synthOsc.start();
    };

    const updateSynth = (pos) => {
      freq = 110 + pos.x * 880;
      gainVal = pos.y * 0.15;

      if (this.synthOsc && globalSound.ctx) {
        this.synthOsc.frequency.setTargetAtTime(freq, globalSound.ctx.currentTime, 0.04);
        this.synthGain.gain.setTargetAtTime(gainVal, globalSound.ctx.currentTime, 0.04);
      }
    };

    const stopSynth = () => {
      if (this.synthOsc) {
        try {
          this.synthGain.gain.cancelScheduledValues(globalSound.ctx.currentTime);
          this.synthGain.gain.setValueAtTime(this.synthGain.gain.value, globalSound.ctx.currentTime);
          this.synthGain.gain.exponentialRampToValueAtTime(0.001, globalSound.ctx.currentTime + 0.15);
          const osc = this.synthOsc;
          this.synthOsc = null;
          setTimeout(() => {
            try { osc.stop(); } catch(err) {}
          }, 200);
        } catch(e) {}
      }
    };

    canvas.onmousedown = canvas.ontouchstart = (e) => {
      e.preventDefault();
      active = true;
      const pos = getPos(e);
      playSynth();
      updateSynth(pos);
    };

    canvas.onmousemove = canvas.ontouchmove = (e) => {
      if (!active) return;
      updateSynth(getPos(e));
    };

    canvas.onmouseup = canvas.ontouchend = canvas.onmouseleave = () => {
      if (active) {
        active = false;
        stopSynth();
      }
    };

    let frame = 0;
    const draw = () => {
      if (window.location.hash !== '#soundwave-synth') return;
      this.synthAnimId = requestAnimationFrame(draw);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = active ? '#8b5cf6' : '#94a3b8';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const waveAmp = active ? gainVal * 300 : 15;
      const waveFreq = active ? freq / 100 : 2.5;

      ctx.moveTo(0, canvas.height / 2);
      for (let i = 0; i < canvas.width; i += 2) {
        const yOffset = Math.sin(i * 0.015 * waveFreq + frame * 0.12) * waveAmp;
        ctx.lineTo(i, canvas.height / 2 + yOffset);
      }
      ctx.stroke();
      frame++;
    };
    draw();
  }






  // ==========================================
  // PATTERN GENERATOR ENGINE
  // ==========================================
  startPatternGenerator() {
    const canvas = document.getElementById('pattern-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 800;
    canvas.height = canvas.offsetHeight || 400;

    let patternType = 0;
    let angle = 0;

    document.getElementById('type-pattern-btn').onclick = () => {
      patternType = (patternType + 1) % 3;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      globalSound.playClick();
    };

    document.getElementById('clear-pattern-btn').onclick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      globalSound.playPop();
    };

    const loop = () => {
      if (window.location.hash !== '#pattern-generator') return;
      this.patternLoopId = requestAnimationFrame(loop);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      if (patternType === 0) {
        ctx.rotate(angle);
        ctx.strokeStyle = `hsl(${(angle * 180 / Math.PI) % 360}, 85%, 60%)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(80, 0, 45, 0, Math.PI * 2);
        ctx.stroke();
        angle += 0.02;
      } else if (patternType === 1) {
        const pulse = Math.sin(angle) * 60 + 100;
        ctx.strokeStyle = `hsl(${(angle * 60) % 360}, 80%, 55%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const x = Math.cos(i * Math.PI / 3) * pulse;
          const y = Math.sin(i * Math.PI / 3) * pulse;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        angle += 0.015;
      } else {
        ctx.rotate(angle);
        const dist = Math.sin(angle * 2.5) * 140 + 30;
        ctx.fillStyle = `hsl(${(angle * 100) % 360}, 90%, 58%)`;
        ctx.beginPath();
        ctx.arc(dist, 0, 6 + Math.cos(angle)*3, 0, Math.PI*2);
        ctx.fill();
        angle += 0.035;
      }
      ctx.restore();
    };
    loop();
  }
}

// Instantiate SPA Router on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  new AppRouter();
});
