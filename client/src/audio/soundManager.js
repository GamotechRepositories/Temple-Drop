class SoundManager {
  constructor() {
    this.ctx = null;
    this.soundEnabled = false;
    this.musicEnabled = false;
    this.isMusicPlaying = false;
    this.bgAudio = null;
    this.bgBuffer = null;
    this.bgBufferLoading = false;
    this.bgSource = null;
    this.bgGain = null;
    this.bgLoopStart = 0;
    this.bgLoopEnd = 0;
    this.lastPegHitTime = 0;
  }

  initBgAudio() {
    if (typeof window === 'undefined') return;
    if (!this.bgAudio) {
      try {
        this.bgAudio = new Audio('/audio/bg-music.mp3');
        this.bgAudio.loop = true;
        this.bgAudio.volume = 0.22;
        this.bgAudio.preload = 'metadata';
      } catch {}
    }
  }

  computeTrimmedLoopBounds(buffer) {
    const threshold = 0.002;
    const sampleRate = buffer.sampleRate;
    const len = buffer.length;
    let startSample = 0;
    let endSample = len;

    // Scan channels for leading & trailing MP3 encoder silence so loop is gapless
    for (let i = 0; i < len; i += 1) {
      let nonSilent = false;
      for (let ch = 0; ch < buffer.numberOfChannels; ch += 1) {
        if (Math.abs(buffer.getChannelData(ch)[i]) > threshold) {
          nonSilent = true;
          break;
        }
      }
      if (nonSilent) {
        startSample = i;
        break;
      }
    }

    for (let i = len - 1; i > startSample; i -= 1) {
      let nonSilent = false;
      for (let ch = 0; ch < buffer.numberOfChannels; ch += 1) {
        if (Math.abs(buffer.getChannelData(ch)[i]) > threshold) {
          nonSilent = true;
          break;
        }
      }
      if (nonSilent) {
        endSample = i + 1;
        break;
      }
    }

    return {
      loopStart: startSample / sampleRate,
      loopEnd: Math.max((startSample + 1) / sampleRate, endSample / sampleRate),
    };
  }

  async loadAndStartGaplessBg() {
    if (!this.ctx || !this.musicEnabled) return false;
    if (this.bgSource && this.isMusicPlaying) return true;

    if (!this.bgBuffer) {
      if (this.bgBufferLoading) return true;
      this.bgBufferLoading = true;
      try {
        const res = await fetch('/audio/bg-music.mp3');
        if (!res.ok) throw new Error('Audio fetch failed');
        const arr = await res.arrayBuffer();
        this.bgBuffer = await this.ctx.decodeAudioData(arr);
        const bounds = this.computeTrimmedLoopBounds(this.bgBuffer);
        this.bgLoopStart = bounds.loopStart;
        this.bgLoopEnd = bounds.loopEnd;
      } catch {
        this.bgBufferLoading = false;
        return false;
      }
      this.bgBufferLoading = false;
    }

    if (!this.musicEnabled || !this.ctx || !this.bgBuffer) return true;
    if (this.bgSource) return true;

    try {
      // Stop HTML5 fallback if it was playing
      if (this.bgAudio && !this.bgAudio.paused) {
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = this.bgBuffer;
      source.loop = true;
      source.loopStart = this.bgLoopStart;
      source.loopEnd = this.bgLoopEnd;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);

      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0, this.bgLoopStart);

      this.bgSource = source;
      this.bgGain = gain;
      this.isMusicPlaying = true;
      return true;
    } catch {
      return false;
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.musicEnabled && !this.isMusicPlaying) {
      this.startAmbientMusic();
    }
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = Boolean(enabled);
    if (this.soundEnabled) {
      this.initContext();
    }
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    if (this.musicEnabled) {
      this.initContext();
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

  getSoundEnabled() {
    return this.soundEnabled;
  }

  getMusicEnabled() {
    return this.musicEnabled;
  }

  playBallLaunch() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playPegHit(row) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastPegHitTime < 0.025) return; // Prevent audio distortion when many balls cascade
    this.lastPegHitTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 700 - row * 20;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  playBumperHit() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const fundamental = 520;

      [fundamental, fundamental * 1.5, fundamental * 2.1].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const initialVol = idx === 0 ? 0.55 : 0.3;
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.35);
      });
    } catch {}
  }

  playSlotWin(isSpin, multiplier) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      if (isSpin) {
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);

          gain.gain.setValueAtTime(0.48, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.25);
        });
      } else {
        const baseFreq = multiplier >= 20 ? 660 : multiplier >= 2 ? 520 : 330;
        const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

        notes.forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.42, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.2);
        });
      }
    } catch {}
  }

  playWheelTick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.02);
    } catch {}
  }

  playWheelWin(isBonus) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chords = isBonus ? [440, 554, 659, 880, 1108] : [392, 523, 659, 784];

      chords.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.52, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch {}
  }

  playButtonClick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  startAmbientMusic() {
    if (!this.musicEnabled) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    const bindGestureUnlock = () => {
      if (this._gestureBound) return;
      this._gestureBound = true;
      const events = ['pointerdown', 'touchend', 'click', 'keydown'];
      const startOnGesture = async () => {
        events.forEach((ev) => window.removeEventListener(ev, startOnGesture));
        this._gestureBound = false;
        if (this.musicEnabled && !this.isMusicPlaying) {
          await startPlayback();
        }
      };
      events.forEach((ev) => window.addEventListener(ev, startOnGesture, { passive: true }));
    };

    const startPlayback = async () => {
      if (!this.musicEnabled || this.isMusicPlaying) return;
      if (this.ctx && this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume();
        } catch {}
      }
      if (this.ctx && this.ctx.state === 'running') {
        const startedGapless = await this.loadAndStartGaplessBg();
        if (startedGapless) return;
      }

      // Fallback to HTML5 Audio if Web Audio is blocked or unavailable
      this.initBgAudio();
      if (!this.bgAudio) return;
      try {
        const playPromise = this.bgAudio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.isMusicPlaying = true;
            })
            .catch(() => {
              bindGestureUnlock();
            });
        }
      } catch {
        bindGestureUnlock();
      }
    };

    if (this.ctx && this.ctx.state === 'suspended') {
      bindGestureUnlock();
    }

    startPlayback();
  }

  stopAmbientMusic() {
    if (this.bgSource) {
      try {
        this.bgSource.stop();
        this.bgSource.disconnect();
      } catch {}
      this.bgSource = null;
    }
    if (this.bgGain) {
      try {
        this.bgGain.disconnect();
      } catch {}
      this.bgGain = null;
    }
    if (this.bgAudio) {
      try {
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
      } catch {}
    }
    this.isMusicPlaying = false;
  }
}

export const soundManager = new SoundManager();
