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
          parent: gameRef.current, // DOM element to render in
          backgroundColor: '#8bc34a',
          antialias: true, // Enable antialiasing for smooth text
          pixelArt: false, // Disable pixel art mode for crisp text
          scale: {
            mode: Phaser.Scale.FIT, // Maintains aspect ratio with letterboxing - ensures full game visible
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: gameRef.current,
            width: 1920,
            height: 1080,
            // Remove min/max constraints to allow more flexible scaling on mobile
            expandParent: false,
            autoRound: true
          },
          dom: {
            createContainer: true // Enable DOM element support
          },
          render: {
            antialias: true,
            antialiasGL: true,
            roundPixels: false, // Keep false for crisp text
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
