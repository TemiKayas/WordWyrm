// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ResponsiveText } from '@/lib/tower-defense/utils/ResponsiveText';
import { LAYOUT } from '@/lib/tower-defense/config/LayoutConfig';
/* END-USER-IMPORTS */

export default class UIScene extends Phaser.Scene {

  constructor() {
    super("UIScene");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // rectangle
    this.add.image(115, 60, "rectangle_110");

    // cleared_rectangle
    const cleared_rectangle = this.add.image(961, 539, "cleared_rectangle");
    cleared_rectangle.scaleX = 0.8;
    cleared_rectangle.scaleY = 0.55;

    // startGameButtonBg
    const startGameButtonBg = this.add.rectangle(960, 540, 540, 150);
    startGameButtonBg.scaleX = 0.5;
    startGameButtonBg.scaleY = 0.5;
    startGameButtonBg.isFilled = true;
    startGameButtonBg.fillColor = 9811463;
    startGameButtonBg.isStroked = true;
    startGameButtonBg.strokeColor = 24617;
    startGameButtonBg.lineWidth = 3;

    // startGameButtonText
    const startGameButtonText = this.add.text(960, 540, "", {});
    startGameButtonText.scaleX = 0.5;
    startGameButtonText.scaleY = 0.5;
    startGameButtonText.setOrigin(0.5, 0.5);
    startGameButtonText.text = "START GAME";
    startGameButtonText.setStyle({ "color": "#ffffff", "fontFamily": "Quicksand", "fontSize": "60px", "fontStyle": "bold" });

    // backButtonText
    const backButtonText = this.add.text(113, 59, "", {});
    backButtonText.setOrigin(0.5, 0.5);
    backButtonText.text = "← Back";
    backButtonText.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontStyle": "bold" });

    // flag_rectangle1
    const flag_rectangle1 = this.add.image(1838, 38, "flag_rectangle1");
    flag_rectangle1.scaleX = 1.2;

    // subtract
    const subtract = this.add.image(1828, 206, "subtract");
    subtract.scaleX = 1.5;
    subtract.scaleY = 1.5;

    // waveCounterText
    const waveCounterText = this.add.text(1829, 77, "", {});
    waveCounterText.scaleX = 0.8;
    waveCounterText.scaleY = 0.8;
    waveCounterText.setOrigin(0.5, 0.5);
    waveCounterText.text = "ROUND";
    waveCounterText.setStyle({ "color": "#ffffffff", "fontFamily": "Quicksand", "fontSize": "30px", "fontStyle": "600", "stroke": "#fffa2" });

    // flag_part
    this.add.image(1747, 38, "flag_part");

    // flag_rectangle2
    this.add.image(1909, 61, "flag_rectangle2");

    // flag_rectangle3
    const flag_rectangle3 = this.add.image(1828, 39, "flag_rectangle3");
    flag_rectangle3.scaleX = 1.5;

    // rectangle_110
    this.add.image(118, 137, "rectangle_110");

    // goldText
    const goldText = this.add.text(121, 137, "", {});
    goldText.setOrigin(0.5, 0.5);
    goldText.text = "100";
    goldText.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "18px", "fontStyle": "600" });

    // coin_icon
    this.add.image(87, 137, "coin_icon");

    // ballistaBtn
    const ballistaBtn = this.add.image(597, 972, "ballista_icon");
    ballistaBtn.scaleX = 1.15;
    ballistaBtn.scaleY = 1.15;

    // trainingCampBtn
    const trainingCampBtn = this.add.image(882, 972, "cannon_icon");
    trainingCampBtn.scaleX = 1.15;
    trainingCampBtn.scaleY = 1.15;

    // archmageBtn
    const archmageBtn = this.add.image(977, 972, "archmage_icon");
    archmageBtn.scaleX = 1.15;
    archmageBtn.scaleY = 1.15;

    // freezeBtn
    const freezeBtn = this.add.image(1197, 972, "freeze_icon");
    freezeBtn.scaleX = 1.15;
    freezeBtn.scaleY = 1.15;

    // trebuchetBtn
    const trebuchetBtn = this.add.image(692, 972, "trebuchet_icon");
    trebuchetBtn.scaleX = 1.15;
    trebuchetBtn.scaleY = 1.15;

    // lightningBtn
    const lightningBtn = this.add.image(1102, 972, "lightning");
    lightningBtn.scaleX = 1.15;
    lightningBtn.scaleY = 1.15;

    // knightBtn
    const knightBtn = this.add.image(787, 972, "knight_icon");
    knightBtn.scaleX = 1.15;
    knightBtn.scaleY = 1.15;

    // quizBuffBtn
    const quizBuffBtn = this.add.image(1292, 972, "quiz_buff_icon");
    quizBuffBtn.scaleX = 1.15;
    quizBuffBtn.scaleY = 1.15;

    // towers_opened_icon
    this.add.image(790, 880, "towers_opened_icon");

    // heart_icon
    this.add.image(120, 100, "heart_icon");

    // heart_icon_1
    this.add.image(145, 100, "heart_icon");

    // heart_icon_2
    this.add.image(170, 100, "heart_icon");

    // heart_icon_3
    this.add.image(195, 100, "heart_icon");

    // heart_icon_4
    this.add.image(220, 100, "heart_icon");

    // heart_icon_5
    this.add.image(245, 100, "heart_icon");

    // heart_icon_6
    this.add.image(270, 100, "heart_icon");

    // heart_icon_7
    this.add.image(295, 100, "heart_icon");

    // heart_icon_8
    this.add.image(320, 100, "heart_icon");

    // heart_icon_9
    this.add.image(345, 100, "heart_icon");

    // text_1
    const text_1 = this.add.text(58, 90, "", {});
    text_1.text = "Lives:\n";
    text_1.setStyle({ "fontFamily": "Quicksand", "strokeThickness": 1 });

    // rectangle_118
    const rectangle_118 = this.add.image(1829, 231, "rectangle_118");
    rectangle_118.scaleX = 1.2;

    // text_2
    const text_2 = this.add.text(1795, 222, "", {});
    text_2.text = "SPEED";
    text_2.setStyle({ "color": "#EA1644", "fontSize": "12px", "stroke": "#EA1644" });

    // rectangle_118_alt
    const rectangle_118_alt = this.add.image(1829, 193, "rectangle_118_alt");
    rectangle_118_alt.scaleX = 1.2;

    // text
    const text = this.add.text(1795, 179, "", {});
    text.text = "START NEXT\nROUND →";
    text.setStyle({ "color": "#EA1644", "fontFamily": "QUICKSAND", "fontSize": "10px", "stroke": "#EA1644" });

    // ellipse_63
    this.add.image(1829, 119, "ellipse_63");

    // text_3
    const text_3 = this.add.text(1825, 110, "", {});
    text_3.text = "1";
    text_3.setStyle({ "color": "#EA1644", "fontFamily": "QUICKSAND", "fontSize": "14px", "stroke": "#EA1644", "strokeThickness": 1 });

    // powers_opened_icon
    this.add.image(1196, 884, "powers_opened_icon");

    this.events.emit("scene-awake");
  }

  /* START-USER-CODE */

  preload() {
    // Load UI assets from public/assets/game/
    // Background elements
    this.load.image('rectangle_110', '/assets/game/Rectangle 110.png');
    this.load.image('cleared_rectangle', '/assets/game/Cleared Rectangle.png');
    this.load.image('start_rectangle', '/assets/game/Start_Rectangle.png');

    // Flag elements
    this.load.image('flag_rectangle1', '/assets/game/Rectangle 115.png');
    this.load.image('flag_rectangle2', '/assets/game/Rectangle 116.png');
    this.load.image('flag_rectangle3', '/assets/game/Rectangle 117.png');
    this.load.image('flag_part', '/assets/game/Ellipse 64.png');
    this.load.image('ellipse_63', '/assets/game/Ellipse 63.png');
    this.load.image('subtract', '/assets/game/Subtract.png');

    // Tower icons
    this.load.image('ballista_icon', '/assets/game/Ballista Icon.png');
    this.load.image('cannon_icon', '/assets/game/Cannon Icon.png');
    this.load.image('trebuchet_icon', '/assets/game/Trebuchet Icon.png');
    this.load.image('knight_icon', '/assets/game/Knight Icon.png');
    this.load.image('archmage_icon', '/assets/game/Archmage Icon.png');
    this.load.image('towers_opened_icon', '/assets/game/Towers (Opened) Icon.png');
    this.load.image('towers_closed_icon', '/assets/game/Towers (Closed) Icon.png');

    // Power icons
    this.load.image('lightning', '/assets/game/Lightning.png');
    this.load.image('freeze_icon', '/assets/game/Freeze Icon.png');
    this.load.image('quiz_buff_icon', '/assets/game/Quiz Buff Icon.PNG');
    this.load.image('powers_opened_icon', '/assets/game/Powers (Opened) Icon.png');
    this.load.image('powers_closed_icon', '/assets/game/Powers (Closed) Icon.png');

    // Status icons
    this.load.image('heart_icon', '/assets/game/Heart Icon.png');
    this.load.image('coin_icon', '/assets/game/Coin Icon.png');

    // Button rectangles
    this.load.image('rectangle_118', '/assets/game/Rectangle 118.png');
    this.load.image('rectangle_118_alt', '/assets/game/Rectangle 118(1).png');
  }

  create() {
    this.editorCreate();

    // Make camera background transparent so TowerDefenseScene shows through
    this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0)');

    // Configure input to allow clicks to pass through to TowerDefenseScene
    // By default, Phaser scenes don't block each other's input, but we ensure it explicitly
    this.input.topOnly = false; // Allow input to reach multiple objects/scenes

    // Debug: Log all pointer events to see what's being captured
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('[UIScene] Pointer down at', pointer.x, pointer.y);
      console.log('[UIScene] Game objects under pointer:', this.input.hitTestPointer(pointer));
    });

    // The key is that UIScene only has interactive elements where we want to capture input
    // All other areas naturally pass through to TowerDefenseScene below

    // Find and assign UI element references created by editorCreate()
    this.assignUIElements();

    // Populate heartIcons array by finding the heart images
    // Hearts are at x positions: 120, 145, 170, 195, 220, 245, 270, 295, 320, 345 (y=100)
    const heartPositions = [120, 145, 170, 195, 220, 245, 270, 295, 320, 345];
    this.heartIcons = [];

    heartPositions.forEach(xPos => {
      const heart = this.children.getChildren().find(
        child => child instanceof Phaser.GameObjects.Image &&
                 Math.abs(child.x - xPos) < 1 &&
                 Math.abs(child.y - 100) < 1
      ) as Phaser.GameObjects.Image;

      if (heart) {
        this.heartIcons.push(heart);
      }
    });

    // Setup button interactivity
    this.setupButtonInteractivity();

    // Initially hide start round button (show after first game starts)
    if (this.startRoundButton) this.startRoundButton.setVisible(false);
    if (this.startRoundButtonText) this.startRoundButtonText.setVisible(false);
    if (this.speedButton) this.speedButton.setVisible(false);
    if (this.speedButtonText) this.speedButtonText.setVisible(false);

    // Listen for events from TowerDefenseScene
    const tdScene = this.scene.get('TowerDefenseScene');
    if (tdScene) {
      tdScene.events.on('updateGold', this.updateGold, this);
      tdScene.events.on('updateLives', this.updateLives, this);
      tdScene.events.on('updateWave', this.updateWave, this);
      tdScene.events.on('gameStarted', this.onGameStarted, this);
      tdScene.events.on('waveComplete', this.onWaveComplete, this);
      tdScene.events.on('speedChanged', this.onSpeedChanged, this);
    }
  }

  assignUIElements(): void {
    // Find all UI elements created by editorCreate() and assign to class properties
    const allChildren = this.children.getChildren();

    // Find back button text (contains "← Back")
    this.backButtonText = allChildren.find(
      child => child instanceof Phaser.GameObjects.Text &&
               (child as Phaser.GameObjects.Text).text.includes('Back')
    ) as Phaser.GameObjects.Text;

    // Find start game button elements
    this.startGameButtonBg = allChildren.find(
      child => child instanceof Phaser.GameObjects.Rectangle &&
               Math.abs(child.x - 960) < 1 && Math.abs(child.y - 540) < 1
    ) as Phaser.GameObjects.Rectangle;

    this.startGameButtonText = allChildren.find(
      child => child instanceof Phaser.GameObjects.Text &&
               (child as Phaser.GameObjects.Text).text === 'START GAME'
    ) as Phaser.GameObjects.Text;

    this.cleared_rectangle = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               Math.abs(child.x - 961) < 1 && Math.abs(child.y - 539) < 1
    ) as Phaser.GameObjects.Image;

    // Find tower buttons by texture key (more reliable than position)
    this.ballistaBtn = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'ballista_icon'
    ) as Phaser.GameObjects.Image;

    this.trebuchetBtn = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'trebuchet_icon'
    ) as Phaser.GameObjects.Image;

    this.knightBtn = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'knight_icon'
    ) as Phaser.GameObjects.Image;

    this.trainingCampBtn = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'cannon_icon'
    ) as Phaser.GameObjects.Image;

    this.archmageBtn = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'archmage_icon'
    ) as Phaser.GameObjects.Image;

    this.towersToggleIcon = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               Math.abs(child.x - 748) < 5 && Math.abs(child.y - 880) < 5
    ) as Phaser.GameObjects.Image;

    // Find power buttons by texture key (more reliable than position)
    this.lightningBtn = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'lightning'
    ) as Phaser.GameObjects.Image;

    this.freezeBtn = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'freeze_icon'
    ) as Phaser.GameObjects.Image;

    this.quizBuffBtn = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'quiz_buff_icon'
    ) as Phaser.GameObjects.Image;

    this.powersToggleIcon = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               Math.abs(child.x - 1154) < 5 && Math.abs(child.y - 884) < 5
    ) as Phaser.GameObjects.Image;

    // Find action buttons - by texture key
    this.startRoundButton = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'rectangle_118_alt'
    ) as Phaser.GameObjects.Image;

    this.startRoundButtonText = allChildren.find(
      child => child instanceof Phaser.GameObjects.Text &&
               (child as Phaser.GameObjects.Text).text.includes('NEXT')
    ) as Phaser.GameObjects.Text;

    this.speedButton = allChildren.find(
      child => child instanceof Phaser.GameObjects.Image &&
               (child as Phaser.GameObjects.Image).texture.key === 'rectangle_118'
    ) as Phaser.GameObjects.Image;

    this.speedButtonText = allChildren.find(
      child => child instanceof Phaser.GameObjects.Text &&
               (child as Phaser.GameObjects.Text).text === 'SPEED'
    ) as Phaser.GameObjects.Text;

    // Find wave number text (the "1" text at position 1827, 110)
    this.waveNumberText = allChildren.find(
      child => child instanceof Phaser.GameObjects.Text &&
               Math.abs(child.x - 1827) < 5 && Math.abs(child.y - 110) < 5
    ) as Phaser.GameObjects.Text;

    // Find gold text (the "100" text at position 121, 138)
    this.goldText = allChildren.find(
      child => child instanceof Phaser.GameObjects.Text &&
               Math.abs(child.x - 121) < 5 && Math.abs(child.y - 138) < 5
    ) as Phaser.GameObjects.Text;

    // Populate tower and power button arrays
    this.towerButtons = [this.ballistaBtn, this.trebuchetBtn, this.knightBtn, this.trainingCampBtn, this.archmageBtn].filter(Boolean);
    this.powerButtons = [this.lightningBtn, this.freezeBtn, this.quizBuffBtn].filter(Boolean);

    // Log what was found
    console.log('[UIScene] Elements found:');
    console.log('  backButtonText:', !!this.backButtonText);
    console.log('  startGameButtonBg:', !!this.startGameButtonBg);
    console.log('  startGameButtonText:', !!this.startGameButtonText);
    console.log('  cleared_rectangle:', !!this.cleared_rectangle);
    console.log('  Tower buttons:', this.towerButtons.length, '/ 5');
    console.log('  Power buttons:', this.powerButtons.length, '/ 3');
    console.log('  startRoundButton:', !!this.startRoundButton);
    console.log('  speedButton:', !!this.speedButton);
  }

  setupButtonInteractivity(): void {
    // Back button
    if (this.backButtonText) {
      this.backButtonText.setInteractive({ useHandCursor: true });
      this.backButtonText.on('pointerdown', () => {
        window.history.back();
      });
    }

    // Start game button
    const startGameHandler = () => {
      console.log('[UIScene] Start game button clicked!');
      const tdScene = this.scene.get('TowerDefenseScene') as any;
      console.log('[UIScene] TowerDefenseScene found:', !!tdScene);
      if (tdScene && tdScene.startGame) {
        console.log('[UIScene] Calling startGame()...');
        tdScene.startGame();
      } else {
        console.error('[UIScene] Cannot start game - startGame method not found');
      }
    };

    if (this.startGameButtonBg) {
      this.startGameButtonBg.setInteractive({ useHandCursor: true });
      this.startGameButtonBg.on('pointerdown', startGameHandler);
    }
    if (this.startGameButtonText) {
      this.startGameButtonText.setInteractive({ useHandCursor: true });
      this.startGameButtonText.on('pointerdown', startGameHandler);
    }
    if (this.cleared_rectangle) {
      this.cleared_rectangle.setInteractive({ useHandCursor: true });
      this.cleared_rectangle.on('pointerdown', startGameHandler);
    }

    // Tower buttons - Map UI buttons to tower types
    this.setupTowerButton(this.ballistaBtn, 'basic');      // Ballista
    this.setupTowerButton(this.trebuchetBtn, 'sniper');    // Trebuchet
    this.setupTowerButton(this.knightBtn, 'melee');        // Knight
    this.setupTowerButton(this.trainingCampBtn, 'fact');   // Training Camp (cannon)
    this.setupTowerButton(this.archmageBtn, 'wizard');     // Archmage

    // Power buttons
    this.setupPowerButton(this.lightningBtn, 'lightning');
    this.setupPowerButton(this.freezeBtn, 'freeze');
    this.setupPowerButton(this.quizBuffBtn, 'question');

    // Tower menu toggle
    if (this.towersToggleIcon) {
      this.towersToggleIcon.setInteractive({ useHandCursor: true });
      this.towersToggleIcon.on('pointerdown', () => {
        this.toggleTowersMenu();
      });
    }

    // Powers menu toggle
    if (this.powersToggleIcon) {
      this.powersToggleIcon.setInteractive({ useHandCursor: true });
      this.powersToggleIcon.on('pointerdown', () => {
        this.togglePowersMenu();
      });
    }

    // Speed button
    const speedHandler = () => {
      this.currentSpeed = (this.currentSpeed % 3) + 1; // Cycle 1 -> 2 -> 3 -> 1
      if (this.speedButtonText) {
        this.speedButtonText.setText(`SPEED\n${this.currentSpeed}x`);
      }

      const tdScene = this.scene.get('TowerDefenseScene') as any;
      if (tdScene && tdScene.setGameSpeed) {
        tdScene.setGameSpeed(this.currentSpeed);
      }
    };

    if (this.speedButton) {
      this.speedButton.setInteractive({ useHandCursor: true });
      this.speedButton.on('pointerdown', speedHandler);
    }
    if (this.speedButtonText) {
      this.speedButtonText.setInteractive({ useHandCursor: true });
      this.speedButtonText.on('pointerdown', speedHandler);
    }

    // Start round button
    const startRoundHandler = () => {
      const tdScene = this.scene.get('TowerDefenseScene') as any;
      if (tdScene && tdScene.startNextWave) {
        tdScene.startNextWave();
      }
    };

    if (this.startRoundButton) {
      this.startRoundButton.setInteractive({ useHandCursor: true });
      this.startRoundButton.on('pointerdown', startRoundHandler);
    }
    if (this.startRoundButtonText) {
      this.startRoundButtonText.setInteractive({ useHandCursor: true });
      this.startRoundButtonText.on('pointerdown', startRoundHandler);
    }
  }

  setupTowerButton(button: Phaser.GameObjects.Image, towerType: string): void {
    if (!button) {
      console.warn(`[UIScene] Tower button for ${towerType} not found`);
      return;
    }
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      const tdScene = this.scene.get('TowerDefenseScene') as any;
      if (tdScene && tdScene.selectTowerType) {
        tdScene.selectTowerType(towerType);
      }
    });
  }

  setupPowerButton(button: Phaser.GameObjects.Image, powerType: string): void {
    if (!button) {
      console.warn(`[UIScene] Power button for ${powerType} not found`);
      return;
    }
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      const tdScene = this.scene.get('TowerDefenseScene') as any;
      if (tdScene && tdScene.activatePower) {
        tdScene.activatePower(powerType);
      }
    });
  }

  toggleTowersMenu(): void {
    this.towersMenuOpen = !this.towersMenuOpen;

    // Toggle icon texture
    const texture = this.towersMenuOpen ? 'towers_opened_icon' : 'towers_closed_icon';
    this.towersToggleIcon.setTexture(texture);

    // Show/hide tower buttons
    this.towerButtons.forEach(btn => btn.setVisible(this.towersMenuOpen));
  }

  togglePowersMenu(): void {
    this.powersMenuOpen = !this.powersMenuOpen;

    // Toggle icon texture
    const texture = this.powersMenuOpen ? 'powers_opened_icon' : 'powers_closed_icon';
    this.powersToggleIcon.setTexture(texture);

    // Show/hide power buttons
    this.powerButtons.forEach(btn => btn.setVisible(this.powersMenuOpen));
  }

  // Update methods called from TowerDefenseScene
  updateGold(gold: number): void {
    if (this.goldText) {
      this.goldText.setText(gold.toString());
    }
  }

  updateLives(lives: number): void {
    // Show/hide hearts based on lives remaining
    this.heartIcons.forEach((heart, index) => {
      if (heart) {
        heart.setVisible(index < lives);
      }
    });
  }

  updateWave(waveNumber: number): void {
    if (this.waveNumberText) {
      this.waveNumberText.setText(waveNumber.toString());
    }
  }

  onGameStarted(): void {
    console.log('[UIScene] onGameStarted called!');
    console.log('[UIScene] Button elements found:', {
      bg: !!this.startGameButtonBg,
      text: !!this.startGameButtonText,
      rectangle: !!this.cleared_rectangle
    });

    // Hide start game button
    if (this.startGameButtonBg) {
      console.log('[UIScene] Hiding start game button bg');
      this.startGameButtonBg.setVisible(false);
    }
    if (this.startGameButtonText) {
      console.log('[UIScene] Hiding start game button text');
      this.startGameButtonText.setVisible(false);
    }
    if (this.cleared_rectangle) {
      console.log('[UIScene] Hiding cleared rectangle');
      this.cleared_rectangle.setVisible(false);
    }

    // Show start round button and speed control
    if (this.startRoundButton) this.startRoundButton.setVisible(true);
    if (this.startRoundButtonText) this.startRoundButtonText.setVisible(true);
    if (this.speedButton) this.speedButton.setVisible(true);
    if (this.speedButtonText) this.speedButtonText.setVisible(true);
  }

  onWaveComplete(): void {
    // Can add wave complete effects here if needed
  }

  onSpeedChanged(speed: number): void {
    this.currentSpeed = speed;
    this.speedButtonText.setText(`SPEED\n${speed}x`);
  }


  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
