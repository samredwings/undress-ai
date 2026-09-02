/**
 * CARNAL ROULETTE VR — Spatial Audio System
 * Generates procedural audio for immersive feedback
 */

const Audio = {
  context: null,
  masterGain: null,
  moanOscillators: [],
  isInitialized: false,

  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.context.destination);
      this.isInitialized = true;
    } catch (e) {
      console.warn('[Audio] Web Audio not available');
    }
  },

  ensureResumed() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  },

  playActionSound(actionType, intensity = 0) {
    if (!this.isInitialized) return;
    this.ensureResumed();

    switch (actionType) {
      case 'thrust':
        this.playThrust(intensity);
        break;
      case 'deep':
        this.playDeepThrust(intensity);
        break;
      case 'tease':
        this.playTease();
        break;
      case 'rhythm':
        this.playRhythm(intensity);
        break;
    }

    // Add partner moan at intensity-dependent frequency
    if (intensity > 0.3) {
      this.playMoan(intensity);
    }
  },

  playThrust(intensity) {
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80 + intensity * 40, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.3 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  },

  playDeepThrust(intensity) {
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    gain.gain.setValueAtTime(0.4 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  },

  playTease() {
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.1);
    osc.frequency.linearRampToValueAtTime(200, now + 0.2);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  },

  playRhythm(intensity) {
    // Rhythmic thrusting pattern
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.2;
      setTimeout(() => {
        this.playThrust(intensity * (1 - i * 0.15));
      }, delay * 1000);
    }
  },

  playMoan(intensity) {
    if (this.moanOscillators.length > 3) return; // limit overlapping moans

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    const baseFreq = 260 + Math.random() * 80;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq + 30, now + 0.15);
    osc.frequency.linearRampToValueAtTime(baseFreq - 20, now + 0.4);
    osc.frequency.linearRampToValueAtTime(baseFreq, now + 0.6);

    gain.gain.setValueAtTime(0.15 * intensity, now);
    gain.gain.linearRampToValueAtTime(0.25 * intensity, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800 + intensity * 400;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    this.moanOscillators.push(osc);
    osc.start(now);
    osc.stop(now + 0.8);

    // Cleanup from array when done
    osc.onended = () => {
      const idx = this.moanOscillators.indexOf(osc);
      if (idx >= 0) this.moanOscillators.splice(idx, 1);
    };
  },

  playClimax() {
    if (!this.isInitialized) return;
    this.ensureResumed();
    
    // Building crescendo
    const now = this.context.currentTime;
    
    // Rising tone
    const osc1 = this.context.createOscillator();
    const gain1 = this.context.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 1.5);
    
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.8);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 2);
    
    const filter1 = this.context.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(200, now);
    filter1.frequency.exponentialRampToValueAtTime(2000, now + 1.5);
    
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 2);

    // Multiple moans
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.playMoan(1.0), i * 300);
    }
  },

  setVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
    }
  },
};
