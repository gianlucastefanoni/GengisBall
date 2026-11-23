/** Ostacolo rettangolare: può oscillare e può essere mortale o attivare un interruttore. */
export function rectangle(x, y, width, height, options = {}) {
  return {
    type: 'rectangle', x, y, w: width, h: height, r: 0,
    mx: 0, my: 0, sp: 0, rot: 0, bo: 0,
    ...options,
  };
}

/** Centro del rettangolo nel tick corrente; condiviso da renderer e collisioni. */
export function rectangleCenterAt(obstacle, tick) {
  const movement = Math.sin(obstacle.sp * tick);
  return {
    x: obstacle.x + obstacle.mx * movement,
    y: obstacle.y + obstacle.my * movement,
  };
}
