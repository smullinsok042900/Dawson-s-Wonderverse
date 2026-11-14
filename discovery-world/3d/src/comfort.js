// Save migration is deliberately strict: malformed optional fields use safe defaults.
export function normalizeComfort(raw, reducedMotion = false) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const defaults = { speech: true, music: true, effects: true, calm: !!reducedMotion, relaxed: false };
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, typeof value[key] === 'boolean' ? value[key] : fallback]));
}

export function initComfort({ world, Sound, voice, G = {}, save = () => {} }) {
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  let settings = normalizeComfort(world.comfort, reduced), overlay, previousFocus;
  const rows = [
    ['speech', '🗣️', 'Talking voice'], ['music', '🎵', 'Music'],
    ['effects', '🔔', 'Play sounds'], ['calm', '🌙', 'Gentle movement'],
    ['relaxed', '🐢', 'Gentle controls'],
  ];
  const speak = text => { if (Sound.on && settings.speech) voice?.speak(text); };
  function apply(next = settings, persist = true) {
    settings = normalizeComfort(next, reduced);
    world.comfort = settings;
    Sound.musicEnabled = settings.music;
    Sound.effectsEnabled = settings.effects;
    document.documentElement.classList.toggle('calm', settings.calm);
    if (!settings.speech) voice?.stop();
    G.onComfortChange?.(settings);
    if (overlay) for (const [key] of rows) {
      const button = overlay.querySelector(`[data-comfort="${key}"]`);
      button.setAttribute('aria-pressed', String(settings[key]));
      button.querySelector('.comfort-state').textContent = settings[key] ? '✅' : '⭕';
    }
    if (persist) save();
    return settings;
  }
  function release() { G.releaseInputs?.(); }
  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true; release(); G.setModalOpen?.(false);
    previousFocus?.focus?.();
  }
  function createPanel() {
    if (!document.getElementById('comfort-css')) {
      const style = document.createElement('style'); style.id = 'comfort-css';
      style.textContent = `.comfort-overlay{position:fixed;inset:0;z-index:2000;background:#182544a8;display:grid;place-items:center;padding:12px;touch-action:manipulation}.comfort-overlay[hidden]{display:none}.comfort-card{box-sizing:border-box;background:#fff8eb;color:#243253;border:4px solid #b7a2ec;border-radius:24px;padding:16px;width:min(390px,100%);max-height:92dvh;overflow:auto;box-shadow:0 8px 30px #18254466}.comfort-row{display:flex;gap:8px;margin:8px 0}.comfort-card button{font:inherit;min-height:52px;border:2px solid #b7a2ec;border-radius:14px;background:white;color:#243253;cursor:pointer}.comfort-toggle{flex:1;display:flex;align-items:center;justify-content:space-around;font-size:30px!important}.comfort-replay{width:56px;font-size:26px!important}.comfort-card button:focus-visible{outline:4px solid #1271bf;outline-offset:2px}.comfort-close{width:100%;font-size:30px!important}.comfort-overlay .comfort-title{text-align:center;font-size:32px;margin:0 0 8px}html.calm .comfort-overlay *{animation:none!important;transition:none!important}`;
      document.head.appendChild(style);
    }
    overlay = document.createElement('div'); overlay.className = 'comfort-overlay'; overlay.hidden = true;
    overlay.innerHTML = '<section class="comfort-card" role="dialog" aria-modal="true" aria-label="Comfort settings"><p class="comfort-title" aria-hidden="true">⚙️ 🌈</p></section>';
    const card = overlay.firstElementChild;
    for (const [key, picture, label] of rows) {
      const row = document.createElement('div'); row.className = 'comfort-row';
      const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'comfort-toggle';
      toggle.dataset.comfort = key; toggle.setAttribute('aria-label', label);
      toggle.innerHTML = `<span aria-hidden="true">${picture}</span><span class="comfort-state" aria-hidden="true"></span>`;
      toggle.addEventListener('click', () => {
        apply({ ...settings, [key]: !settings[key] });
        speak(`${label}. ${settings[key] ? 'On' : 'Off'}.`);
      });
      const replay = document.createElement('button'); replay.type = 'button'; replay.className = 'comfort-replay'; replay.textContent = '🔊';
      replay.setAttribute('aria-label', `Hear ${label}`);
      replay.addEventListener('click', () => speak(`${label}. ${settings[key] ? 'On' : 'Off'}.`));
      row.append(toggle, replay); card.appendChild(row);
    }
    const done = document.createElement('button'); done.type = 'button'; done.className = 'comfort-close'; done.textContent = '✅'; done.setAttribute('aria-label', 'Back to playing'); done.addEventListener('click', close); card.appendChild(done);
    overlay.addEventListener('pointerdown', event => event.stopPropagation());
    overlay.addEventListener('click', event => { event.stopPropagation(); if (event.target === overlay) close(); });
    overlay.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const buttons = [...overlay.querySelectorAll('button')], first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    document.body.appendChild(overlay);
  }
  function open() {
    if (!overlay) createPanel();
    if (!overlay.hidden) return;
    previousFocus = document.activeElement; release(); G.closePanels?.(); G.setModalOpen?.(true);
    overlay.hidden = false; apply(settings, false); overlay.querySelector('button').focus();
    speak('Make yourself comfortable. Tap a picture to change it. Tap the speaker to hear it again.');
  }
  apply(settings, false);
  return { open, close, apply };
}
