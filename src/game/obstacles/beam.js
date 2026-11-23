/** Ostacolo a segmento: supporta rotazione, movimento, rimbalzo, pericolo e interruttori. */
export function beam(x, y, length, angle, options = {}) {
  return {
    type: 'beam', x, y, len: length, ang: angle, r: 7,
    mx: 0, my: 0, sp: 0, rot: 0, bo: 0,
    ...options,
  };
}

/** Restituisce gli estremi del segmento nella posizione animata al tick indicato. */
export function beamEndpoints(obstacle, tick) {
  const angle = ((obstacle.ang + obstacle.rot * tick) * Math.PI) / 180;
  const wave = Math.sin(obstacle.sp * tick);
  const centerX = obstacle.x + obstacle.mx * wave;
  const centerY = obstacle.y + obstacle.my * wave;
  const halfX = (Math.cos(angle) * obstacle.len) / 2;
  const halfY = (Math.sin(angle) * obstacle.len) / 2;
  return [centerX - halfX, centerY - halfY, centerX + halfX, centerY + halfY];
}
