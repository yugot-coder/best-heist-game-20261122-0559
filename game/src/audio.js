// Velvet Vault: every sound is synthesized live with WebAudio.
// One job: procedural sound effects and a quiet night ambience, with no
// audio files at all. Nothing here loads over the network.

/** A small synth: oscillators, filtered noise and envelopes, all procedural. */
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.ambience = null;
  }

  /** Create the AudioContext on the first user gesture (browsers require it). */
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  /** One oscillator note with an exponential decay envelope. */
  tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  /** A short burst of filtered noise (footsteps, coin clinks, static). */
  noise(dur, vol = 0.15, filterFreq = 1200, delay = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t0);
    } catch {
      // Sound is garnish.
    }
  }

  step(sneaking) {
    this.noise(0.05, sneaking ? 0.03 : 0.07, sneaking ? 500 : 900);
  }

  coinThrow() {
    this.tone(1900, 0.09, 'triangle', 0.12, 2400);
  }

  coinLand() {
    this.noise(0.06, 0.16, 3200);
    this.tone(2400, 0.12, 'sine', 0.1, 1800, 0.02);
  }

  pickup(value) {
    // A rising two-note chime; bigger loot rings higher.
    const base = value >= 5000 ? 880 : value >= 1000 ? 740 : 620;
    this.tone(base, 0.14, 'sine', 0.18);
    this.tone(base * 1.5, 0.22, 'sine', 0.16, null, 0.09);
  }

  crackTick() {
    this.tone(1400, 0.05, 'square', 0.06);
  }

  vaultOpen() {
    this.tone(220, 0.5, 'sawtooth', 0.1, 440);
    this.tone(660, 0.3, 'sine', 0.16, null, 0.12);
    this.tone(990, 0.4, 'sine', 0.16, null, 0.22);
  }

  spotted() {
    // A sharp alert sting when a guard fully spots the thief.
    this.tone(620, 0.16, 'square', 0.14, 930);
    this.tone(930, 0.2, 'square', 0.12, 620, 0.12);
  }

  laserTrip() {
    this.tone(180, 0.35, 'sawtooth', 0.2, 90);
    this.noise(0.25, 0.12, 2400);
  }

  cameraPing() {
    this.tone(1150, 0.1, 'sine', 0.08, 900);
  }

  smoke() {
    this.noise(0.5, 0.12, 700);
  }

  dash() {
    this.noise(0.18, 0.1, 1800);
  }

  caught() {
    this.tone(392, 0.22, 'sawtooth', 0.18, 370);
    this.tone(311, 0.22, 'sawtooth', 0.18, 294, 0.2);
    this.tone(233, 0.5, 'sawtooth', 0.2, 220, 0.4);
  }

  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.16, null, i * 0.11));
  }

  heistWin() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.16, null, i * 0.13));
    this.noise(0.6, 0.05, 4000, 0.2);
  }

  /** A low, slow night pad: two detuned sines under everything. */
  startAmbience() {
    if (!this.ctx || this.ambience) return;
    try {
      const gain = this.ctx.createGain();
      gain.gain.value = 0.035;
      gain.connect(this.master);
      const o1 = this.ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.value = 55;
      const o2 = this.ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = 55.7;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.015;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      o1.connect(gain);
      o2.connect(gain);
      o1.start();
      o2.start();
      lfo.start();
      this.ambience = { gain, o1, o2, lfo };
    } catch {
      this.ambience = null;
    }
  }
}
