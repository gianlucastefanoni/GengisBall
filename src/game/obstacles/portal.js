/** Crea due ingressi collegati; il punto d'uscita conserva angolo e colore. */
export function portals(x1, y1, angle1, x2, y2, angle2, color1 = '#3ea6ff', color2 = '#ff9a2e') {
  const first = { type: 'portal', pt: 1, x: x1, y: y1, a: angle1 * Math.PI / 180, c: color1 };
  const second = { type: 'portal', pt: 1, x: x2, y: y2, a: angle2 * Math.PI / 180, c: color2 };
  first.to = second;
  second.to = first;
  return [first, second];
}

/** Due coppie di portali con palette distinta, usate nei livelli avanzati. */
export function portalPairs(first, second) {
  return [...portals(...first), ...portals(...second, '#7dff6a', '#ff4fd8')];
}
