import { createState, renderScreen, screenNames, scaleNames, parts, grid } from "./artboards.mjs";

const state = createState();
let current = "workspace";
const artboard = document.querySelector("#artboard");
const viewport = document.querySelector("#viewport");
const dialog = document.querySelector("#settings-dialog");
const history = [];
const future = [];
let toastTimer;
let audio;
let activeOscillators = [];
let playbackTimer;
let animation;
let startedAt = 0;
let playbackDuration = 0;
let practiceLoops = 0;
let loopEnabled = true;
let pendingSetting;

function notify(message) {
  document.querySelector("#toast").textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { document.querySelector("#toast").textContent = ""; }, 6500);
}

function draw() {
  artboard.innerHTML = renderScreen(current, state).replace(/^<\?xml[^>]*>\s*/, "");
  document.querySelectorAll("[data-screen]").forEach(button => {
    const active = button.dataset.screen === current;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  artboard.setAttribute("aria-labelledby", `tab-${current}`);
  document.title = `${screenNames[current]} - Second Voice mockup`;
}

function navigate(screen) {
  stopPlayback();
  current = screen;
  draw();
}

function stopPlayback() {
  clearTimeout(playbackTimer);
  cancelAnimationFrame(animation);
  activeOscillators.forEach(oscillator => oscillator.stop());
  activeOscillators = [];
  state.playing = false;
}

function scheduleNote(pitch, when, duration, volume) {
  const frequency = 440 * 2 ** ((pitch - 69) / 12);
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2600;
  filter.connect(gain);
  gain.connect(audio.destination);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), when + .012);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * .26), when + .18);
  gain.gain.exponentialRampToValueAtTime(.0001, when + Math.max(.25, duration));
  const oscillator = audio.createOscillator();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  oscillator.connect(filter);
  oscillator.start(when);
  oscillator.stop(when + Math.max(.25, duration) + .05);
  oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); gain.disconnect(); };
  activeOscillators.push(oscillator);
}

async function startPlayback(resetPractice = true, chordsOnly = false) {
  stopPlayback();
  if (!audio) audio = new AudioContext();
  await audio.resume();
  if (resetPractice) practiceLoops = 0;
  state.playing = true;
  const practice = current === "learn";
  const speed = practice ? state.speed / 100 : 1;
  const secondsPerBeat = 60 / state.bpm / speed;
  const startBeat = practice ? 8 : 0;
  const endBeat = practice ? 16 : 32;
  const leadOnly = current === "review";
  const selected = Math.max(1, Math.min(state.selected, state.count));
  startedAt = audio.currentTime + .08;
  playbackDuration = (endBeat - startBeat) * secondsPerBeat;
  if (!chordsOnly) state.notes.forEach((notes, voice) => {
    if (voice > state.count || (leadOnly && voice > 0) || (!practice && state.muted.includes(voice))) return;
    if (!practice && state.solo !== null && state.solo !== voice) return;
    if (practice && voice !== 0 && voice !== selected) return;
    const fade = practice && voice === selected && state.fade ? Math.max(.12, 1 - practiceLoops * .28) : 1;
    const volume = (practice ? (voice === 0 ? .028 : .05) : .025) * fade;
    notes.filter(note => note.beat >= startBeat && note.beat < endBeat).forEach(note =>
      scheduleNote(note.pitch, startedAt + (note.beat - startBeat) * secondsPerBeat, note.duration * secondsPerBeat, volume));
  });
  const chordPitches = [[50, 57, 65], [50, 57, 65], [43, 59, 62], [43, 59, 62], [50, 57, 65], [45, 60, 64], [43, 59, 62], [50, 57, 65]];
  if (practice || state.solo === null || chordsOnly) chordPitches.forEach((notes, bar) => {
    const beat = bar * 4;
    if (beat >= startBeat && beat < endBeat) notes.forEach(pitch =>
      scheduleNote(pitch, startedAt + (beat - startBeat) * secondsPerBeat, 3.8 * secondsPerBeat, chordsOnly ? .027 : .012));
  });
  draw();
  const animate = () => {
    if (!state.playing) return;
    const head = artboard.querySelector("#playhead");
    if (head) {
      const progress = Math.max(0, Math.min(1, (audio.currentTime - startedAt) / playbackDuration));
      head.setAttribute("transform", `translate(${progress * grid.width} 0)`);
    }
    animation = requestAnimationFrame(animate);
  };
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) animate();
  playbackTimer = setTimeout(() => {
    if (loopEnabled && !chordsOnly) {
      practiceLoops++;
      startPlayback(false).catch(error => notify(`Playback unavailable: ${error.message}`));
    } else {
      stopPlayback();
      draw();
    }
  }, playbackDuration * 1000 + 90);
}

function openSetting(key, title, description, label, options, value) {
  pendingSetting = key;
  document.querySelector("#dialog-title").textContent = title;
  document.querySelector("#dialog-description").textContent = description;
  document.querySelector("#control-label").textContent = label;
  const slot = document.querySelector("#control-slot");
  slot.replaceChildren();
  const control = document.createElement(options ? "select" : "input");
  control.id = "setting-control";
  if (options) options.forEach(option => {
    const entry = document.createElement("option");
    entry.value = String(option.value ?? option);
    entry.textContent = option.label ?? String(option);
    control.append(entry);
  });
  else { control.type = "number"; control.min = "40"; control.max = "220"; control.required = true; }
  control.value = String(value);
  slot.append(control);
  dialog.showModal();
}

function handle(action) {
  if (screenNames[action]) { navigate(action); return; }
  if (action === "generate") {
    navigate("workspace");
    notify("Example harmonies shown. This mockup does not transcribe audio or generate new music.");
  } else if (action.startsWith("track:")) {
    state.selected = Number(action.split(":")[1]); draw();
  } else if (action.startsWith("count:")) {
    stopPlayback();
    state.count = Number(action.split(":")[1]);
    state.selected = Math.min(state.selected, state.count);
    state.solo = state.solo !== null && state.solo > state.count ? null : state.solo;
    draw();
  } else if (action.startsWith("mute:")) {
    stopPlayback();
    const voice = Number(action.split(":")[1]);
    state.muted = state.muted.includes(voice) ? state.muted.filter(v => v !== voice) : [...state.muted, voice];
    draw();
  } else if (action.startsWith("solo:")) {
    stopPlayback();
    const voice = Number(action.split(":")[1]);
    state.solo = state.solo === voice ? null : voice; draw();
  } else if (action === "play") {
    if (state.playing) { stopPlayback(); draw(); }
    else startPlayback().catch(error => notify(`Playback unavailable: ${error.message}`));
  } else if (action === "stop") { stopPlayback(); draw(); }
  else if (action === "preview-chords") startPlayback(true, true).catch(error => notify(`Playback unavailable: ${error.message}`));
  else if (action === "loop") { loopEnabled = !loopEnabled; notify(`Loop ${loopEnabled ? "enabled" : "disabled"}.`); }
  else if (action === "scale-menu") openSetting("scale", "Scale / mode", "Your lead stays unchanged. Demo harmony notes remain fixed in this visual prototype.", "Scale", scaleNames, state.scale);
  else if (action === "style-menu") openSetting("style", "Arrangement style", "This selector illustrates the proposed choices; it does not rearrange the example notes.", "Style", ["Close", "Open", "Parallel / intervals"], state.style);
  else if (action === "tempo") openSetting("bpm", "Project tempo", "Set before recording. Changing it here changes the demo playback tempo.", "Beats per minute", null, state.bpm);
  else if (action === "speed") openSetting("speed", "Practice speed", "Slow down the guide without changing its pitches.", "Speed", [50, 75, 100].map(value => ({ value, label: `${value}%` })), state.speed);
  else if (action === "practice-part") openSetting("selected", "Choose your part", "Choose one of the added harmony lines to rehearse.", "Harmony part", parts.slice(1, state.count + 1).map((part, index) => ({ value: index + 1, label: part.name })), Math.max(1, state.selected));
  else if (action === "snap") { state.snap = !state.snap; draw(); }
  else if (action === "lock") { state.locked = !state.locked; draw(); }
  else if (action === "fade") { state.fade = !state.fade; draw(); }
  else if (action === "undo") {
    if (!history.length) { notify("No note edits to undo."); return; }
    stopPlayback(); future.push(structuredClone(state.notes)); state.notes = history.pop(); draw();
  } else if (action === "redo") {
    if (!future.length) { notify("No note edits to redo."); return; }
    stopPlayback(); history.push(structuredClone(state.notes)); state.notes = future.pop(); draw();
  } else if (action === "export") notify("The planned app exports separate MIDI parts and piano guides. Use Save this SVG to download this design.");
  else if (["record", "upload"].includes(action)) notify("Capture is illustrated, not implemented. Choose Review melody to explore the example take.");
  else if (["guide-export", "midi-export"].includes(action)) notify("Audio/MIDI export is illustrated, not implemented. Save this SVG exports the editable design.");
  else if (action === "align") notify("Proposed control: shift the entire take to align beat one. Note dragging works in this mockup.");
  else if (action === "range-menu") notify("Proposed control: choose the lowest and highest comfortable note for this singer.");
  else if (action === "split-tool") notify("Splitting is illustrated. You can drag the example notes to explore pitch and timing edits.");
  else notify("This control is part of the visual sketch. The example song remains fixed.");
}

artboard.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (target) handle(target.dataset.action);
});
artboard.addEventListener("keydown", event => {
  if (["Enter", " "].includes(event.key) && event.target.matches("[data-action]")) {
    event.preventDefault(); handle(event.target.dataset.action);
  }
});

let drag;
artboard.addEventListener("pointerdown", event => {
  const noteElement = event.target.closest("[data-note]");
  if (!noteElement || event.button !== 0) return;
  event.preventDefault();
  stopPlayback();
  const [voice, index] = noteElement.dataset.note.split(":").map(Number);
  drag = { voice, index, x: event.clientX, y: event.clientY, original: { ...state.notes[voice][index] }, before: structuredClone(state.notes), changed: false };
  artboard.setPointerCapture(event.pointerId);
});
artboard.addEventListener("pointermove", event => {
  if (!drag) return;
  const scale = artboard.querySelector("svg").getBoundingClientRect().width / 1440;
  const pitchDelta = Math.round((drag.y - event.clientY) / (grid.row * scale));
  const beatDelta = (event.clientX - drag.x) / (grid.beatWidth * scale);
  const step = state.snap ? .5 : .125;
  const beat = Math.round((drag.original.beat + beatDelta) / step) * step;
  state.notes[drag.voice][drag.index] = {
    ...drag.original,
    pitch: Math.max(grid.bottom, Math.min(grid.top, drag.original.pitch + pitchDelta)),
    beat: Math.max(0, Math.min(32 - drag.original.duration, beat)),
  };
  drag.changed = state.notes[drag.voice][drag.index].pitch !== drag.original.pitch || state.notes[drag.voice][drag.index].beat !== drag.original.beat;
  draw();
});
function finishDrag() {
  if (!drag) return;
  if (drag.changed) { history.push(drag.before); future.length = 0; }
  drag = null;
}
artboard.addEventListener("pointerup", finishDrag);
artboard.addEventListener("pointercancel", finishDrag);

document.querySelectorAll("[data-screen]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.screen)));
document.querySelector('[role="tablist"]').addEventListener("keydown", event => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const keys = Object.keys(screenNames);
  const index = (keys.indexOf(current) + (event.key === "ArrowRight" ? 1 : keys.length - 1)) % keys.length;
  navigate(keys[index]);
  document.querySelector(`#tab-${keys[index]}`).focus();
});
document.querySelector("#fit").addEventListener("click", () => setZoom(false));
document.querySelector("#actual").addEventListener("click", () => setZoom(true));
function setZoom(actual) {
  viewport.classList.toggle("actual", actual);
  for (const [id, active] of [["fit", !actual], ["actual", actual]]) {
    document.querySelector(`#${id}`).classList.toggle("active", active);
    document.querySelector(`#${id}`).setAttribute("aria-pressed", String(active));
  }
}

function downloadSVG() {
  const blob = new Blob([renderScreen(current, state)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `second-voice-${current}.svg`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Editable SVG downloaded. Drag it onto a Figma design canvas to import.");
}
document.querySelector("#download").addEventListener("click", downloadSVG);
document.querySelector("#cancel-settings").addEventListener("click", () => dialog.close());
document.querySelector("#settings-form").addEventListener("submit", event => {
  event.preventDefault();
  const value = document.querySelector("#setting-control").value;
  stopPlayback();
  state[pendingSetting] = ["bpm", "speed", "selected"].includes(pendingSetting) ? Number(value) : value;
  dialog.close(); draw();
});
document.addEventListener("visibilitychange", () => { if (document.hidden) { stopPlayback(); draw(); } });
window.addEventListener("pagehide", stopPlayback);
draw();
