/**
 * Disegna la pallina sul canvas 2D: pattern legacy mantenuti per tutte le 22 skin.
 * `angle` ruota il motivo dentro il contorno circolare.
 */
export function drawBall(context, x, y, radius, angle, skinId) {
  const scale = radius / 12;
  const ctx = context;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.rotate(angle);

  const fill = (color) => {
    ctx.fillStyle = color;
    ctx.fillRect(-radius, -radius, 2 * radius, 2 * radius);
  };
  const gradient = (first, middle, last) => {
    const radial = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
    radial.addColorStop(0, first);
    radial.addColorStop(0.5, middle);
    radial.addColorStop(1, last);
    ctx.fillStyle = radial;
    ctx.fillRect(-radius, -radius, 2 * radius, 2 * radius);
  };

  ctx.lineWidth = 2.4 * scale;
  ctx.strokeStyle = '#2b1700';
  if (skinId === 0) {
    fill('#f08a1c');
    for (const offset of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.moveTo(offset * scale, -radius);
      ctx.quadraticCurveTo((offset + 5) * scale, 0, offset * scale, radius);
      ctx.stroke();
    }
  } else if (skinId === 1) {
    fill('#e8742a');
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.lineTo(radius, 0);
    ctx.moveTo(0, -radius);
    ctx.lineTo(0, radius);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-1.4 * radius, 0, 1.25 * radius, -0.8, 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1.4 * radius, 0, 1.25 * radius, Math.PI - 0.8, Math.PI + 0.8);
    ctx.stroke();
  } else if (skinId === 2) {
    fill('#fff');
    ctx.fillStyle = '#222';
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const angleAt = i * 1.2566;
      ctx.lineTo(Math.cos(angleAt) * 0.38 * radius, Math.sin(angleAt) * 0.38 * radius);
    }
    ctx.fill();
    for (let i = 0; i < 5; i += 1) {
      const angleAt = i * 1.2566 + 0.63;
      ctx.beginPath();
      ctx.arc(Math.cos(angleAt) * 0.95 * radius, Math.sin(angleAt) * 0.95 * radius, 0.3 * radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (skinId === 3) {
    gradient('#fff', '#8fd8f0', '#3a8fc4');
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, radius * 0.2);
    ctx.lineTo(radius * 0.3, -radius * 0.6);
    ctx.stroke();
  } else if (skinId === 4) {
    fill('#1a0b2e');
    ctx.lineWidth = 3 * scale;
    ctx.strokeStyle = '#ff3df2';
    ctx.beginPath();
    ctx.arc(0, 0, 0.62 * radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#3df2ff';
    ctx.beginPath();
    ctx.arc(0, 0, 0.25 * radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (skinId === 5) {
    gradient('#fff2a8', '#f2b705', '#a36a00');
  } else if (skinId === 6) {
    fill('#2b0d00');
    ctx.strokeStyle = '#ff7a1a';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(-radius, -radius * 0.2);
    ctx.lineTo(-radius * 0.2, radius * 0.1);
    ctx.lineTo(radius * 0.2, -radius * 0.4);
    ctx.lineTo(radius, radius * 0.3);
    ctx.moveTo(-radius * 0.2, radius * 0.1);
    ctx.lineTo(0, radius);
    ctx.stroke();
  } else if (skinId === 7) {
    fill('#2fa84f');
    ctx.strokeStyle = '#14562a';
    ctx.lineWidth = 3 * scale;
    for (const offset of [-7, 0, 7]) {
      ctx.beginPath();
      ctx.moveTo(offset * scale, -radius);
      ctx.quadraticCurveTo((offset + 4) * scale, 0, offset * scale, radius);
      ctx.stroke();
    }
  } else if (skinId === 8) {
    fill('#ffd93b');
    ctx.fillStyle = '#2b1700';
    ctx.beginPath();
    ctx.arc(-0.35 * radius, -0.25 * radius, 0.12 * radius, 0, Math.PI * 2);
    ctx.arc(0.35 * radius, -0.25 * radius, 0.12 * radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0.05 * radius, 0.5 * radius, 0.2, 2.9);
    ctx.stroke();
  } else if (skinId === 9) {
    fill('#d98e5b');
    ctx.fillStyle = '#f4d3a8';
    ctx.fillRect(-radius, -0.5 * radius, 2 * radius, 0.35 * radius);
    ctx.fillStyle = '#a85d3a';
    ctx.fillRect(-radius, 0.2 * radius, 2 * radius, 0.4 * radius);
  } else if (skinId === 10) {
    fill('#c7ccd6');
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1.2 * scale;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 0.45 * radius, -radius);
      ctx.lineTo(i * 0.45 * radius, radius);
      ctx.moveTo(-radius, i * 0.45 * radius);
      ctx.lineTo(radius, i * 0.45 * radius);
      ctx.stroke();
    }
  } else if (skinId === 11) {
    gradient('#ffffff', '#ffb3e6', '#b36bff');
  } else if (skinId === 12) {
    fill('#150a3a');
    ctx.fillStyle = '#fff';
    for (const [horizontal, vertical] of [[-0.4, -0.3], [0.3, 0.2], [-0.1, 0.5], [0.5, -0.5], [-0.6, 0.3]]) {
      ctx.beginPath();
      ctx.arc(horizontal * radius, vertical * radius, 0.1 * radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#b36bff';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 0.6 * radius, 0.5, 2.4);
    ctx.stroke();
  } else if (skinId === 13) {
    gradient('#e8fbff', '#7fe3ff', '#2a8fd6');
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angleAt = i * 1.047;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angleAt) * radius, Math.sin(angleAt) * radius);
    }
    ctx.stroke();
  } else if (skinId === 14) {
    fill('#fff');
    ctx.fillStyle = '#2a9d8f';
    ctx.beginPath();
    ctx.arc(0, 0, 0.58 * radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(0, 0, 0.27 * radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-0.12 * radius, -0.12 * radius, 0.08 * radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (skinId === 15) {
    fill('#ffe14d');
    ctx.fillStyle = '#2b1700';
    ctx.beginPath();
    ctx.moveTo(0.15 * radius, -0.9 * radius);
    ctx.lineTo(-0.45 * radius, 0.1 * radius);
    ctx.lineTo(0, 0.1 * radius);
    ctx.lineTo(-0.2 * radius, 0.9 * radius);
    ctx.lineTo(0.5 * radius, -0.2 * radius);
    ctx.lineTo(0.05 * radius, -0.2 * radius);
    ctx.fill();
  } else if (skinId === 16) {
    fill('#ff4d6d');
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-0.22 * radius, -0.12 * radius, 0.26 * radius, 0, Math.PI * 2);
    ctx.arc(0.22 * radius, -0.12 * radius, 0.26 * radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.47 * radius, -0.02 * radius);
    ctx.lineTo(0, 0.52 * radius);
    ctx.lineTo(0.47 * radius, -0.02 * radius);
    ctx.fill();
  } else if (skinId === 17) {
    ['#ff4d4d', '#ffa94d', '#ffe14d', '#5bd66a', '#4da6ff', '#a066ff'].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(-radius + (i * radius) / 3, -radius, radius / 3 + 1, 2 * radius);
    });
  } else if (skinId === 18) {
    fill('#14233f');
    ctx.strokeStyle = '#9ad8ff';
    ctx.lineWidth = 2.5 * scale;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-radius, (-0.5 + i * 0.5) * radius);
      ctx.lineTo(0.3 * radius, (-0.3 + i * 0.35) * radius);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0.35 * radius, 0.1 * radius, 0.4 * radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (skinId === 19) {
    gradient('#ffffff', '#ffd36b', '#ff5a1f');
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const angleAt = i * 0.785;
      ctx.moveTo(Math.cos(angleAt) * 0.3 * radius, Math.sin(angleAt) * 0.3 * radius);
      ctx.lineTo(Math.cos(angleAt) * radius, Math.sin(angleAt) * radius);
    }
    ctx.stroke();
  } else if (skinId === 20) {
    fill('#5b6b8c');
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(-0.5 * radius, -0.5 * radius);
    ctx.lineTo(0.5 * radius, -0.5 * radius);
    ctx.lineTo(0.5 * radius, 0.1 * radius);
    ctx.lineTo(0, 0.7 * radius);
    ctx.lineTo(-0.5 * radius, 0.1 * radius);
    ctx.fill();
    ctx.fillStyle = '#5b6b8c';
    ctx.fillRect(-0.08 * radius, -0.4 * radius, 0.16 * radius, 0.8 * radius);
  } else {
    fill('#ffd23f');
    ctx.fillStyle = '#8a1c1c';
    ctx.beginPath();
    ctx.moveTo(-0.6 * radius, 0.35 * radius);
    ctx.lineTo(-0.6 * radius, -0.3 * radius);
    ctx.lineTo(-0.3 * radius, 0);
    ctx.lineTo(0, -0.45 * radius);
    ctx.lineTo(0.3 * radius, 0);
    ctx.lineTo(0.6 * radius, -0.3 * radius);
    ctx.lineTo(0.6 * radius, 0.35 * radius);
    ctx.fill();
  }

  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#2b1700';
  ctx.lineWidth = Math.max(1.5, radius / 6);
  ctx.stroke();
}
