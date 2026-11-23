/** Ostacolo circolare: usato anche per magneti, pericoli e superfici rimbalzanti. */
export function circle(x, y, radius, options = {}) {
  return {
    type: 'circle', x, y, r: radius, len: 0, ang: 0,
    mx: 0, my: 0, sp: 0, rot: 0, bo: 0,
    ...options,
  };
}
