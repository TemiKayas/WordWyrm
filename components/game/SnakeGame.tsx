'use client';

import { useEffect, useRef } from 'react';
import { Quiz } from '@/lib/processors/ai-generator';

interface SnakeGameProps {
  quiz: Quiz;
  gameId?: string;  // ANALYTICS SYSTEM - Game ID for saving session (optional for demo mode)
}

/**
 * React component that wraps and manages a Phaser 3 snake quiz game instance
 * Dynamically loads Phaser and game scene, creates game, and destroys on unmount
 *
 * ANALYTICS SYSTEM - gameId prop:
 * - When provided: Game sessions are saved to the database for analytics
 * - When undefined: Game runs in demo mode without saving statistics
 * - Passed through to SnakeScene via scene.start() data parameter
 */
const SnakeGame = ({ quiz, gameId }: SnakeGameProps) => {
  // Ref to DOM element for Phaser canvas
  const gameRef = useRef<HTMLDivElement>(null);
  // Ref for Phaser game instance
  const gameInstance = useRef<Phaser.Game | null>(null);

  // Effect hook to create/destroy Phaser game
  useEffect(() => {
    // Async creates Phaser game instance
    const createGame = async () => {
      // Only create if ref is attached and no game instance exists
      if (gameRef.current && !gameInstance.current) {
        // Dynamically import Phaser to reduce bundle size
        const Phaser = await import('phaser');
        // Dynamically import snake scene
        const SnakeSceneModule = await import('@/lib/phaser/SnakeScene');
        const SnakeScene = SnakeSceneModule.default;

        // Phaser game config - fullscreen responsive
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO, // Auto choose WebGL/Canvas
          width: window.innerWidth,
          height: window.innerHeight,
          parent: gameRef.current, // DOM element to render in
          backgroundColor: '#2d3436',
          antialias: true,
          pixelArt: false,
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
          },
          render: {
            antialias: true,
            antialiasGL: true,
            roundPixels: false,
          },
          scene: [SnakeScene], // Scene to start
        };

        // Create new Phaser game instance
        const game = new Phaser.Game(config);

        // Start SnakeScene and pass quiz data and gameId
        // ANALYTICS SYSTEM - gameId enables session saving in the scene
        game.scene.start('SnakeScene', { quiz, gameId });

        // Store game instance in ref
        gameInstance.current = game;
      }
    };

    createGame();

    // Cleanup to destroy game instance on unmount
    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, [quiz, gameId]); // Rerun if quiz or gameId changes

  // Div that contains the Phaser game canvas
  return <div ref={gameRef} />;
};

export default SnakeGame;
