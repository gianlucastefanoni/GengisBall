import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './physics/constants.js';
import { GameScene } from './scenes/GameScene.js';

/** Crea e restituisce l'istanza Phaser; il chiamante la distrugge allo smontaggio React. */
export function createGame(parent, bridge, onReady) {
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#f4efe3',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
    scene: [GameScene],
  });
  game.events.once(Phaser.Core.Events.READY, () => {
    const scene = game.scene.getScene('GameScene');
    scene.setBridge(bridge);
    bridge.scene = scene;
    onReady?.(scene);
  });
  return game;
}
