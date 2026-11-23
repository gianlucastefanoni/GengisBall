import { useEffect, useRef } from 'react';

/** Wrapper lifecycle React ↔ Phaser: monta una scena e pulisce sempre il canvas. */
export function GameCanvas({ levelIndex, skinId, mode, onOutcome, onHud, onSceneReady }) {
  const hostRef = useRef(null);
  const callbackRef = useRef({ onOutcome, onHud, onSceneReady });
  callbackRef.current = { onOutcome, onHud, onSceneReady };

  useEffect(() => {
    if (!hostRef.current) return undefined;
    let game;
    let cancelled = false;
    const bridge = {
      onOutcome: (result) => callbackRef.current.onOutcome(result),
      onHud: (state) => callbackRef.current.onHud(state),
    };
    import('../game/createGame.js').then(({ createGame }) => {
      if (cancelled) return;
      game = createGame(hostRef.current, bridge, (scene) => {
      callbackRef.current.onSceneReady(scene);
      scene.startLevel(levelIndex, skinId, mode);
      });
    });
    return () => {
      cancelled = true;
      callbackRef.current.onSceneReady(null);
      game?.destroy(true);
    };
  }, [levelIndex, skinId, mode]);

  return <div className="game-canvas" ref={hostRef} aria-label="Campo di gioco GengisBall" />;
}
