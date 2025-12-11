'use client';

import { useEffect, useRef } from 'react';
import { Quiz } from '@/lib/processors/ai-generator';

interface TowerDefenseGameProps {
  quiz?: Quiz; // Optional - will be fetched by GameDataService if not provided
}

// react component that wraps and manages a phaser 3 tower defense game instance with quiz integration
// dynamically loads phaser and game scene, creates game, and destroys on unmount
// quiz prop is optional - if not provided, the game will fetch mock data (Phaser Editor) or API data (WordWyrm)
const TowerDefenseGame = ({ quiz }: TowerDefenseGameProps) => {
  // ref to DOM element for phaser canvas
  const gameRef = useRef<HTMLDivElement>(null);
  // ref for phaser game instance
  const gameInstance = useRef<Phaser.Game | null>(null);

  // effect hook to prevent touch rubber-banding on mobile
  useEffect(() => {
    /**
     * Prevent rubber-band scrolling on mobile devices
     * This stops the whole page from bouncing when user swipes
     */
    const preventTouchMove = (e: TouchEvent) => {
      // Only prevent default on the game container, not on UI elements
      const target = e.target as HTMLElement;
      if (target.closest('#phaser-container')) {
        e.preventDefault();
      }
    };

    // Add listener with passive: false to allow preventDefault()
    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventTouchMove);
    };
  }, []);

  // effect hook to create/destroy phaser game
  useEffect(() => {
    // async creates phaser game instance
    const createGame = async () => {
      // only create if ref is attached and no game instance exists
      if (gameRef.current && !gameInstance.current) {
        // dynamically import phaser to reduce bundle size
        const Phaser = await import('phaser');
        // dynamically import tower defense scene (NEW LOCATION)
        const TowerDefenseSceneModule = await import('@/lib/tower-defense/scenes/TowerDefenseScene');
        const TowerDefenseScene = TowerDefenseSceneModule.default;
        // dynamically import UI scene from Phaser Editor
        const UISceneModule = await import('@/lib/tower-defense/editor/UIScene');
        const UIScene = UISceneModule.default;

        // phaser game config - fixed base resolution with FIT scaling for responsive design
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO, // auto choose WebGL/Canvas
          width: 1920,
          height: 1080,
          parent: 'phaser-container', // Target specific container div
          backgroundColor: '#8bc34a',
          antialias: false, // Disable antialiasing for crisp UI (not pixel art)
          pixelArt: false, // Disable pixel art mode (this is NOT a pixel art game)
          scale: {
            mode: Phaser.Scale.FIT, // FIT mode maintains aspect ratio and fits in container
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: 'phaser-container', // Crucial: target specific div for CSS control
            width: 1920,
            height: 1080,
            expandParent: false,
            autoRound: true,
            // High-DPI/Retina support - cap at 2x to balance quality and performance
            resolution: Math.min(window.devicePixelRatio || 1, 2)
          },
          dom: {
            createContainer: true // Enable DOM element support
          },
          render: {
            antialias: true, // Enable antialiasing for smooth graphics (not pixel art)
            antialiasGL: true,
            roundPixels: false, // Allow sub-pixel rendering for smooth scaling
            pixelArt: false // Disable pixel art mode (not a pixel art game)
          },
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 }, // no gravity for tower defense
              debug: false, // true for physics debug visuals
            },
          },
          // Don't auto-start scenes - we'll start them manually
          scene: [],
        };

        console.log('[TowerDefenseGame] Creating Phaser game...');
        // create new phaser game instance
        const game = new Phaser.Game(config);

        console.log('[TowerDefenseGame] Adding scenes to game...');
        // Add scenes manually so we can control start order
        game.scene.add('TowerDefenseScene', TowerDefenseScene, false);
        game.scene.add('UIScene', UIScene, false);

        console.log('[TowerDefenseGame] Starting TowerDefenseScene with quiz:', !!quiz);
        // start TowerDefenseScene and pass quiz data if provided
        // if no quiz, the scene will fetch it via GameDataService
        if (quiz) {
          game.scene.start('TowerDefenseScene', { quiz });
        } else {
          game.scene.start('TowerDefenseScene');
        }
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
  return (
    <div
      ref={gameRef}
      style={{
        width: '100%',
        height: '100%', // Fill parent container
        overflow: 'hidden',
        position: 'relative'
      }}
    />
  );
};

export default TowerDefenseGame;
