// Tiny synthesiser: every sound is made in code (no sound files, no downloads).
export const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
export const Sound = {
  on: true, ac: null, noiseBuf: null, unlocked: false,
  ensure() {
    if (!this.on || !this.unlocked) return null;
    try {
      this.ac = this.ac || new (window.AudioContext || window.webkitAudioContext)();
      if (this.ac.state !== 'running' && this.ac.state !== 'closed') this.ac.resume(); // (build 36: iPhone uses 'interrupted' after a call or the app was in the background, not only 'suspended')
      if (!this.noiseBuf) {
        const len = this.ac.sampleRate * .6, buf = this.ac.createBuffer(1, len, this.ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      return this.ac;
    } catch (e) { return null; }
  },
  tone(freq = 560, dur = .1, type = 'sine', vol = .06, slide = .67, delay = 0) {
    const ac = this.ensure(); if (!ac) return;
    try {
      const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + .03);
    } catch (e) { }
  },
  noise(dur = .3, f1 = 600, f2 = 2400, vol = .05, delay = 0) {
    const ac = this.ensure(); if (!ac) return;
    try {
      const t0 = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = this.noiseBuf; f.type = 'bandpass'; f.Q.value = 2.5;
      f.frequency.setValueAtTime(f1, t0); f.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * .2);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(ac.destination); s.start(t0); s.stop(t0 + dur + .05);
    } catch (e) { }
  },
  jump(n) { this.tone(n === 1 ? 330 : 495, .16, 'triangle', .06, 1.8); },
  land() { this.tone(150, .09, 'sine', .07, .6); },
  boing() { this.tone(180, .32, 'sine', .08, 3.2); this.tone(360, .2, 'triangle', .03, 2.2, .03); },
  pop() { this.tone(1100 + Math.random() * 300, .06, 'triangle', .06, .35); },
  whoosh() { this.noise(.5, 400, 3000, .06); },
  click() { this.tone(720, .05, 'square', .025, .9); },
  bell(freq, vol = .05, delay = 0) { this.tone(freq, .9, 'sine', vol, 1, delay); this.tone(freq * 2.01, .35, 'triangle', vol * .35, 1, delay); this.tone(freq * 3.99, .15, 'sine', vol * .12, 1, delay); },
  chime() { [0, 2, 4, 7].forEach((k, i) => this.bell(NOTES[k % 8] * (k > 7 ? 2 : 1), .045, i * .085)); },
  twinkle() { this.bell(NOTES[4 + Math.floor(Math.random() * 4)], .03); },
  giggle() { [0, 1, 2, 3].forEach(i => this.tone(700 + i * 90 + Math.random() * 40, .07, 'sine', .05, 1.25, i * .075)); },
  bit() { this.bell(NOTES[5 + Math.floor(Math.random() * 3)], .025); },
};
