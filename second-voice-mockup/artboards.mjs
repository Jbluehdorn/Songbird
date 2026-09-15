export const WIDTH = 1440;
export const HEIGHT = 980;

const c = {
  ink: "#21332F", muted: "#62726C", faint: "#E1E7E3", paper: "#FFFFFF",
  ground: "#F3F6F4", panel: "#F8FAF8", accent: "#226A53", soft: "#E6F0EA",
};
export const parts = [
  { name: "Your melody", role: "Original lead", color: "#285E4C", tint: "#DCECE3", range: ["D4", "B4"] },
  { name: "Harmony 1", role: "Upper voice", color: "#355FB2", tint: "#E1EAFE", range: ["F4", "E5"] },
  { name: "Harmony 2", role: "Middle voice", color: "#765094", tint: "#EDE3F6", range: ["G3", "G4"] },
  { name: "Harmony 3", role: "Lower voice", color: "#A45243", tint: "#F5E2DD", range: ["E3", "E4"] },
  { name: "Harmony 4", role: "Low support", color: "#86682D", tint: "#F1E8D1", range: ["C3", "C4"] },
];
export const chords = ["Dm", "Dm", "G", "G", "Dm", "Am", "G", "Dm"];
export const scaleNames = [
  "Major (Ionian)", "Natural minor (Aeolian)", "Harmonic minor",
  "Melodic minor (jazz)", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Locrian",
];
const scaleNotes = {
  "Major (Ionian)": "D  E  F#  G  A  B  C#",
  "Natural minor (Aeolian)": "D  E  F  G  A  Bb  C",
  "Harmonic minor": "D  E  F  G  A  Bb  C#",
  "Melodic minor (jazz)": "D  E  F  G  A  B  C#",
  Dorian: "D  E  F  G  A  B  C",
  Phrygian: "D  Eb  F  G  A  Bb  C",
  Lydian: "D  E  F#  G#  A  B  C#",
  Mixolydian: "D  E  F#  G  A  B  C",
  Locrian: "D  Eb  F  G  Ab  Bb  C",
};
const pitches = [
  [69, 65, 64, 65, 67, 71, 69, 67, 65, 69, 64, 67, 67, 71, 69, 62],
  [74, 69, 69, 69, 74, 74, 74, 71, 69, 74, 69, 72, 71, 74, 74, 65],
  [65, 62, 62, 62, 62, 67, 67, 62, 62, 65, 60, 64, 62, 67, 65, 57],
  [62, 57, 57, 57, 59, 62, 62, 59, 57, 62, 57, 60, 59, 62, 62, 53],
  [57, 50, 50, 50, 55, 55, 55, 55, 50, 57, 52, 57, 55, 55, 57, 50],
];

export function createState() {
  return {
    count: 4, selected: 1, style: "Close", scale: "Dorian", bpm: 96,
    muted: [], solo: null, playing: false, fade: true, speed: 75,
    snap: true, locked: true, variant: "A",
    notes: pitches.map(voice => voice.map((pitch, index) => ({
      pitch, beat: index * 2, duration: index === 15 ? 2 : 1.8,
    }))),
  };
}

const esc = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[char]);
const rect = (x, y, w, h, fill, stroke = "none", radius = 0, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke = c.faint, width = 1, extra = "") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const text = (x, y, value, size = 14, fill = c.ink, weight = 400, extra = "") =>
  `<text x="${x}" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" fill="${fill}" font-weight="${weight}" ${extra}>${esc(value)}</text>`;
const dot = (x, y, r, fill, stroke = "none") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
const group = (id, content, action = "", label = "") =>
  `<g id="${id}" ${action ? `class="action" data-action="${esc(action)}" role="button" tabindex="0" aria-label="${esc(label || action)}"` : ""}>${content}</g>`;

function icon(name, x, y, color = c.ink, size = 18) {
  const paths = {
    play: '<path d="M7 4 L20 12 L7 20 Z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5 V19 M16 5 V19" stroke-width="4"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none"/>',
    chevron: '<path d="M7 10 L12 15 L17 10"/>',
    arrow: '<path d="M5 12 H19 M14 7 L19 12 L14 17"/>',
    back: '<path d="M19 12 H5 M10 7 L5 12 L10 17"/>',
    check: '<path d="M5 12 L10 17 L19 7"/>',
    plus: '<path d="M12 5 V19 M5 12 H19"/>',
    loop: '<path d="M4 10 V8 A3 3 0 0 1 7 5 H19 M16 2 L19 5 L16 8 M20 14 V16 A3 3 0 0 1 17 19 H5 M8 16 L5 19 L8 22"/>',
    mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11 V12 A7 7 0 0 0 19 12 V11 M12 19 V23 M8 23 H16"/>',
    upload: '<path d="M12 16 V3 M7 8 L12 3 L17 8 M4 16 V21 H20 V16"/>',
    download: '<path d="M12 3 V16 M7 11 L12 16 L17 11 M4 17 V21 H20 V17"/>',
    undo: '<path d="M8 5 L3 10 L8 15 M3 10 H14 A6 6 0 0 1 20 16 V19"/>',
    redo: '<path d="M16 5 L21 10 L16 15 M21 10 H10 A6 6 0 0 0 4 16 V19"/>',
    lock: '<rect x="6" y="10" width="12" height="11" rx="2"/><path d="M8 10 V6 A4 4 0 0 1 16 6 V10"/>',
    headphones: '<path d="M4 14 V11 A8 8 0 0 1 20 11 V14"/><rect x="3" y="12" width="5" height="9" rx="2"/><rect x="16" y="12" width="5" height="9" rx="2"/>',
    align: '<path d="M7 3 V21 M3 7 H19 M15 3 L19 7 L15 11 M11 14 H21 M11 18 H18"/>',
    note: '<path d="M10 17 V5 L19 3 V15"/><ellipse cx="6" cy="18" rx="4" ry="3"/><ellipse cx="15" cy="16" rx="4" ry="3"/>',
  };
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="currentColor" color="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.note}</g>`;
}

function button(x, y, w, label, action, primary = false, h = 38, glyph = "") {
  const fill = primary ? c.accent : c.paper;
  const fg = primary ? c.paper : c.ink;
  return group(`button-${action}-${x}-${y}`, rect(x, y, w, h, fill, primary ? fill : "#CDD7D0", 7)
    + (glyph ? icon(glyph, x + 13, y + (h - 18) / 2, fg) : "")
    + text(x + (glyph ? 40 : w / 2), y + h / 2 + 5, label, 13, fg, 600,
      glyph ? "" : 'text-anchor="middle"'), action, label);
}

function field(x, y, w, label, value, action = "settings") {
  return group(`field-${label.replace(/\W/g, "")}-${x}`, text(x, y, label, 12, c.muted, 600)
    + rect(x, y + 13, w, 46, c.paper, "#CBD6CE", 7)
    + text(x + 15, y + 43, value, 16, c.ink, 600)
    + icon("chevron", x + w - 31, y + 27, c.muted), action, `Change ${label}`);
}

function pill(x, y, value, fill = c.soft, fg = c.accent, w = 100) {
  return rect(x, y, w, 26, fill, "none", 13)
    + text(x + w / 2, y + 17, value, 11, fg, 600, 'text-anchor="middle"');
}

function toggle(x, y, on, action, label) {
  return group(`toggle-${action}`, rect(x, y, 32, 19, on ? c.accent : "#B6C3BA", "none", 10)
    + dot(x + (on ? 23 : 9), y + 9.5, 6.5, c.paper), action, label);
}

function slider(x, y, w, value, color = c.accent) {
  return line(x, y, x + w, y, "#DDE4DF", 4, 'stroke-linecap="round"')
    + line(x, y, x + w * value, y, color, 4, 'stroke-linecap="round"')
    + dot(x + w * value, y, 5, c.paper, color);
}

function header(active, title = "Morning light") {
  const nav = [["setup", "Song setup"], ["workspace", "Write"], ["learn", "Learn my part"]];
  let body = rect(0, 0, WIDTH, 68, c.paper) + line(0, 68, WIDTH, 68)
    + rect(24, 20, 30, 29, c.accent, "none", 7)
    + icon("note", 28, 23, c.paper, 23)
    + text(65, 41, "Second Voice", 18, c.ink, 650)
    + line(212, 23, 212, 47) + text(233, 41, title, 14, c.ink, 500)
    + pill(352, 24, "EXAMPLE SONG", c.ground, c.muted, 106);
  nav.forEach(([key, label], i) => {
    const x = [848, 997, 1090][i];
    const w = [130, 75, 143][i];
    body += group(`navigation-${key}`, rect(x, 17, w, 35, active === key ? c.soft : "transparent", "none", 6)
      + text(x + w / 2, 40, label, 13, active === key ? c.accent : c.muted,
        active === key ? 650 : 500, 'text-anchor="middle"'), key, label);
  });
  return body + button(1280, 18, 136, "Export", "export", false, 34, "download");
}

function footer(left = "Desktop UI concept. All notes and takes shown are illustrative.") {
  return line(24, 945, 1416, 945) + text(24, 966, left, 11, c.muted)
    + text(1416, 966, "SECOND VOICE / UI STUDY", 10, c.muted, 600, 'text-anchor="end"');
}

function screen(name, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="group" aria-label="${esc(name)}">
<!-- THESIS: One lead becomes editable, singable harmony; the note workspace is the focus, not an AI chat.
OWN-WORLD: A light, restrained desktop wireframe with workhorse type and five semantic part colors.
STORY: Set musical context, review the extracted notes, arrange up to four parts, then rehearse.
FIRST VIEWPORT: Context above the timeline; voices beside it; generation and range controls at right.
FORM: Functional mockup, not a finished brand system. Primitive SVG geometry stays editable in Figma. -->
<title>${esc(name)} - Second Voice UI mockup</title>
<desc>Illustrative desktop interface for a songwriter's harmony sketchpad. This is a design mockup, not a transcription service.</desc>
<style>.action{cursor:pointer}.action:focus{outline:2px solid #226A53;outline-offset:3px}.action:hover{opacity:.84}text{pointer-events:none}.editable-note{cursor:ns-resize}</style>
${rect(0, 0, WIDTH, HEIGHT, c.ground)}
${body}
</svg>`;
}

export function setupScreen(state) {
  let body = header("setup") + text(64, 145, "Start with your song.", 32, c.ink, 650)
    + text(64, 177, "Set the tempo and chord changes. Then bring in one clean melody.", 16, c.muted)
    + pill(1184, 127, "1 / 3  SONG SETUP", c.paper, c.muted, 192)
    + field(64, 230, 344, "Song name", "Morning light", "song-name")
    + field(432, 230, 160, "Tempo", `${state.bpm} BPM`, "tempo")
    + field(616, 230, 152, "Time signature", "4/4", "meter")
    + field(792, 230, 152, "Tonal center", "D", "tonic")
    + field(968, 230, 408, "Scale / mode", state.scale, "scale-menu");
  body += text(64, 363, "Your chord progression", 20, c.ink, 650)
    + text(1376, 360, `8 bars / ${Math.round(32 * 60 / state.bpm)} seconds`, 13, c.muted, 500, 'text-anchor="end"')
    + text(64, 392, "Each block is one bar. Set the chord before you add the melody.", 14, c.muted);
  chords.forEach((chord, i) => {
    const x = 64 + i * 166;
    body += text(x + 1, 427, `BAR ${i + 1}`, 10, c.muted, 600)
      + group(`setup-chord-${i}`, rect(x, 441, 150, 87, c.paper, "#CAD6CD", 7)
        + text(x + 17, 480, chord, 25, c.ink, 600)
        + text(x + 17, 508, "4 beats", 12, c.muted)
        + icon("chevron", x + 116, 468, c.muted), "chord-menu", `Edit chord in bar ${i + 1}`);
  });
  body += button(64, 552, 169, "Preview chords", "preview-chords", false, 38, "play")
    + button(247, 552, 116, "Add bar", "add-bar", false, 38, "plus")
    + text(1376, 577, `D ${state.scale}:  ${scaleNotes[state.scale]}`, 13, c.muted, 500, 'text-anchor="end"')
    + line(64, 628, 1376, 628)
    + text(64, 674, "Bring in your melody", 23, c.ink, 650)
    + text(64, 704, "One voice, no backing track. You can fix the detected notes in the next step.", 14, c.muted);
  body += group("capture-record", rect(64, 729, 644, 119, c.paper, "#CAD6CD", 9)
    + dot(111, 775, 24, c.soft) + icon("mic", 100, 763, c.accent, 22)
    + text(151, 770, "Record a melody", 17, c.ink, 650)
    + text(151, 796, "Count-in + click at your tempo. Headphones recommended.", 13, c.muted)
    + icon("arrow", 663, 769, c.accent, 21), "record", "Record a melody")
    + group("capture-upload", rect(732, 729, 644, 119, c.paper, "#CAD6CD", 9)
      + dot(780, 775, 24, c.ground) + icon("upload", 769, 763, c.muted, 22)
      + text(820, 770, "Upload a clean take", 17, c.ink, 650)
      + text(820, 796, "Choose an audio file. Match your recording to the tempo.", 13, c.muted)
      + icon("arrow", 1332, 769, c.muted, 21), "upload", "Upload a clean take")
    + icon("check", 64, 884, c.accent)
    + text(91, 898, "Tempo and chord timing are ready. Your melody comes next.", 13, c.muted)
    + button(1142, 876, 234, "Continue to melody", "review", true, 42, "arrow");
  return screen("01 Song setup and melody capture", body + footer());
}

export const grid = { x: 280, y: 317, width: 882, row: 16, top: 76, bottom: 48, beatWidth: 882 / 32 };
export const pitchName = midi => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((midi % 12) + 12) % 12]
  + (Math.floor(midi / 12) - 1);

function pianoRoll(state, review) {
  const { x, y, width, row, top, bottom, beatWidth } = grid;
  const height = (top - bottom + 1) * row;
  let body = rect(x - 60, y, width + 60, height, c.paper);
  for (let pitch = top; pitch >= bottom; pitch--) {
    const yy = y + (top - pitch) * row;
    const black = [1, 3, 6, 8, 10].includes(pitch % 12);
    body += rect(x, yy, width, row, black ? "#F1F4F2" : "#FBFCFB")
      + line(x, yy, x + width, yy, pitch % 12 === 0 ? "#C4D0C7" : "#E5EBE6");
    body += rect(x - 59, yy, 58, row, c.paper, "#DAE2DC");
    if (black) body += rect(x - 59, yy + 1, 33, row - 2, "#52615A", "none", 1);
    else body += text(x - 8, yy + 12, pitchName(pitch), 9, c.muted, pitch % 12 === 0 ? 700 : 400, 'text-anchor="end"');
  }
  for (let beat = 0; beat <= 32; beat++) {
    body += line(x + beat * beatWidth, y, x + beat * beatWidth, y + height,
      beat % 4 === 0 ? "#BACBBF" : "#E0E7E1", beat % 4 === 0 ? 1.25 : .65);
  }
  chords.forEach((chord, i) => {
    const xx = x + i * width / 8;
    body += text(xx + 8, 263, String(i + 1), 11, c.muted, 600)
      + rect(xx + 3, 277, width / 8 - 6, 31, "#EAF0EB", "none", 4)
      + text(xx + 13, 298, chord, 14, c.ink, 600);
  });
  body += group("loop-bracket", line(x, 244, x + width, 244, c.accent, 2)
    + line(x, 243, x, 250, c.accent, 2) + line(x + width, 243, x + width, 250, c.accent, 2));
  state.notes.forEach((notes, voice) => {
    if (voice > state.count || (review && voice > 0)) return;
    const part = parts[voice];
    const opacity = state.muted.includes(voice) || (state.solo !== null && state.solo !== voice) ? .18 : 1;
    let layer = "";
    notes.forEach((note, index) => {
      const xx = x + note.beat * beatWidth + 2;
      const yy = y + (top - note.pitch) * row + 2;
      const w = Math.max(14, note.duration * beatWidth - 3);
      const chosen = voice === (review ? 0 : state.selected) && index === 5;
      layer += `<g class="editable-note" data-note="${voice}:${index}" role="button" tabindex="0" aria-label="${esc(`${part.name}, ${pitchName(note.pitch)}, beat ${note.beat + 1}. Drag to edit.`)}">`
        + rect(xx, yy, w, 12, voice === 0 ? part.color : part.tint, part.color, 3, `stroke-width="${chosen ? 2 : .8}"`)
        + text(xx + 5, yy + 9.3, pitchName(note.pitch), 9, voice === 0 ? c.paper : part.color, 650)
        + (chosen ? rect(xx + w - 4, yy + 3, 2, 6, part.color, "none", 1) : "")
        + "</g>";
    });
    body += `<g id="notes-${voice === 0 ? "original-melody" : `harmony-${voice}`}" opacity="${opacity}">${layer}</g>`;
  });
  body += group("playhead", line(x + 2, 253, x + 2, y + height, "#263D33", 1.3)
    + `<path d="M${x - 2} 250 H${x + 6} L${x + 2} 256 Z" fill="#263D33"/>`);
  return body;
}

function trackList(state, review) {
  let body = text(24, 226, "PARTS", 11, c.muted, 700)
    + text(196, 226, review ? "1 voice" : `${state.count + 1} voices`, 11, c.muted, 500, 'text-anchor="end"');
  parts.forEach((part, i) => {
    const yy = 251 + i * 86;
    const enabled = i === 0 || (!review && i <= state.count);
    const selected = (review ? 0 : state.selected) === i;
    let content = rect(12, yy, 192, 78, selected ? c.soft : c.ground, "none", 7)
      + dot(30, yy + 21, 4, enabled ? part.color : "#B5C2B8")
      + text(42, yy + 26, part.name, 13, enabled ? c.ink : "#738478", 600)
      + text(25, yy + 47, enabled ? part.role : "Not generated", 10, c.muted);
    if (enabled) {
      content += group(`mute-${i}`, rect(142, yy + 36, 24, 24, state.muted.includes(i) ? c.ink : c.paper, "#D5DFD7", 4)
        + text(154, yy + 52, "M", 10, state.muted.includes(i) ? c.paper : c.muted, 700, 'text-anchor="middle"'), `mute:${i}`, `Mute ${part.name}`)
        + group(`solo-${i}`, rect(172, yy + 36, 24, 24, state.solo === i ? part.color : c.paper, "#D5DFD7", 4)
          + text(184, yy + 52, "S", 10, state.solo === i ? c.paper : c.muted, 700, 'text-anchor="middle"'), `solo:${i}`, `Solo ${part.name}`)
        + slider(26, yy + 64, 98, i === 0 ? .74 : .55, part.color);
    }
    body += group(`track-${i}`, content, enabled ? `track:${i}` : "generate", `Select ${part.name}`);
  });
  body += line(24, 695, 196, 695) + dot(30, 725, 4, c.muted)
    + text(42, 730, "Backing chords", 13, c.ink, 600)
    + text(25, 751, "Piano / lower in the mix", 10, c.muted)
    + slider(26, 772, 155, .35, "#6D8073")
    + text(24, 822, "One color per voice.", 11, c.muted)
    + text(24, 840, "Solo a part to hear its line.", 11, c.muted);
  return body;
}

function inspector(state, review) {
  const x = 1184;
  let body = text(x, 227, review ? "Review your melody" : "Harmony settings", 16, c.ink, 650);
  if (review) {
    return body + text(x, 266, "Listen once before you arrange.", 12, c.muted)
      + text(x, 288, "Fix a few notes here, or record", 12, c.muted)
      + text(x, 308, "again if the take feels off.", 12, c.muted)
      + line(x, 336, 1414, 336)
      + text(x, 366, "Pitch", 12, c.ink, 650) + text(x, 387, "Drag a note up or down.", 12, c.muted)
      + text(x, 429, "Timing", 12, c.ink, 650) + text(x, 450, "Move notes along the beat grid.", 12, c.muted)
      + text(x, 492, "Whole phrase", 12, c.ink, 650) + text(x, 513, "Shift the take to find beat one.", 12, c.muted)
      + button(x, 551, 228, "Align beat one", "align", false, 40, "align")
      + button(x, 605, 228, "Re-record melody", "record", false, 40, "mic")
      + button(x, 682, 228, "Generate harmonies", "generate", true, 44)
      + text(x + 114, 750, "Your lead stays unchanged.", 11, c.muted, 400, 'text-anchor="middle"');
  }
  body += text(x, 263, "Added harmony parts", 12, c.muted, 600);
  [1, 2, 3, 4].forEach((value, i) => {
    const xx = x + i * 58;
    body += group(`parts-count-${value}`, rect(xx, 279, 52, 37, value === state.count ? c.accent : c.paper, value === state.count ? c.accent : "#CDD7D0", 6)
      + text(xx + 26, 303, value, 14, value === state.count ? c.paper : c.ink, 650, 'text-anchor="middle"'),
    `count:${value}`, `${value} added harmony ${value === 1 ? "part" : "parts"}`);
  });
  body += text(x, 340, `${state.count} harmonies + your original lead`, 11, c.muted)
    + field(x, 379, 228, "Arrangement style", state.style, "style-menu")
    + line(x, 465, 1412, 465);
  const part = parts[state.selected];
  body += dot(x + 5, 495, 4, part.color) + text(x + 19, 500, part.name, 14, c.ink, 650)
    + text(x, 529, "Comfortable singing range", 12, c.muted)
    + field(x, 560, 105, "Lowest", part.range[0], "range-menu")
    + field(x + 123, 560, 105, "Highest", part.range[1], "range-menu")
    + toggle(x, 651, state.locked, "lock", "Keep edited notes")
    + text(x + 44, 666, "Keep edited notes", 12, c.ink, 600)
    + text(x, 695, "Regenerate around your changes.", 11, c.muted)
    + button(x, 725, 228, "Regenerate harmonies", "generate", true, 43)
    + text(x + 114, 792, "Your lead stays unchanged.", 11, c.muted, 400, 'text-anchor="middle"');
  return body;
}

export function workspaceScreen(state, review = false) {
  let body = header("workspace") + rect(0, 69, 1440, 118, c.paper)
    + text(24, 105, review ? "Make sure we heard you right." : "Find the part that fits.", 23, c.ink, 650)
    + text(24, 131, review ? "Review the detected melody before adding harmony." : "Audition the voices together. Shape each one into something you can sing.", 13, c.muted)
    + button(24, 146, 92, state.playing ? "Pause" : "Play", "play", true, 31, state.playing ? "pause" : "play")
    + button(126, 146, 36, "", "stop", false, 31, "stop")
    + button(173, 146, 84, "Loop", "loop", false, 31, "loop")
    + text(282, 167, "1.1.00", 15, c.ink, 600, 'font-variant-numeric="tabular-nums"')
    + text(368, 167, `${state.bpm} BPM`, 12, c.muted, 600)
    + text(463, 167, `D / ${state.scale}`, 12, c.muted, 600)
    + text(657, 167, "Guide: Piano", 12, c.muted)
    + group("undo-control", rect(1076, 146, 32, 31, "transparent") + icon("undo", 1082, 153, c.muted, 20), "undo", "Undo note edit")
    + group("redo-control", rect(1111, 146, 32, 31, "transparent") + icon("redo", 1117, 153, c.muted, 20), "redo", "Redo note edit")
    + button(1176, 146, 236, review ? "Continue to harmonies" : "Review original melody", review ? "generate" : "review", false, 31)
    + line(0, 187, 1440, 187) + line(216, 188, 216, 873)
    + line(1172, 188, 1172, 873) + rect(1173, 188, 267, 685, c.panel)
    + text(232, 225, "PIANO ROLL", 11, c.muted, 700)
    + pill(337, 207, review ? "MELODY REVIEW" : "EDITABLE PARTS", c.paper, c.muted, 116)
    + button(878, 204, 82, "Select", "select-tool", false, 28)
    + button(969, 204, 80, "Split", "split-tool", false, 28)
    + button(1058, 204, 104, state.snap ? "Snap: 1/8" : "Snap: off", "snap", false, 28)
    + pianoRoll(state, review) + trackList(state, review) + inspector(state, review)
    + text(280, 816, review ? "A few wrong notes? Edit. A whole take off? Re-record." : "Drag a note to change its pitch or timing. Your changes stay yours.", 12, c.muted)
    + text(280, 843, "Example take / 8 bars / single voice / timing edits are reversible", 11, c.muted)
    + rect(12, 881, 1416, 50, c.paper, "#D8E1DA", 8);
  if (review) {
    body += icon("headphones", 29, 895, c.accent, 22)
      + text(66, 913, "Listen with the backing chords to confirm the timing.", 13, c.ink, 500)
      + button(1225, 889, 190, "Melody sounds right", "generate", true, 34, "check");
  } else {
    body += icon("headphones", 29, 895, c.accent, 22)
      + text(66, 913, "Found your part? Learn to hold it against the lead.", 13, c.ink, 500)
      + button(1219, 889, 196, "Learn my part", "learn", true, 34, "arrow");
  }
  return screen(review ? "02 Melody review and correction" : "03 Five-voice harmony workspace", body + footer());
}

export function learnScreen(state) {
  const selected = Math.max(1, Math.min(state.selected, state.count));
  const part = parts[selected];
  let body = header("learn") + text(48, 139, "Make the harmony your own.", 30, c.ink, 650)
    + text(48, 174, "Listen to your line. Sing it with the lead. Let the guide fade away.", 15, c.muted)
    + button(1192, 121, 200, "Back to workspace", "workspace", false, 38, "back")
    + line(48, 205, 1392, 205)
    + text(48, 250, "Your practice part", 16, c.ink, 650)
    + field(48, 289, 286, "Voice", part.name, "practice-part")
    + field(48, 388, 130, "Phrase", "Bars 3 - 4", "phrase")
    + field(194, 388, 140, "Speed", `${state.speed}%`, "speed")
    + text(48, 506, "Practice mix", 14, c.ink, 650);
  [["Your melody", .55, parts[0].color], [part.name, 1, part.color], ["Backing chords", .35, c.muted]].forEach(([label, value, color], i) => {
    const yy = 545 + i * 63;
    body += dot(53, yy - 4, 4, color) + text(68, yy, label, 12, c.ink, 500)
      + text(334, yy, `${Math.round(value * 100)}%`, 11, c.muted, 500, 'text-anchor="end"')
      + slider(50, yy + 22, 282, value, color);
  });
  body += toggle(48, 751, state.fade, "fade", "Fade the harmony guide")
    + text(93, 765, "Fade the harmony guide", 13, c.ink, 600)
    + text(48, 795, "A little quieter each time the phrase loops.", 12, c.muted)
    + text(48, 815, "The lead stays with you.", 12, c.muted)
    + line(368, 237, 368, 869)
    + pill(410, 238, part.name.toUpperCase(), part.tint, part.color, 128)
    + text(564, 257, "Bars 3 - 4 / G to G", 13, c.muted)
    + text(410, 312, "Hold your part against the lead.", 25, c.ink, 650)
    + text(410, 344, "The colored notes are yours. The original melody stays in the background.", 13, c.muted);
  const visiblePitches = [...state.notes[0], ...state.notes[selected]].map(note => note.pitch);
  const top = Math.max(...visiblePitches) + 2;
  const bottom = Math.min(...visiblePitches) - 2;
  const x = 461, y = 415, w = 883, chartHeight = 288, row = chartHeight / (top - bottom + 1);
  body += rect(410, 375, 982, 386, c.paper, "#D6DFD8", 8);
  for (let pitch = top; pitch >= bottom; pitch--) {
    const yy = y + (top - pitch) * row;
    const black = [1, 3, 6, 8, 10].includes(pitch % 12);
    body += rect(x, yy, w, row, black ? "#F1F4F2" : "#FCFDFC")
      + line(x, yy, x + w, yy, pitch % 12 === 0 ? "#C8D3CB" : "#E6EBE7");
    if (pitch % 12 === 0 || pitch === 74) body += text(x - 12, yy + 9, pitchName(pitch), 9, c.muted, 500, 'text-anchor="end"');
  }
  for (let beat = 0; beat <= 8; beat++) body += line(x + beat * w / 8, y, x + beat * w / 8, y + chartHeight, beat % 4 === 0 ? "#C0CEC4" : "#E0E7E1");
  body += text(x + 5, 403, "3", 11, c.muted, 650) + text(x + w / 2 + 5, 403, "4", 11, c.muted, 650);
  [0, selected].forEach(voice => {
    state.notes[voice].filter(note => note.beat >= 8 && note.beat < 16).forEach(note => {
      const xx = x + (note.beat - 8) * w / 8 + 4;
      const yy = y + (top - note.pitch) * row + 1;
      const noteWidth = Math.min(note.duration, 16 - note.beat) * w / 8 - 8;
      const noteHeight = Math.max(9, row - 3);
      body += rect(xx, yy, noteWidth, noteHeight, voice === 0 ? "#DAE2DC" : part.tint, voice === 0 ? "#A1B2A6" : part.color, 3)
        + text(xx + 8, yy + noteHeight - 2, pitchName(note.pitch), Math.min(11, noteHeight - 1), voice === 0 ? "#536B5A" : part.color, 650);
    });
  });
  body += group("playhead", line(x, y - 4, x, y + chartHeight, c.ink, 1.3))
    + icon("loop", 428, 726, c.muted, 16)
    + text(452, 739, "This phrase repeats. Stop whenever you need.", 11, c.muted)
    + button(410, 790, 159, state.playing ? "Pause phrase" : "Play phrase", "play", true, 43, state.playing ? "pause" : "play")
    + pill(590, 799, "1. Listen", c.soft, c.accent, 109)
    + pill(708, 799, "2. Sing along", c.paper, c.muted, 132)
    + pill(849, 799, "3. Hold your part", c.paper, c.muted, 159)
    + line(48, 867, 1392, 867)
    + text(48, 902, "Ready to record the real thing?", 15, c.ink, 650)
    + text(48, 923, "Take a piano guide or MIDI part into your recording session.", 12, c.muted)
    + button(1057, 884, 157, "Piano guide", "guide-export", false, 38, "download")
    + button(1228, 884, 164, "MIDI part", "midi-export", false, 38, "download");
  return screen("04 Learn and rehearse a harmony part", body + footer());
}

export const screenNames = {
  setup: "Song setup", review: "Melody review", workspace: "Harmony workspace", learn: "Learn my part",
};
export function renderScreen(name, state = createState()) {
  if (name === "setup") return setupScreen(state);
  if (name === "review") return workspaceScreen(state, true);
  if (name === "workspace") return workspaceScreen(state);
  if (name === "learn") return learnScreen(state);
  throw new Error(`Unknown screen: ${name}`);
}
