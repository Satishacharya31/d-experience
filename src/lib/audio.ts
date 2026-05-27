// ── audio.ts ──────────────────────────────────────────────────────────────────
// Retro 8-bit synthesizer using the Web Audio API.
// All sounds are generated procedurally — no external files.
// ─────────────────────────────────────────────────────────────────────────────

class RetroSynth {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  setMuted(v: boolean) {
    this.muted = v;
  }

  toggleMute() {
    this.muted = !this.muted;
  }

  private masterGain(ctx: AudioContext, vol = 0.25): GainNode {
    const g = ctx.createGain();
    g.gain.setValueAtTime(this.muted ? 0 : vol, ctx.currentTime);
    g.connect(ctx.destination);
    return g;
  }

  /** Quick ascending tone sweep — used for Jump */
  jump() {
    try {
      const ctx = this.getCtx();
      const g = this.masterGain(ctx, 0.2);
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.18);
      const env = ctx.createGain();
      env.gain.setValueAtTime(1, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(env);
      env.connect(g);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch { /* ignore */ }
  }

  /** Double-jump: higher pitch variation */
  doubleJump() {
    try {
      const ctx = this.getCtx();
      const g = this.masterGain(ctx, 0.18);
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      const env = ctx.createGain();
      env.gain.setValueAtTime(1, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(env);
      env.connect(g);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch { /* ignore */ }
  }

  /** Sparkling arpeggio — used when collecting a Datashard */
  collect() {
    try {
      const ctx = this.getCtx();
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const t = ctx.currentTime + i * 0.07;
        const g = this.masterGain(ctx, 0.18);
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, t);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(1, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(env);
        env.connect(g);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    } catch { /* ignore */ }
  }

  /** Quest completion — triumphant rising chords */
  questComplete() {
    try {
      const ctx = this.getCtx();
      // Chord pairs: C4+E4, F4+A4, G4+B4, C5+E5
      const chords = [[261, 330], [349, 440], [392, 494], [523, 659]];
      chords.forEach(([f1, f2], i) => {
        const t = ctx.currentTime + i * 0.15;
        [f1, f2].forEach((freq) => {
          const g = this.masterGain(ctx, 0.15);
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, t);
          const env = ctx.createGain();
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(1, t + 0.02);
          env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.connect(env);
          env.connect(g);
          osc.start(t);
          osc.stop(t + 0.27);
        });
      });
    } catch { /* ignore */ }
  }

  /** Level-up fanfare — heavy dual-oscillator chip melody */
  levelUp() {
    try {
      const ctx = this.getCtx();
      // Melody: C4 E4 G4 C5 (staggered with harmony a 3rd below)
      const melody  = [261, 330, 392, 523, 659, 784];
      const harmony = [196, 247, 294, 392, 494, 587];
      melody.forEach((freq, i) => {
        const t = ctx.currentTime + i * 0.1;
        [[freq, 0.22], [harmony[i], 0.12]].forEach(([f, v]) => {
          const g = this.masterGain(ctx, v as number);
          const osc = ctx.createOscillator();
          osc.type = "square";
          osc.frequency.setValueAtTime(f as number, t);
          const env = ctx.createGain();
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(1, t + 0.015);
          env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.connect(env);
          env.connect(g);
          osc.start(t);
          osc.stop(t + 0.2);
        });
      });
    } catch { /* ignore */ }
  }

  /** Terminal interaction beep */
  interact() {
    try {
      const ctx = this.getCtx();
      const g = this.masterGain(ctx, 0.12);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.06);
      const env = ctx.createGain();
      env.gain.setValueAtTime(1, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(env);
      env.connect(g);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    } catch { /* ignore */ }
  }

  /** Classic retro laser shoot sound — descending frequency sweep */
  shoot() {
    try {
      const ctx = this.getCtx();
      const g = this.masterGain(ctx, 0.07); // small volume since it is fired repeatedly
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.14);
      const env = ctx.createGain();
      env.gain.setValueAtTime(1, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(env);
      env.connect(g);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    } catch { /* ignore */ }
  }

  /** Zone enter beep */
  zoneEnter() {
    try {
      const ctx = this.getCtx();
      const freqs = [440, 550, 660];
      freqs.forEach((freq, i) => {
        const t = ctx.currentTime + i * 0.05;
        const g = this.masterGain(ctx, 0.14);
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(1, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(env);
        env.connect(g);
        osc.start(t);
        osc.stop(t + 0.17);
      });
    } catch { /* ignore */ }
  }
}

export const audio = new RetroSynth();
