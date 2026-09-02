/**
 * CARNAL ROULETTE VR — Audio System
 * 
 * Professional procedural audio system with:
 * - Spatial audio via Web Audio API
 * - Multiple voice layers (moans, breaths, climax)
 * - Dynamic mixing based on intensity
 * - Low-latency response to actions
 */

class AudioSystem {
  constructor() {
    this.name = 'AudioSystem';
    this.context = null;
    this.masterGain = null;
    this.voicePool = [];
    this.maxVoices = 8;
    this.settings = {
      volume: 0.6,
      moanFrequency: 0.5,
      sfxEnabled: true,
      voicesEnabled: true,
    };
  }

  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.settings.volume;
      this.masterGain.connect(this.context.destination);

      // Bus structure for mixing
      this.buses = {
        voice: this.context.createGain(),
        sfx: this.context.createGain(),
        ambient: this.context.createGain(),
      };

      this.buses.voice.gain.value = 0.8;
      this.buses.sfx.gain.value = 1.0;
      this.buses.ambient.gain.value = 0.3;

      for (const bus of Object.values(this.buses)) {
        bus.connect(this.masterGain);
      }

      // Pre-warm voice pool
      for (let i = 0; i < this.maxVoices; i++) {
        this.voicePool.push(this.createVoice());
      }

      console.log('[AudioSystem] Initialized');
    } catch (e) {
      console.warn('[AudioSystem] Web Audio not available:', e.message);
    }
  }

  createVoice() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const panner = this.context.createStereoPanner();

    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.buses.voice);

    osc.start();
    osc.frequency.value = 220;
    gain.gain.value = 0;

    return { osc, gain, filter, panner, inUse: false };
  }

  getVoice() {
    // Find unused voice or steal oldest
    let voice = this.voicePool.find(v => !v.inUse);
    if (!voice) {
      voice = this.voicePool[0];
      this.voicePool.shift();
      this.voicePool.push(voice);
    }
    voice.inUse = true;
    return voice;
  }

  releaseVoice(voice) {
    voice.inUse = false;
    voice.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.05);
  }

  /**
   * Play a moan sound
   */
  playMoan(intensity = 0.5, pitch = 1.0, pan = 0) {
    if (!this.context || !this.settings.voicesEnabled) return;

    const voice = this.getVoice();
    if (!voice) return;

    const now = this.context.currentTime;
    const baseFreq = 200 + Math.random() * 80;
    const dur = 0.4 + intensity * 0.8;

    // Pitch bend
    voice.osc.frequency.cancelScheduledValues(now);
    voice.osc.frequency.setValueAtTime(baseFreq * pitch, now);
    voice.osc.frequency.linearRampToValueAtTime(
      (baseFreq + 30) * pitch, now + 0.1
    );
    voice.osc.frequency.exponentialRampToValueAtTime(
      (baseFreq - 40) * pitch, now + dur * 0.7
    );

    // Volume envelope
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(0, now);
    voice.gain.gain.linearRampToValueAtTime(0.15 * intensity, now + 0.05);
    voice.gain.gain.setValueAtTime(0.15 * intensity, now + dur * 0.6);
    voice.gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    // Filter sweep
    voice.filter.frequency.cancelScheduledValues(now);
    voice.filter.frequency.setValueAtTime(400 + intensity * 400, now);
    voice.filter.frequency.linearRampToValueAtTime(
      2000 + intensity * 1000, now + 0.15
    );
    voice.filter.frequency.exponentialRampToValueAtTime(
      300, now + dur
    );

    // Spatial pan
    voice.panner.pan.setValueAtTime(pan, now);

    // Release voice after duration
    setTimeout(() => this.releaseVoice(voice), dur * 1000 + 50);
  }

  /**
   * Play a thrust sound (low impact)
   */
  playThrust(intensity = 0.5) {
    if (!this.context || !this.settings.sfxEnabled) return;

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();

    // Low thud
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60 + intensity * 40, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.12);

    gain.gain.setValueAtTime(0.3 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    panner.pan.value = (Math.random() - 0.5) * 0.5;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.buses.sfx);

    osc.start(now);
    osc.stop(now + 0.2);

    // Play matching moan
    setTimeout(() => this.playMoan(intensity * 0.5, 1.0, panner.pan.value), 0.05 * 1000);
  }

  /**
   * Play climax sound
   */
  playClimax() {
    if (!this.context) return;

    // Multiple layered moans
    this.playMoan(1.0, 1.2, -0.3);
    setTimeout(() => this.playMoan(1.0, 1.1, 0.3), 200);
    setTimeout(() => this.playMoan(0.9, 0.9, 0), 400);
    setTimeout(() => this.playMoan(0.7, 0.7, -0.2), 600);

    // Climactic rising tone
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 2);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 2.5);
  }

  /**
   * Ambient sound layer based on environment
   */
  playAmbient(type = 'bedroom') {
    if (!this.context) return;

    const ambients = {
      bedroom: { freq: 80, volume: 0.05 },
      dungeon: { freq: 40, volume: 0.08 },
      outdoor: { freq: 200, volume: 0.03 },
      pool: { freq: 150, volume: 0.06 },
      mirror: { freq: 100, volume: 0.04 },
    };

    const config = ambients[type] || ambients.bedroom;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.value = config.freq;

    filter.type = 'lowpass';
    filter.frequency.value = config.freq * 2;

    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 5;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.value = config.volume;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.buses.ambient);

    osc.start();
    lfo.start();
  }

  setVolume(vol) {
    this.settings.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.settings.volume;
    }
  }
}

window.AudioSystem = new AudioSystem();
