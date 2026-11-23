import { useEffect, useRef } from 'react';
import { drawBall } from '../game/balls/drawBall.js';

/** Preview React della stessa pallina e dello stesso disegno usati nella scena. */
export function BallPreview({ skinId, label }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawBall(context, canvas.width / 2, canvas.height / 2, 22, 0.4, skinId);
  }, [skinId]);

  return <canvas className="skin-preview" ref={canvasRef} width="64" height="64" role="img" aria-label={label} />;
}
