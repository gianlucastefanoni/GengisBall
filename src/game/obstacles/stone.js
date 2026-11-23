/** Pietra mobile e dinamica: massa, velocità e rimbalzo sono usati dal solver. */
export function stone(x, y, radius, mass) {
  return {
    type: 'stone', stn: 1, ng: 1, x, y, r: radius, m: mass,
    vx: 0, vy: 0, e: 0.8,
  };
}
