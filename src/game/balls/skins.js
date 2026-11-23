/** Catalogo delle palline: metadati e colori sono separati dal rendering di Phaser. */
export const BALL_SKINS = [
  ['Tigre', '#f08a1c'], ['Spicchi', '#e8742a'], ['Classica', '#ffffff'], ['Ghiaccio', '#8fd8f0'],
  ['Neon', '#ff3df2'], ['Oro', '#f2b705'], ['Lava', '#ff7a1a'], ['Anguria', '#2fa84f'],
  ['Smile', '#ffd93b'], ['Pianeta', '#d98e5b'], ['Disco', '#c7ccd6'], ['Bolla', '#ffb3e6'],
  ['Galassia', '#b36bff'], ['Cristallo', '#7fe3ff'], ['Occhio', '#2a9d8f'], ['Fulmine', '#ffe14d'],
  ['Cuore', '#ff4d6d'], ['Arcobaleno', '#4da6ff'], ['Cometa', '#9ad8ff'], ['Supernova', '#ff5a1f'],
  ['Scudo', '#5b6b8c'], ['Corona', '#ffd23f'],
].map(([name, color], id) => ({ id, name, color }));

// Palette trail dalla versione HTML; null usa una tinta animata nel tempo.
const TRAIL_COLORS = [
  '#6b5644', '#6b5644', '#6b5644', '#5fd0ff', '#ff3df2', '#ffd23f',
  '#ff6a1a', '#4cd964', '#ffe14d', '#e0a070', '#cfd6e6', null,
  '#b36bff', '#7fe3ff', '#ffffff', '#ffd23f', '#ff4d6d', null,
  '#9ad8ff', '#ffb347', '#7aa2ff', '#ffd23f',
];

/** Colore della scia: cambia con la skin, diventa verde sui rimbalzi potenziati. */
export function getTrailColor(skinId, tick, { boosted = false, dark = false } = {}) {
  if (boosted) return '#8dff9a';
  const baseColor = TRAIL_COLORS[skinId];
  if (dark && baseColor === '#6b5644') return '#9ad8ff';
  return baseColor || `hsl(${(tick * 9) % 360}, 90%, 65%)`;
}

/** Le prime 18 skin si sbloccano con le stelle; le ultime con record modalità. */
export function isSkinUnlocked(id, progress) {
  if (id === 0) return true;
  if (id < 12) return progress.stars.reduce((sum, stars) => sum + stars, 0) >= id * 3;
  if (id < 18) return progress.stars.reduce((sum, stars) => sum + stars, 0) >= 36 + (id - 11) * 6;
  const requirements = [15, 40, 15, 40];
  const score = id < 20 ? progress.tbest : progress.sbest;
  return score >= requirements[id - 18];
}
