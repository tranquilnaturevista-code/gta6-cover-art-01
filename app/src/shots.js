// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo loaded in every panel;
// ?shot=cover shows only the cover canvas, full-viewport. Query params set the scene: `photo` picks the
// sample (boulevard or pier), `caption` and `subtitle` the words, `layout` one of grid, hero or triptych,
// `grade` one of sunset, neon or golden, and `size` a WxH export size (cover mode only).
// window.__shotReady is set once the scene has painted, after two animation frames.
const SIZES = {
  '1080x1080': { w: 1080, h: 1080 },
  '1080x1350': { w: 1080, h: 1350 },
  '1920x1080': { w: 1920, h: 1080 },
};

export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const sizeParam = query.get('size');
  const scene = {
    photo: query.get('photo') ?? 'pier',
    caption: query.get('caption') ?? 'VICE CITY NIGHTS',
    subtitle: query.get('subtitle') ?? 'A STORY IN THREE ACTS',
    layout: query.get('layout') ?? 'grid',
    grade: query.get('grade') ?? 'sunset',
    size: sizeParam && SIZES[sizeParam] ? SIZES[sizeParam] : null,
  };
  await apply(scene);
  try {
    await document.fonts.ready;
  } catch {
    // The fallback stack still paints; the screenshot does not depend on the font loading.
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
