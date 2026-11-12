// ===================================================================
// voice.js (build 27): ONE friendly speaking voice for the whole game (spoken instructions, hints, praise,
// and the messages that pop up in the world), built on the phone's own speech engine (free, offline, no files).
// It works around the known mobile Safari problems:
//   * Safari only allows speech after a tap: the first tap anywhere in the game "unlocks" the voice with a
//     silent utterance, so later speech (after a delay, or from a timer) is allowed too.
//   * speak() straight after cancel() is often dropped by WebKit: when something is still talking we cancel,
//     wait a moment, then speak.
//   * utterances can be garbage-collected mid-sentence (and never finish): the last few are kept referenced.
//   * Safari can leave the speech queue paused after the app was in the background: resume() before speaking.
// It picks a natural English voice (Premium/Enhanced first, then e.g. Samantha/Ava), never the novelty voices.
// `diag` records what really happened (voices found, voice used, sentences started/finished, errors) so the
// grown-ups' performance report can show whether speech actually plays on the iPhone.
// ===================================================================
const BAD = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Rocko|Shelley|Eddy|Flo|Reed|Sandy|Hysterical/i;
const NICE = /Samantha|Ava|Allison|Susan|Zoe|Nicky|Evan|Joelle|Noelle|Google US English|Microsoft (Aria|Jenny|Ana)|Karen|Moira|Tessa|Serena|Kate|Martha/i;

export function makeVoice({ isOn = () => true, TEST = false } = {}) {
  const ok = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  const diag = { supported: ok, voices: 0, voice: 'default', unlocked: false, started: 0, ended: 0, errors: [], last: '' };
  let voice = null, keep = [], timer = 0, unlockTries = 0;
  function pickVoice() {
    try {
      const vs = speechSynthesis.getVoices(); diag.voices = vs.length;
      const en = vs.filter(v => /^en([-_]|$)/i.test(v.lang) && !BAD.test(v.name));
      const score = v => (/premium/i.test(v.name) ? 50 : 0) + (/enhanced|neural|natural/i.test(v.name) ? 40 : 0) + (NICE.test(v.name) ? 20 : 0) + (/en[-_]US/i.test(v.lang) ? 8 : /en[-_](GB|AU|IE|CA)/i.test(v.lang) ? 5 : 0) + (v.localService ? 2 : 0) + (v.default ? 1 : 0);
      en.sort((a, b) => score(b) - score(a)); voice = en[0] || null; diag.voice = voice ? `${voice.name} (${voice.lang})` : 'default';
    } catch (e) { }
  }
  if (ok) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { speechSynthesis.onvoiceschanged = pickVoice; } }

  // called from the first taps (pointerdown, touchend and click: different Safari versions trust different ones)
  function unlock() {
    if (!ok || TEST || unlockTries >= 3) return; unlockTries++;
    try { speechSynthesis.resume(); const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.onstart = () => { diag.unlocked = true; }; u.onend = () => { diag.unlocked = true; }; keep.push(u); speechSynthesis.speak(u); } catch (e) { }
    if (!voice) pickVoice();
  }
  const clean = t => String(t).replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();
  // speak(text, { queue: true }) adds to what is being said; otherwise it replaces it
  function speak(text, o = {}) {
    text = clean(text); if (!text) return false;
    diag.last = text;
    if (!ok || TEST || !isOn()) { if (o.onend) setTimeout(o.onend, 50); return false; }
    const go = () => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
      u.rate = o.rate || .92; u.pitch = o.pitch || 1.15; u.volume = o.volume ?? 1;
      u.onstart = () => { diag.started++; diag.unlocked = true; };
      u.onend = () => { diag.ended++; keep = keep.filter(x => x !== u); o.onend && o.onend(); };
      u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') { diag.errors.push(e.error || 'error'); if (diag.errors.length > 6) diag.errors.shift(); } keep = keep.filter(x => x !== u); };
      keep.push(u); if (keep.length > 10) keep.shift();
      try { speechSynthesis.resume(); speechSynthesis.speak(u); } catch (e) { diag.errors.push(String(e.message || e)); }
    };
    clearTimeout(timer);
    let busy = false; try { busy = speechSynthesis.speaking || speechSynthesis.pending; } catch (e) { }
    if (!o.queue && busy) { try { speechSynthesis.cancel(); } catch (e) { } timer = setTimeout(go, 140); } else go();
    return true;
  }
  function stop() { clearTimeout(timer); if (ok) try { speechSynthesis.cancel(); } catch (e) { } }
  const speaking = () => { try { return ok && (speechSynthesis.speaking || speechSynthesis.pending); } catch (e) { return false; } };
  return { ok, speak, stop, unlock, speaking, diag };
}
