// Vice City Cover Maker — the editor: photo uploads, per-panel assignment and crop, layout and grade
// pickers, caption editing, drag-to-pan on the preview, and one-click PNG export in the three post sizes.
// Photos are read on this machine only, with FileReader / object URLs; nothing is ever uploaded.
import { drawCover, focusLimits, LAYOUTS, GRADES, EXPORT_SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const statusLine = document.getElementById('status');
const zoomSlider = document.getElementById('zoom');
const panelThumbs = document.getElementById('panel-thumbs');

const state = {
  layout: 'grid',
  grade: 'sunset',
  caption: 'VICE CITY NIGHTS',
  subtitle: 'A STORY IN THREE ACTS',
  photos: [null, null, null, null],
  focus: [
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
  ],
  selected: 0,
  exportSize: EXPORT_SIZES[0],
};

function activePanelCount() {
  return LAYOUTS[state.layout].panels;
}

function setStatus(message) {
  statusLine.textContent = message;
}

function redraw() {
  drawCover(canvas, state);
  renderPanelThumbs();
}

// The strip of per-panel thumbnails: each shows the photo assigned to that panel; click to select it.
function renderPanelThumbs() {
  const count = activePanelCount();
  panelThumbs.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb' + (i === state.selected ? ' selected' : '');
    button.setAttribute('aria-label', `Select panel ${i + 1}`);
    const img = document.createElement('img');
    img.alt = '';
    if (state.photos[i]) img.src = state.photos[i].src;
    button.append(img);
    const tag = document.createElement('span');
    tag.textContent = `Panel ${i + 1}`;
    button.append(tag);
    button.addEventListener('click', () => {
      state.selected = i;
      zoomSlider.value = String(state.focus[i].zoom);
      redraw();
    });
    panelThumbs.append(button);
  }
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function assignPhotoToSelected(url) {
  const img = await loadImage(url);
  state.photos[state.selected] = img;
  state.focus[state.selected] = { zoom: 1, dx: 0, dy: 0 };
  zoomSlider.value = '1';
  redraw();
  setStatus(`Photo added to panel ${state.selected + 1}.`);
}

document.getElementById('photo').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  await assignPhotoToSelected(URL.createObjectURL(file));
  event.target.value = '';
});

document.getElementById('sample-boulevard').addEventListener('click', () => {
  assignPhotoToSelected('samples/boulevard.jpg');
});
document.getElementById('sample-pier').addEventListener('click', () => {
  assignPhotoToSelected('samples/pier.jpg');
});

document.getElementById('fill-all').addEventListener('click', () => {
  const photo = state.photos[state.selected];
  if (!photo) {
    setStatus('Pick a photo for a panel first, then fill all panels with it.');
    return;
  }
  for (let i = 0; i < activePanelCount(); i++) {
    state.photos[i] = photo;
    state.focus[i] = { ...state.focus[state.selected] };
  }
  redraw();
  setStatus(`All ${activePanelCount()} panels filled with the panel ${state.selected + 1} photo.`);
});

document.querySelectorAll('#layout-picker button').forEach((button) => {
  button.addEventListener('click', () => {
    state.layout = button.dataset.layout;
    state.selected = 0;
    document.querySelectorAll('#layout-picker button').forEach((b) => {
      b.classList.toggle('active', b === button);
    });
    redraw();
    setStatus(`Layout: ${LAYOUTS[state.layout].label}.`);
  });
});

document.querySelectorAll('#grade-picker button').forEach((button) => {
  button.addEventListener('click', () => {
    state.grade = button.dataset.grade;
    document.querySelectorAll('#grade-picker button').forEach((b) => {
      b.classList.toggle('active', b === button);
    });
    redraw();
    setStatus(`Colour grade: ${GRADES[state.grade].label}.`);
  });
});

captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  redraw();
});

zoomSlider.addEventListener('input', () => {
  state.focus[state.selected].zoom = Number(zoomSlider.value);
  redraw();
});

// Drag on the preview to pan the selected panel's photo. Pointer coordinates are mapped from the displayed
// canvas back to its pixel size, then to the selected panel's rectangle.
let dragging = null;
function panelRectInCanvas(index) {
  const frac = LAYOUTS[state.layout].rects[index];
  return { x: frac.x * canvas.width, y: frac.y * canvas.height, w: frac.w * canvas.width, h: frac.h * canvas.height };
}
function pointToPanel(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * canvas.width;
  const y = ((clientY - box.top) / box.height) * canvas.height;
  for (let i = 0; i < activePanelCount(); i++) {
    const r = panelRectInCanvas(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return null;
}
canvas.addEventListener('pointerdown', (event) => {
  const hit = pointToPanel(event.clientX, event.clientY);
  if (hit === null) return;
  if (hit !== state.selected) {
    state.selected = hit;
    zoomSlider.value = String(state.focus[hit].zoom);
    redraw();
  }
  dragging = { x: event.clientX, y: event.clientY, focus: { ...state.focus[hit] } };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const box = canvas.getBoundingClientRect();
  const rect = panelRectInCanvas(state.selected);
  const scaleX = canvas.width / box.width;
  const scaleY = canvas.height / box.height;
  const photo = state.photos[state.selected];
  const focus = dragging.focus;
  const limits = focusLimits(photo, rect, focus.zoom);
  focus.dx = Math.max(-limits.maxDx, Math.min(limits.maxDx, focus.dx + ((event.clientX - dragging.x) * scaleX) / rect.w));
  focus.dy = Math.max(-limits.maxDy, Math.min(limits.maxDy, focus.dy + ((event.clientY - dragging.y) * scaleY) / rect.h));
  dragging.x = event.clientX;
  dragging.y = event.clientY;
  state.focus[state.selected] = focus;
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('pointercancel', () => { dragging = null; });

// Export: render the cover at the chosen post size on an offscreen canvas and download a real PNG.
function exportCover(size) {
  const offscreen = document.createElement('canvas');
  offscreen.width = size.w;
  offscreen.height = size.h;
  drawCover(offscreen, state);
  offscreen.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed — the browser could not make the PNG.');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
    setStatus(`Saved vice-city-cover-${size.w}x${size.h}.png (${size.w} x ${size.h}, ${(blob.size / 1024).toFixed(0)} KiB).`);
  }, 'image/png');
}

document.querySelectorAll('#export-buttons button').forEach((button) => {
  button.addEventListener('click', () => {
    const size = EXPORT_SIZES.find((s) => s.label === button.dataset.size);
    if (!size) return;
    state.exportSize = size;
    canvas.width = size.w;
    canvas.height = size.h;
    redraw();
    exportCover(size);
  });
});

// Load the display font before the first paint so the caption lettering uses Anton, not the fallback.
async function paintWhenReady() {
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.ready;
  } catch {
    // The system fallback stack still draws the caption; nothing else depends on the font.
  }
  redraw();
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (scene) => {
    if (scene.size) {
      canvas.width = scene.size.w;
      canvas.height = scene.size.h;
      state.exportSize = scene.size;
    }
    if (scene.layout && LAYOUTS[scene.layout]) {
      state.layout = scene.layout;
      document.querySelectorAll('#layout-picker button').forEach((b) => {
        b.classList.toggle('active', b.dataset.layout === scene.layout);
      });
    }
    if (scene.grade && GRADES[scene.grade]) {
      state.grade = scene.grade;
      document.querySelectorAll('#grade-picker button').forEach((b) => {
        b.classList.toggle('active', b.dataset.grade === scene.grade);
      });
    }
    if (scene.caption !== undefined) {
      state.caption = scene.caption;
      captionInput.value = scene.caption;
    }
    if (scene.subtitle !== undefined) {
      state.subtitle = scene.subtitle;
      subtitleInput.value = scene.subtitle;
    }
    if (scene.photo) {
      const img = await loadImage(`samples/${scene.photo}.jpg`);
      for (let i = 0; i < activePanelCount(); i++) state.photos[i] = img;
    }
    await paintWhenReady();
  });
} else {
  paintWhenReady();
}
