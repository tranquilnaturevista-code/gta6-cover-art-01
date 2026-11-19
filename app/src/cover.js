// Vice City Cover Maker — the render engine. Everything the cover shows is drawn here on a 2D canvas:
// multi-panel photo layouts, colour grades, a procedural sunset sky with a sun disc, palm silhouettes, neon
// frames, halftone dots and bold outlined caption lettering. No image, font or artwork is borrowed from any
// game: the decoration is drawn from scratch with canvas paths, and the only font is Anton (SIL OFL, shipped
// under app/fonts/) with a system fallback.

export const DISPLAY_FONT = "'Anton', 'Arial Narrow', 'Impact', sans-serif";

// Each layout is a set of panel rectangles plus the caption band, all as fractions of the canvas size, so the
// same layout draws at 1080x1080, 1080x1350 and 1920x1080. `panels` is the number of photos the layout uses.
export const LAYOUTS = {
  grid: {
    label: 'Poster Grid',
    panels: 4,
    rects: [
      { x: 0.02, y: 0.02, w: 0.47, h: 0.36 },
      { x: 0.51, y: 0.02, w: 0.47, h: 0.36 },
      { x: 0.02, y: 0.40, w: 0.47, h: 0.36 },
      { x: 0.51, y: 0.40, w: 0.47, h: 0.36 },
    ],
    caption: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  hero: {
    label: 'Hero + Strip',
    panels: 4,
    rects: [
      { x: 0.02, y: 0.02, w: 0.96, h: 0.52 },
      { x: 0.02, y: 0.56, w: 0.3067, h: 0.20 },
      { x: 0.3467, y: 0.56, w: 0.3067, h: 0.20 },
      { x: 0.6733, y: 0.56, w: 0.3067, h: 0.20 },
    ],
    caption: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
  triptych: {
    label: 'Triptych',
    panels: 3,
    rects: [
      { x: 0.02, y: 0.02, w: 0.3067, h: 0.74 },
      { x: 0.3467, y: 0.02, w: 0.3067, h: 0.74 },
      { x: 0.6733, y: 0.02, w: 0.3067, h: 0.74 },
    ],
    caption: { x: 0, y: 0.78, w: 1, h: 0.22 },
  },
};

// A grade is a sunset sky, a sun colour, the neon accent used for frames and the caption shadow, and a
// translucent tint washed over each photo.
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    sky: ['#2b1055', '#7597de', '#ff7e5f', '#feb47b'],
    sun: '#ffd166',
    sunGlow: 'rgba(255, 190, 80, 0.55)',
    neon: '#ff2e88',
    neonSoft: '#ff7e5f',
    tint: 'rgba(255, 94, 98, 0.16)',
    tintDeep: 'rgba(123, 47, 247, 0.20)',
    frame: '#ffe66d',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#0b0620', '#1b2a6b', '#c724b1', '#00f5d4'],
    sun: '#ff2e88',
    sunGlow: 'rgba(255, 46, 136, 0.5)',
    neon: '#00f5d4',
    neonSoft: '#ff2e88',
    tint: 'rgba(0, 245, 212, 0.12)',
    tintDeep: 'rgba(199, 36, 177, 0.22)',
    frame: '#00f5d4',
  },
  golden: {
    label: 'Golden Hour',
    sky: ['#3d1c02', '#7a3b06', '#e07b00', '#ffd166'],
    sun: '#fff3b0',
    sunGlow: 'rgba(255, 209, 102, 0.55)',
    neon: '#ff9e00',
    neonSoft: '#ffd166',
    tint: 'rgba(255, 158, 0, 0.14)',
    tintDeep: 'rgba(139, 37, 0, 0.20)',
    frame: '#ffd166',
  },
};

export const EXPORT_SIZES = [
  { label: '1080 x 1080', w: 1080, h: 1080 },
  { label: '1080 x 1350', w: 1080, h: 1350 },
  { label: '1920 x 1080', w: 1920, h: 1080 },
];

// How far a photo may be panned inside its panel at the current zoom: the photo must keep covering the panel.
export function focusLimits(photo, rect, zoom) {
  if (!photo) return { maxDx: 0, maxDy: 0 };
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const pw = photo.naturalWidth * base * zoom;
  const ph = photo.naturalHeight * base * zoom;
  return {
    maxDx: Math.max(0, (pw - rect.w) / 2 / rect.w),
    maxDy: Math.max(0, (ph - rect.h) / 2 / rect.h),
  };
}

// Draws one photo into a panel rectangle, cover-fit, with the panel's zoom and pan applied.
export function drawPanelPhoto(ctx, photo, rect, focus) {
  if (!photo) return;
  const zoom = focus?.zoom ?? 1;
  const limits = focusLimits(photo, rect, zoom);
  const dx = Math.max(-limits.maxDx, Math.min(limits.maxDx, focus?.dx ?? 0));
  const dy = Math.max(-limits.maxDy, Math.min(limits.maxDy, focus?.dy ?? 0));
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const pw = photo.naturalWidth * base * zoom;
  const ph = photo.naturalHeight * base * zoom;
  ctx.drawImage(photo, rect.x + (rect.w - pw) / 2 + dx * rect.w, rect.y + (rect.h - ph) / 2 + dy * rect.h, pw, ph);
}

// The sunset sky: a vertical gradient with a soft glowing sun disc low in the band.
export function drawSunsetBackdrop(ctx, w, h, grade, band) {
  const sky = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  grade.sky.forEach((stop, i) => sky.addColorStop(i / (grade.sky.length - 1), stop));
  ctx.fillStyle = sky;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  const cx = band.x + band.w / 2;
  const cy = band.y + band.h * 0.60;
  const r = band.h * 0.70;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.9);
  glow.addColorStop(0, grade.sunGlow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Two darker slats across the sun's lower half, kept clear of the subtitle line below.
  ctx.save();
  ctx.fillStyle = grade.sky[0];
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 2; i++) {
    const sy = cy + r * (0.10 + i * 0.20);
    ctx.fillRect(cx - r, sy, r * 2, r * 0.07);
  }
  ctx.restore();
}

// A palm tree silhouette, drawn from scratch: a curved trunk and seven tapering fronds.
export function drawPalmSilhouette(ctx, x, y, size, flip, color) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  // Trunk, leaning out from the corner.
  ctx.lineWidth = size * 0.045;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.10, -size * 0.45, size * 0.34, -size * 0.78);
  ctx.stroke();
  const topX = size * 0.34;
  const topY = -size * 0.78;
  // Fronds fanning out from the crown.
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (0.08 + (i / 6) * 0.84);
    const len = size * (0.42 - Math.abs(i - 3) * 0.045);
    const tipX = topX + Math.cos(angle) * len;
    const tipY = topY - Math.sin(angle) * len * 0.55 + len * 0.28;
    ctx.lineWidth = size * 0.028;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(angle) * len * 0.55,
      topY - Math.sin(angle) * len * 0.5,
      tipX,
      tipY,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// A field of halftone dots, larger towards the edges of the band.
export function drawHalftoneDots(ctx, band, color) {
  const step = Math.max(14, band.h * 0.16);
  ctx.fillStyle = color;
  for (let y = band.y + step / 2; y < band.y + band.h; y += step) {
    for (let x = band.x + step / 2; x < band.x + band.w; x += step) {
      const edge = Math.min(x - band.x, band.x + band.w - x) / (band.w / 2);
      const r = step * 0.10 * (1 - edge * 0.6) + step * 0.02;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// The caption: condensed display lettering, uppercase, filled white with a dark outline and an offset neon
// shadow, shrunk until it fits the band. The subtitle sits beneath it in spaced capitals.
export function drawCaptionLettering(ctx, band, caption, subtitle, grade) {
  const text = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  const cx = band.x + band.w / 2;
  if (text) {
    let size = band.h * 0.52;
    ctx.font = `${size}px ${DISPLAY_FONT}`;
    while (ctx.measureText(text).width > band.w * 0.94 && size > 10) {
      size -= 2;
      ctx.font = `${size}px ${DISPLAY_FONT}`;
    }
    const baseline = band.y + band.h * (sub ? 0.52 : 0.62);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    // Offset neon shadow first, then the dark outline, then the white fill.
    ctx.fillStyle = grade.neon;
    ctx.globalAlpha = 0.9;
    ctx.fillText(text, cx + size * 0.045, baseline + size * 0.06);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#14061f';
    ctx.lineWidth = Math.max(2, size * 0.075);
    ctx.strokeText(text, cx, baseline);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, baseline);
  }
  if (sub) {
    let size = band.h * 0.115;
    ctx.font = `600 ${size}px 'Arial Narrow', Impact, sans-serif`;
    while (ctx.measureText(sub).width > band.w * 0.9 && size > 8) {
      size -= 1;
      ctx.font = `600 ${size}px 'Arial Narrow', Impact, sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.92;
    ctx.fillText(sub, cx, band.y + band.h * 0.88);
    ctx.globalAlpha = 1;
  }
}

// The whole cover. `state` is { photos, layout, grade, caption, subtitle, focus } where photos and focus are
// per-panel arrays (photos hold Images or null, focus holds { zoom, dx, dy }).
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.grid;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const unit = Math.min(w, h);

  // Deep base, then the sunset sky shows through the gutters and fills the caption band.
  ctx.fillStyle = grade.sky[0];
  ctx.fillRect(0, 0, w, h);
  const band = {
    x: layout.caption.x * w,
    y: layout.caption.y * h,
    w: layout.caption.w * w,
    h: layout.caption.h * h,
  };
  drawSunsetBackdrop(ctx, w, h, grade, { x: 0, y: 0, w, h });

  // Panels: photo (or a dark placeholder), grade tint, neon frame.
  layout.rects.forEach((frac, i) => {
    const rect = { x: frac.x * w, y: frac.y * h, w: frac.w * w, h: frac.h * h };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const photo = state.photos?.[i] ?? null;
    if (photo) {
      drawPanelPhoto(ctx, photo, rect, state.focus?.[i]);
    } else {
      ctx.fillStyle = '#1c0b2e';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = `600 ${Math.max(12, rect.h * 0.07)}px 'Arial Narrow', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`PANEL ${i + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // Warm wash from the top, deeper grade wash from the bottom.
    const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    wash.addColorStop(0, grade.tint);
    wash.addColorStop(1, grade.tintDeep);
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    // Neon frame: a bright inner line and a soft outer glow line.
    ctx.save();
    ctx.strokeStyle = grade.frame;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(2, unit * 0.006);
    ctx.strokeRect(rect.x - unit * 0.004, rect.y - unit * 0.004, rect.w + unit * 0.008, rect.h + unit * 0.008);
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(1.5, unit * 0.003);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });

  // Palm silhouettes leaning in from the two top corners, over the panels. Each palm is drawn from its
  // base, so the base sits low in the panel area and the crown rises towards the top edge.
  const palm = unit * 0.30;
  const palmBaseY = unit * 0.36;
  drawPalmSilhouette(ctx, -unit * 0.02, palmBaseY, palm, false, 'rgba(16, 4, 28, 0.88)');
  drawPalmSilhouette(ctx, w + unit * 0.02, palmBaseY, palm, true, 'rgba(16, 4, 28, 0.88)');

  // Caption band: a fresh sky behind the lettering (it was painted over by the panels' sky), halftone dots,
  // then the lettering on top.
  drawSunsetBackdrop(ctx, w, h, grade, band);
  drawHalftoneDots(ctx, band, 'rgba(255, 255, 255, 0.20)');
  drawCaptionLettering(ctx, band, state.caption, state.subtitle, grade);

  // Thin neon frame around the whole cover.
  ctx.save();
  ctx.strokeStyle = grade.neon;
  ctx.lineWidth = Math.max(2, unit * 0.005);
  ctx.strokeRect(unit * 0.008, unit * 0.008, w - unit * 0.016, h - unit * 0.016);
  ctx.restore();
}
