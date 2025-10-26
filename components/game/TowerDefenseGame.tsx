'use client';

import { useEffect, useRef } from 'react';
import { Quiz } from '@/lib/processors/ai-generator';

interface TowerDefenseGameProps {
  quiz: Quiz;
}

// react component that wraps and manages a phaser 3 tower defense game instance with quiz integration
// dynamically loads phaser and game scene, creates game, and destroys on unmount
const TowerDefenseGame = ({ quiz }: TowerDefenseGameProps) => {
  // ref to DOM element for phaser canvas
  const gameRef = useRef<HTMLDivElement>(null);
  // ref for phaser game instance
  const gameInstance = useRef<Phaser.Game | null>(null);

  // effect hook to create/destroy phaser game
  useEffect(() => {
    // async creates phaser game instance
    const createGame = async () => {
      // only create if ref is attached and no game instance exists
      if (gameRef.current && !gameInstance.current) {
        // dynamically import phaser to reduce bundle size
        const Phaser = await import('phaser');
        // dynamically import tower defense scene
        const TowerDefenseSceneModule = await import('@/lib/phaser/TowerDefenseScene');
        const TowerDefenseScene = TowerDefenseSceneModule.default;

        // phaser game config
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO, // auto choose WebGL/Canvas
          width: 1280,
          height: 720,
          parent: gameRef.current, // DOM element to render in
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 }, // no gravity for tower defense
              debug: false, // true for physics debug visuals
            },
          },
          scene: [TowerDefenseScene], // scene to start
        };

        // create new phaser game instance
        const game = new Phaser.Game(config);
        // start TowerDefenseScene and pass quiz data
        game.scene.start('TowerDefenseScene', { quiz });
        // store game instance in ref
        gameInstance.current = game;
      }
    };

    createGame();

    // cleanup to destroy game instance on unmount
    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, [quiz]); // rerun if quiz changes

  // div that contains the phaser game canvas
  return <div ref={gameRef} />;
};

export default TowerDefenseGame;
