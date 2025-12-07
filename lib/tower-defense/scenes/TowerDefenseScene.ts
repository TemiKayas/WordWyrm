import * as Phaser from 'phaser';
import { Quiz, QuizQuestion } from '@/lib/processors/ai-generator';
import { EnemyType, Enemy, Tower, PathPoint } from '@/lib/tower-defense/types/GameTypes';
import { TOWER_SPRITE_SCALES, PROJECTILE_SPRITE_SCALES, TEXT_STYLES, BALANCE_CONSTANTS } from '@/lib/tower-defense/config/GameConfig';
import { ProjectileManager } from '@/lib/tower-defense/managers/ProjectileManager';
import { CombatManager } from '@/lib/tower-defense/managers/CombatManager';
import { EnemyManager } from '@/lib/tower-defense/managers/EnemyManager';
import { TowerManager } from '@/lib/tower-defense/managers/TowerManager';
import { AbilityManager } from '@/lib/tower-defense/managers/AbilityManager';
// Removed StageManager - using single path only
import { gameDataService } from '@/lib/tower-defense/GameDataService';

import { MobileSupport } from '@/lib/phaser/MobileSupport';
import { GameEvents, GAME_EVENTS } from '@/lib/tower-defense/events/GameEvents';
import type UIScene from '@/lib/tower-defense/editor/UIScene';

// Main tower defense scene with quiz integration
// Wave formula: 5 + (1.25 * waveNumber) enemies per wave
// Boss spawns every 5 waves (5, 10, 15, etc.) as the 5th enemy
export default class TowerDefenseScene extends Phaser.Scene {
  // Game entities (managed by respective managers)
  private projectileManager!: ProjectileManager;
  private combatManager!: CombatManager;
  private enemyManager!: EnemyManager;
  private towerManager!: TowerManager;
  private abilityManager!: AbilityManager;
  private mobileSupport!: MobileSupport;
  private path: PathPoint[] = []; // Single enemy movement path
  private pathGraphics?: Phaser.GameObjects.Graphics; // Path graphics
  private backgroundImage?: Phaser.GameObjects.Image; // current background image
  private uiScene!: UIScene; // Reference to UIScene for updating displays and handling events

  // Wave management
  private enemySpawnTimer: number = 0; // ms since last spawn
  private waveActive: boolean = false;
  private waveNumber: number = 0;
  private enemiesToSpawn: number = 0; // remaining spawns in current wave

  // Player state
  private lives: number = 10;
  private gold: number = 0;
  private gameStarted: boolean = false;
  private gameSpeed: number = 1; // 1x, 2x, or 3x speed toggle
  private spaceKey!: Phaser.Input.Keyboard.Key; // Spacebar for speed toggle
  private escKey!: Phaser.Input.Keyboard.Key; // ESC for pause
  private gamePaused: boolean = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private questionPopupActive: boolean = false; // Track if any question popup is currently displayed

  // Tower placement/selection
  private selectedTowerType: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard' | null = null; // Start with no tower selected
  private selectedTower: Tower | null = null; // selected for upgrades
  private clickedOnTower: boolean = false; // prevent double-click placement
  private placementPreview?: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container; // preview sprite for tower placement
  private placementRangePreview?: Phaser.GameObjects.Arc; // range indicator circle for tower placement

  // Quiz system (between-wave questions)
  private quizData!: Quiz;
  private currentQuestionIndex: number = 0;
  private waitingForQuestion: boolean = false;

  // Tower purchase quiz gate system
  private towerPurchaseCount: { basic: number; sniper: number; melee: number; fact: number; wizard: number } = {
    basic: 0,
    sniper: 0,
    melee: 0,
    fact: 0,
    wizard: 0
  };
  private towerPurchasePrice: { basic: number; sniper: number; melee: number; fact: number; wizard: number } = {
    basic: 0, // Will be initialized from TowerManager stats
    sniper: 0,
    melee: 0,
    fact: 0,
    wizard: 0
  };
  private pendingTowerPlacement: { x: number; y: number; type: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard' } | null = null;
  private towerPurchaseQuestionPopup?: Phaser.GameObjects.Container;
  private totalCorrectAnswers: number = 0; // Track all correct answers for wizard unlock
  private ghostTower: Tower | null = null; // Ghost tower waiting for quiz answer
  private totalTowersPlaced: number = 0; // Global tower count for quiz gating (first 2 free)

  // Button positions for contextual quiz placement
  private lastTowerButtonClicked?: { x: number; y: number }; // Position of tower button that was clicked
  private lastUpgradeButtonClicked?: { x: number; y: number }; // Position of upgrade button that was clicked
  private lastAbilityButtonClicked?: { x: number; y: number }; // Position of ability button that was clicked

  // Selection indicator sprites (icon_select.png)
  private towerSelectionIndicator?: Phaser.GameObjects.Image; // Shows on selected tower button
  private upgradeSelectionIndicator?: Phaser.GameObjects.Image; // Shows on selected upgrade button

  // Upgrade knowledge check system
  private upgradeUnlocked: {
    dotArrows: boolean;
    fasterFireRate: boolean;
    explosive: boolean;
    moreDamage: boolean;
  } = {
    dotArrows: false,
    fasterFireRate: false,
    explosive: false,
    moreDamage: false
  };
  private upgradePrices: {
    dotArrows: number;
    fasterFireRate: number;
    explosive: number;
    moreDamage: number;
  } = {
    dotArrows: BALANCE_CONSTANTS.UPGRADE_BASE_PRICE,
    fasterFireRate: BALANCE_CONSTANTS.UPGRADE_BASE_PRICE,
    explosive: BALANCE_CONSTANTS.UPGRADE_BASE_PRICE,
    moreDamage: BALANCE_CONSTANTS.UPGRADE_BASE_PRICE
  };
  private pendingUpgrade: { type: 'explosive' | 'dotArrows' | 'fasterFireRate' | 'moreDamage' } | null = null;
  private upgradeQuestionPopup?: Phaser.GameObjects.Container;

  // Active ability system
  private lightningStrikeActive: boolean = false; // Waiting for enemy selection
  private pendingLightningTarget: Enemy | null = null;
  private abilityQuestionPopup?: Phaser.GameObjects.Container;
  private abilityButtons?: Phaser.GameObjects.Container;
  private frozenEnemies: Set<Enemy> = new Set(); // Track frozen enemies
  private incorrectQuestionIndices: Set<number> = new Set(); // Track incorrect questions for Training Camp tooltips
  private factTowerTooltip?: Phaser.GameObjects.Container;
  private pausedCooldowns: { question: number; timestamp: number } = { question: 0, timestamp: 0 }; // Store Question ability cooldown when wave ends

  // Challenge round system (every 10 waves: rounds 10, 20, 30, etc.)
  // 3 challenging questions, rewards based on score (3/3 = buff choice, 2/3 = 100g, 1/3 = 2 upgrades, 0/3 = nothing)
  private challengeRoundActive: boolean = false;
  private challengeQuestionIndex: number = 0; // Current question (0-2)
  private challengeCorrectCount: number = 0; // Number correct so far
  private challengeQuestions: QuizQuestion[] = []; // The 3 selected questions
  private challengeIncorrectIndices: Set<number> = new Set(); // Track incorrect from challenges for spaced repetition
  private challengeQuestionPopup?: Phaser.GameObjects.Container;
  private buffSelectionPopup?: Phaser.GameObjects.Container;

  // Challenge round buffs (last 10 rounds each)
  private activeBuff: 'aoe' | 'gold' | 'cooldown' | null = null;
  private buffRoundsRemaining: number = 0;

  // Boss system (every 5 waves)
  // Correct answer: boss -10% HP, towers +15% damage/fire rate
  // Incorrect answer: boss +150 HP, +15% speed
  private bossActive: boolean = false;
  private bossEnemy: Enemy | null = null;
  private bossQuestion: QuizQuestion | null = null;
  private bossQuestionPopup?: Phaser.GameObjects.Container;
  private bossQuestionTimer: number = 0; // 30 second timer
  private bossAnsweredCorrectly: boolean[] = []; // for spaced repetition
  private towerGlobalBuffActive: boolean = false; // +15% damage/fire rate
  private bossBuffMessage?: Phaser.GameObjects.Text;

  // UI elements - OLD DOM UI (replaced by Phaser Editor UIScene)
  // private waveButtonText!: Phaser.GameObjects.Text;
  private waveCounterText!: Phaser.GameObjects.Text; // Still used in create() before UIScene loads
  private livesText!: Phaser.GameObjects.Text; // Still used for compatibility, but UIScene is primary
  private goldText!: Phaser.GameObjects.Text; // Still used for compatibility, but UIScene is primary
  // private basicTowerBtn!: Phaser.GameObjects.DOMElement;
  // private sniperTowerBtn!: Phaser.GameObjects.DOMElement;
  // private meleeTowerBtn!: Phaser.GameObjects.DOMElement;
  // private factTowerBtn!: Phaser.GameObjects.DOMElement;
  // private wizardTowerBtn!: Phaser.GameObjects.DOMElement;
  // private waveButton!: Phaser.GameObjects.DOMElement;
  // private backButton!: Phaser.GameObjects.DOMElement;
  private upgradeContainer?: Phaser.GameObjects.Container;
  private upgradeButtons: Phaser.GameObjects.Rectangle[] = [];
  private startGameButton?: Phaser.GameObjects.Container;
  private questionPopup?: Phaser.GameObjects.Container;
  private currentQuizAnswerButtons?: Phaser.GameObjects.Container[];
  private currentQuizQuestion?: QuizQuestion;
  private currentQuizOverlay?: Phaser.GameObjects.Rectangle;
  private currentQuizPanel?: Phaser.GameObjects.Rectangle;
  private currentQuizTextObj?: Phaser.GameObjects.Text;
  private errorMessage?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TowerDefenseScene' });
  }

  // Phaser lifecycle: Initialize scene with quiz data
  // Quiz can be passed from WordWyrm or will be fetched in create() for Phaser Editor
  init(data?: { quiz?: Quiz }) {
    if (data?.quiz) {
      this.quizData = data.quiz;
    }
    // If no quiz provided, it will be loaded in create()
  }

  // Phaser lifecycle: Preload assets
  preload() {
    this.load.svg('checkmark', '/components/game/data/images/checkmark-1.svg', { width: 20, height: 20 });

    // Load tower sprites
    this.load.image('tower_ballista', '/assets/game/Tower_Ballista.PNG');
    this.load.image('tower_catapult', '/assets/game/Tower_Catapult.PNG');
    this.load.image('tower_melee_back', '/assets/game/Tower_MeleeBack.PNG');
    this.load.image('tower_melee_front', '/assets/game/Tower_MeleeFront.PNG');
    this.load.image('tower_wizard_back', '/assets/game/Tower_WizardBack.PNG');
    this.load.image('tower_wizard_front', '/assets/game/Tower_WizardFront.PNG');

    // Load projectile sprites
    this.load.image('proj_ballista', '/assets/game/Projectile_Ballista.PNG');
    this.load.image('proj_catapult', '/assets/game/Projectile_Catapult.PNG');
    this.load.image('proj_wizard', '/assets/game/Projectile_Wizard.PNG');

    // Load icon sprites
    this.load.image('icon_lightning', '/assets/game/Icon_Lightning.PNG');
    this.load.image('icon_freeze', '/assets/game/Icon_Freeze.PNG');
    this.load.image('icon_ballista', '/assets/game/Icon_Ballista.PNG');
    this.load.image('icon_catapult', '/assets/game/Icon_Catapult.PNG');
    this.load.image('icon_wizard', '/assets/game/Icon_Wizard.PNG');
    this.load.image('icon_melee', '/assets/game/Icon_Melee.PNG');
    this.load.image('icon_powerup', '/assets/game/Icon_PowerUp.PNG');

    // Load background map
    this.load.image('grass_map', '/assets/game/UpdatedSizeMap.PNG'); // Main background map

    // Load goblin animation frames (individual images)
    this.load.image('goblin_frame_1', '/assets/game/Goblin_1.png');
    this.load.image('goblin_frame_2', '/assets/game/Goblin_2.png');
    this.load.image('goblin_frame_3', '/assets/game/Goblin_3.png');
    this.load.image('goblin_frame_4', '/assets/game/Goblin_4.png');
    this.load.image('goblin_frame_5', '/assets/game/Goblin_5.png');
  }

  create() {
    console.log('[TowerDefenseScene] create() method called');

    // Load quiz data if not provided via init() (Phaser Editor mode)
    if (!this.quizData) {
      console.log('[TowerDefenseScene] No quiz provided, fetching from GameDataService...');
      const env = gameDataService.getEnvironmentInfo();
      console.log('[TowerDefenseScene] Environment:', env);

      // Load quiz asynchronously without blocking scene creation
      gameDataService.getQuizData()
        .then(quiz => {
          this.quizData = quiz;
          console.log('[TowerDefenseScene] Quiz loaded:', this.quizData.questions.length, 'questions');
        })
        .catch(error => {
          console.error('[TowerDefenseScene] Error loading quiz data:', error);
          // Create fallback quiz data so game can still run
          this.quizData = {
            questions: [
              {
                question: "Fallback question - What is 2+2?",
                options: ["3", "4", "5", "6"],
                answer: "4"
              }
            ]
          };
          console.log('[TowerDefenseScene] Using fallback quiz data');
        });
    } else {
      console.log('[TowerDefenseScene] Using quiz from WordWyrm (passed via init)');
    }

    console.log('[TowerDefenseScene] Launching UI scene...');

    // Launch Phaser Editor UI scene as overlay
    this.scene.launch('UIScene');

    // Ensure UIScene renders on top (as visual overlay)
    this.scene.bringToTop('UIScene');

    // Wait for UIScene to be ready before setting up handlers
    // Use 'create' event which fires after scene.create() completes
    this.scene.get('UIScene').events.once('create', () => {
      console.log('[TowerDefenseScene] UIScene created, getting reference...');
      this.uiScene = this.scene.get('UIScene') as UIScene;

      // Wire up UI event handlers now that UI elements exist
      // NOTE: Event handlers are now set up in UIScene.ts, not here
      // this.setupUIEventHandlers(); // OLD - commented out
      console.log('[TowerDefenseScene] UIScene handles its own events now');

      // Update wizard button state (initially locked)
      this.updateWizardButtonState();
    });

    // Initialize managers
    console.log('[TowerDefenseScene] Initializing managers...');
    this.projectileManager = new ProjectileManager(this);
    this.combatManager = new CombatManager(this);
    this.abilityManager = new AbilityManager();
    // Get screen dimensions
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    console.log('[TowerDefenseScene] Screen dimensions:', width, 'x', height, ', Game area:', gameWidth);

    // Setup keyboard controls
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Setup responsive scaling - listen for resize events
    this.scale.on('resize', this.handleResize, this);

    // Initialize UpdatedSizeMap background (full-screen, behind everything)
    console.log('[TowerDefenseScene] Loading UpdatedSizeMap background...');
    this.backgroundImage = this.add.image(width / 2, height / 2, 'grass_map');
    this.backgroundImage.setOrigin(0.5, 0.5); // Center the image

    // Scale to cover screen while maintaining aspect ratio
    const scaleX = width / this.backgroundImage.width;
    const scaleY = height / this.backgroundImage.height;
    const scale = Math.max(scaleX, scaleY); // Use larger scale to cover entire screen
    this.backgroundImage.setScale(scale);

    this.backgroundImage.setDepth(-2); // Behind everything
    console.log('[TowerDefenseScene] UpdatedSizeMap background loaded successfully');

    // Define single path (hardcoded from Stage1Config)
    const pathY1 = height * 0.65;
    const pathY2 = height * 0.26;
    const pathY3 = height * 0.72;

    this.path = [
      { x: 0, y: pathY1 },
      { x: gameWidth * 0.355, y: pathY1 },
      { x: gameWidth * 0.355, y: pathY2 },
      { x: gameWidth * 0.79, y: pathY2 },
      { x: gameWidth * 0.79, y: pathY3 },
      { x: 1920, y: pathY3 }
    ];

    // Initialize managers after path is set
    this.enemyManager = new EnemyManager(this, this.path);
    this.towerManager = new TowerManager(this, this.path);

    // Initialize mobile support (orientation enforcement, pause handling)
    this.mobileSupport = new MobileSupport(this);
    this.mobileSupport.setup(undefined, undefined, 'UIScene');

    // Initialize tower prices from centralized stats
    this.initializeTowerPrices();

    // Draw path
    this.pathGraphics = this.add.graphics();
    this.pathGraphics.lineStyle(70, 0x5d4037, 1); // Dark brown path
    
    // Initial path calculation will happen in handleResize which is called immediately after
    this.handleResize(this.scale.baseSize);

    // Create goblin walk animation from individual frames
    if (!this.anims.exists('goblin_walk')) {
      this.anims.create({
        key: 'goblin_walk',
        frames: [
          { key: 'goblin_frame_1' },
          { key: 'goblin_frame_2' },
          { key: 'goblin_frame_3' },
          { key: 'goblin_frame_4' },
          { key: 'goblin_frame_5' }
        ],
        frameRate: 8,
        repeat: -1
      });
      console.log('[TowerDefenseScene] Created goblin_walk animation with 5 frames');
    }

    // enable click to place towers
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {

      // Right-click deselects the selected tower (for upgrade UI)
      if (pointer.rightButtonDown()) {
        // Remove border and hide range from selected tower
        if (this.selectedTower) {
          // Only set stroke style on Rectangle/Image, not Container
          if ('setStrokeStyle' in this.selectedTower.graphics) {
            this.selectedTower.graphics.setStrokeStyle(0);
          }
          if (this.selectedTower.rangeCircle) {
            this.selectedTower.rangeCircle.setVisible(false);
          }
        }
        this.selectedTower = null;
        if (this.upgradeContainer) {
          this.upgradeContainer.destroy();
          this.upgradeContainer = undefined;
        }
        this.clickedOnTower = false; // Reset flag
        return;
      }

      // If we clicked on a tower, don't try to place a new tower
      if (this.clickedOnTower) {
        this.clickedOnTower = false; // Reset flag
        return;
      }

      // Calculate dynamic game area (excluding sidebar)
      const width = this.scale.width;
      const sidebarWidth = Math.min(220, width * 0.15);
      const gameWidth = width - sidebarWidth;

      // Check if clicking in game area (not sidebar)
      if (pointer.x <= gameWidth) {
        // Deselect tower when clicking on map
        // Remove border and hide range from selected tower
        if (this.selectedTower) {
          // Only set stroke style on Rectangle/Image, not Container
          if ('setStrokeStyle' in this.selectedTower.graphics) {
            this.selectedTower.graphics.setStrokeStyle(0);
          }
          if (this.selectedTower.rangeCircle) {
            this.selectedTower.rangeCircle.setVisible(false);
          }
        }
        this.selectedTower = null;
        if (this.upgradeContainer) {
          this.upgradeContainer.destroy();
          this.upgradeContainer = undefined;
        }
      }
      this.placeTower(pointer.x, pointer.y);
    });

    // Track mouse movement for placement preview
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.placementPreview && this.selectedTowerType) {
        this.placementPreview.setPosition(pointer.x, pointer.y);

        // Move range indicator with cursor
        if (this.placementRangePreview) {
          this.placementRangePreview.setPosition(pointer.x, pointer.y);
        }

        // Calculate dynamic game area (excluding sidebar)
        const width = this.scale.width;
        const sidebarWidth = Math.min(220, width * 0.15);
        const gameWidth = width - sidebarWidth;

        // Check if wizard tower is unlocked (requires 5 correct answers)
        const wizardUnlocked = this.selectedTowerType !== 'wizard' || this.totalCorrectAnswers >= 5;

        // Change preview opacity based on validity
        const validPlacement = pointer.x <= gameWidth &&
                              !this.towerManager.isTooCloseToPath(pointer.x, pointer.y) &&
                              !this.towerManager.isTooCloseToTowers(pointer.x, pointer.y, 1.0) &&
                              wizardUnlocked;
        this.placementPreview.setAlpha(validPlacement ? 0.7 : 0.3);
      }
    });

    // OLD: show start game button - Now handled by UIScene
    // this.showStartGameButton();
  }

  showStartGameButton() {
    // Responsive centering
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;

    // WordWyrm 3D button styling - solid color with border
    const buttonBg = this.add.rectangle(centerX, centerY, 360, 100, 0x95b607);
    buttonBg.setInteractive({ useHandCursor: true });
    buttonBg.setStrokeStyle(2, 0x006029);

    const buttonText = this.add.text(centerX, centerY, 'START GAME', {
      fontSize: '40px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    this.startGameButton = this.add.container(0, 0, [buttonBg, buttonText]);

    buttonBg.on('pointerdown', () => {
      this.tweens.add({
        targets: [buttonBg, buttonText],
        scaleX: 0.98,
        scaleY: 0.98,
        duration: 100,
        ease: 'Power2',
        onComplete: () => {
          this.startGameButton?.destroy();
          // Give starting gold and start game immediately
          this.gold = 1000;
          this.updateUIDisplays(); // Update UI with starting gold
          this.gameStarted = true;
        }
      });
    });

    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x7a9700);
      buttonBg.setScale(1.02);
      buttonText.setScale(1.02);
    });

    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x95b607);
      buttonBg.setScale(1);
      buttonText.setScale(1);
    });
  }

  showQuestion() {
    this.waitingForQuestion = true;
    this.questionPopupActive = true; // Pause game while question popup is active

    // Bring this scene to top so overlay appears above UIScene
    this.scene.bringToTop();

    // check if we have questions left
    if (this.currentQuestionIndex >= this.quizData.questions.length) {
      // no more questions, just give gold
      this.gold += 50;
      this.updateUIDisplays(); // Update Phaser UI

      // Update upgrade UI colors if tower is selected
      if (this.selectedTower) {
        this.updateUpgradeColors();
      }

      this.waitingForQuestion = false;
      this.questionPopupActive = false; // Resume game
      this.gameStarted = true;

      return;
    }

    const question = this.quizData.questions[this.currentQuestionIndex];
    this.currentQuizQuestion = question; // Store for keyboard handling

    // Responsive dimensions - center in game area (excluding sidebar)
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(700, gameWidth * 0.85);
    const panelHeight = Math.min(540, height * 0.75);

    // popup background overlay - covers FULL SCREEN including sidebar
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.currentQuizOverlay = overlay;
    this.tweens.add({
      targets: overlay,
      alpha: 0.85,
      duration: 200,
      ease: 'Power1'
    });

    // popup panel with shadow - cream background matching site
    const shadow = this.add.rectangle(centerX + 4, centerY + 4, panelWidth, panelHeight, 0x000000, 0.3);
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xfffaf2);
    this.currentQuizPanel = panel;
    panel.setStrokeStyle(4, 0xc4a46f);

    // Simple scale animation
    panel.setScale(0.9);
    shadow.setScale(0.9);
    this.tweens.add({
      targets: [panel, shadow],
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Header background - lime green matching site
    const headerY = centerY - panelHeight/2 + 60;
    const headerBg = this.add.rectangle(centerX, headerY, panelWidth, 90, 0x96b902);
    const headerLine = this.add.rectangle(centerX, headerY + 45, panelWidth - 40, 4, 0xc4a46f);

    // Question number indicator
    const questionNum = this.add.text(centerX, headerY - 20, `Question ${this.currentQuestionIndex + 1}/${this.quizData.questions.length}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // question text with better styling - brown text
    const questionText = this.add.text(centerX, headerY + 15, question.question, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      resolution: 2
    }).setOrigin(0.5);
    this.currentQuizTextObj = questionText;

    const answerButtons: Phaser.GameObjects.Container[] = [];
    this.currentQuizAnswerButtons = answerButtons;

    // create answer buttons with site styling - cream with borders
    const buttonWidth = panelWidth - 50;
    const buttonHeight = 60;
    const startY = centerY - panelHeight/2 + 170;

    question.options.forEach((option, index) => {
      const yPos = startY + (index * 68);
      const isCorrect = option === question.answer;

      // Drop shadow for depth
      const btnShadow = this.add.rectangle(centerX + 4, yPos + 4, buttonWidth, buttonHeight, 0x000000, 0.15);
      // Main button background - cream with gold border
      const btnBg = this.add.rectangle(centerX, yPos, buttonWidth, buttonHeight, 0xfff6e8);
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.setStrokeStyle(3, 0xc4a46f);

      const btnText = this.add.text(centerX, yPos, option, {
        fontSize: '17px',
        color: '#473025', // Brown text
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 40 },
        resolution: 2
      }).setOrigin(0.5);

      const button = this.add.container(0, 0, [btnShadow, btnBg, btnText]);
      answerButtons.push(button);

      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x96b902);
        btnBg.setStrokeStyle(4, 0x7a9700);
        btnText.setColor('#ffffff');
        btnBg.setScale(1.02);
        btnText.setScale(1.02);
      });

      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0xfff6e8);
        btnBg.setStrokeStyle(3, 0xc4a46f);
        btnText.setColor('#473025');
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      btnBg.on('pointerdown', () => {
        btnBg.setScale(0.98);
        btnText.setScale(0.98);
        this.handleAnswer(isCorrect, overlay, panel, questionText, answerButtons);
      });
    });

    // Keep overlay separate from container so it covers full screen
    overlay.setDepth(10000);

    this.questionPopup = this.add.container(0, 0, [shadow, panel, headerBg, headerLine, questionNum, questionText, ...answerButtons]);
    this.questionPopup.setDepth(10001); // Ensure questions always appear on top
  }

  handleAnswer(isCorrect: boolean, overlay: Phaser.GameObjects.Rectangle, panel: Phaser.GameObjects.Rectangle, questionText: Phaser.GameObjects.Text, answerButtons: Phaser.GameObjects.Container[]) {
    // disable all buttons
    answerButtons.forEach(btn => {
      const bg = btn.list[1] as Phaser.GameObjects.Rectangle; // Index 1 because shadow is 0
      bg.removeInteractive();
    });

    // show feedback
    const goldEarned = isCorrect ? 50 : 25;
    this.gold += goldEarned;
    this.updateUIDisplays(); // Update Phaser UI

    // Update upgrade UI colors if tower is selected
    if (this.selectedTower) {
      this.updateUpgradeColors();
    }

    const feedbackText = isCorrect ? 'Correct!' : 'Incorrect';

    // Add feedback animation - inside the quiz panel
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;

    // Calculate position inside the panel - below the answer buttons
    const panelHeight = Math.min(540, height * 0.75);
    const panelBottom = centerY + panelHeight / 2;
    const feedbackY = panelBottom - 80; // Position near bottom of panel, but inside it

    const feedback = this.add.text(centerX, feedbackY, `${feedbackText} +${goldEarned} Gold`, {
      fontSize: '28px',
      color: isCorrect ? '#96b902' : '#ef4444',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5).setAlpha(0);

    // Add explanation text if available
    const question = this.quizData.questions[this.currentQuestionIndex];
    let explanation = null;
    if (question.explanation) {
      const explanationY = feedbackY + 38;
      explanation = this.add.text(centerX, explanationY, question.explanation, {
        fontSize: '15px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '600',
        resolution: 2,
        align: 'center',
        wordWrap: { width: Math.min(550, gameWidth * 0.75) }
      }).setOrigin(0.5).setAlpha(0);
    }

    // Simple fade in animation
    const targets = explanation ? [feedback, explanation] : [feedback];
    this.tweens.add({
      targets: targets,
      alpha: 1,
      duration: 150,
      ease: 'Power2'
    });

    // close popup after delay
    this.time.delayedCall(2000, () => {
      // Fade out animation
      const fadeTargets = explanation
        ? [overlay, panel, questionText, feedback, explanation, ...answerButtons]
        : [overlay, panel, questionText, feedback, ...answerButtons];
      this.tweens.add({
        targets: fadeTargets,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          overlay.destroy();
          panel.destroy();
          questionText.destroy();
          answerButtons.forEach(btn => btn.destroy());
          feedback.destroy();
          if (explanation) explanation.destroy();
          this.questionPopup?.destroy();
          // Bring UIScene back to top
          this.scene.bringToTop('UIScene');
          // Clear quiz references
          this.currentQuizQuestion = undefined;
          this.currentQuizAnswerButtons = undefined;
          this.currentQuizOverlay = undefined;
          this.currentQuizPanel = undefined;
          this.currentQuizTextObj = undefined;
          this.waitingForQuestion = false;
          this.questionPopupActive = false; // Resume game after question answered
          this.gameStarted = true;
          this.currentQuestionIndex++;
        }
      });
    });
  }

  updateTowerSelection() {
    // Remove existing tower selection indicator
    if (this.towerSelectionIndicator) {
      this.towerSelectionIndicator.destroy();
      this.towerSelectionIndicator = undefined;
    }

    // Add icon_select (100x100) to the selected tower button
    if (this.selectedTowerType && this.uiScene) {
      let buttonBg: Phaser.GameObjects.Rectangle | undefined;

      // Get the appropriate button background based on selection
      switch (this.selectedTowerType) {
        case 'basic':
          buttonBg = this.uiScene.ballistaBtnBg;
          break;
        case 'sniper':
          buttonBg = this.uiScene.trebuchetBtnBg;
          break;
        case 'melee':
          buttonBg = this.uiScene.knightBtnBg;
          break;
        case 'fact':
          buttonBg = this.uiScene.trainingCampBtnBg;
          break;
        case 'wizard':
          buttonBg = this.uiScene.archmageBtnBg;
          break;
      }

      // Create selection indicator at button position
      if (buttonBg) {
        this.towerSelectionIndicator = this.add.image(buttonBg.x, buttonBg.y, 'icon_select');
        this.towerSelectionIndicator.setDepth(100); // Ensure it's above other UI elements
        this.towerSelectionIndicator.setScale(0.7); // Scale down from 100x100 to fit button
      }
    }

    // Update placement preview (still needed for game functionality)
    this.updatePlacementPreview();
  }

  // Create or update placement preview sprite
  updatePlacementPreview() {
    // Destroy existing preview
    this.destroyPlacementPreview();

    // Create new preview if tower type is selected
    if (this.selectedTowerType) {
      const stats = this.towerManager.getTowerStats(this.selectedTowerType);

      // Create range indicator circle
      this.placementRangePreview = this.add.circle(0, 0, stats.range, 0xffffff, 0.1);
      this.placementRangePreview.setStrokeStyle(1, 0xffffff, 0.3);
      this.placementRangePreview.setDepth(90); // Below tower preview but above ground

      if (this.selectedTowerType === 'fact') {
        // Training Camp - use rectangle
        this.placementPreview = this.add.rectangle(0, 0, 40, 40, stats.color);
        this.placementPreview.setScale(stats.spriteScale);
        this.placementPreview.setAlpha(0.7);
      } else if (this.selectedTowerType === 'melee' || this.selectedTowerType === 'wizard') {
        // Layered towers - use container with both sprites
        const container = this.add.container(0, 0);
        const backKey = this.selectedTowerType === 'melee' ? 'tower_melee_back' : 'tower_wizard_back';
        const frontKey = this.selectedTowerType === 'melee' ? 'tower_melee_front' : 'tower_wizard_front';
        const backSprite = this.add.image(0, 0, backKey).setOrigin(0.5, 0.5).setScale(stats.spriteScale);
        const frontSprite = this.add.image(0, 0, frontKey).setOrigin(0.5, 0.5).setScale(stats.spriteScale);
        container.add([backSprite, frontSprite]);
        container.setAlpha(0.7);
        this.placementPreview = container;
      } else {
        // Standard towers - single sprite
        const spriteKey = this.selectedTowerType === 'basic' ? 'tower_ballista' : 'tower_catapult';
        this.placementPreview = this.add.image(0, 0, spriteKey);
        this.placementPreview.setScale(stats.spriteScale);
        this.placementPreview.setAlpha(0.7);
      }

      // Set depth to render above game elements but below UI
      this.placementPreview.setDepth(100);
    }
  }

  // Destroy placement preview
  destroyPlacementPreview() {
    if (this.placementPreview) {
      this.placementPreview.destroy();
      this.placementPreview = undefined;
    }
    if (this.placementRangePreview) {
      this.placementRangePreview.destroy();
      this.placementRangePreview = undefined;
    }
  }






  // ===== PUBLIC METHODS CALLED FROM UISCENE =====

  /**
   * Start the game - called from UIScene start button
   */
  startGame(): void {
    console.log('[TowerDefenseScene] Start button clicked via UIScene');

    // Give starting gold and start game
    this.gold = 1000;
    this.gameStarted = true;

    // Emit event to UIScene
    this.events.emit('gameStarted');
    this.updateUIDisplays(); // Update UI with starting gold and initial state

    console.log('[TowerDefenseScene] Game started!');
  }

  /**
   * Start the next wave - called from UIScene start round button
   */
  startNextWave(): void {
    this.startWave();
  }

  /**
   * Select a tower type for placement - called from UIScene tower buttons
   */
  selectTowerType(towerType: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard'): void {
    console.log('[TowerDefenseScene] Tower selected:', towerType);

    if (!this.gameStarted) {
      console.log('[TowerDefenseScene] Game not started yet');
      return;
    }

    // Set selected tower type (will enter placement mode)
    this.selectedTowerType = towerType;

    // Create placement preview
    this.updatePlacementPreview();
  }

  /**
   * Activate a power/ability - called from UIScene power buttons
   */
  activatePower(powerType: 'lightning' | 'freeze' | 'question'): void {
    console.log('[TowerDefenseScene] Power activated:', powerType);

    if (!this.gameStarted) {
      console.log('[TowerDefenseScene] Game not started yet');
      return;
    }

    // Activate the ability
    this.activateAbility(powerType);
  }

  /**
   * Set game speed - called from UIScene speed button
   */
  setGameSpeed(speed: number): void {
    if (speed < 1 || speed > 3) return;

    this.gameSpeed = speed;
    console.log('[TowerDefenseScene] Game speed set to:', speed);

    // Emit event to UIScene (in case other code changed the speed)
    this.events.emit('speedChanged', speed);
  }

  // ===== END PUBLIC METHODS =====

  startWave() {
    if (this.waveActive) return;
    this.waveActive = true;
    this.waveNumber++;
    // INCREASED DIFFICULTY: More enemies per wave (8 + 3 per wave, max 40)
    this.enemiesToSpawn = Math.min(40, Math.floor(8 + (3 * this.waveNumber)));
    this.enemySpawnTimer = 0;
    // this.updateWaveButton(); // OLD DOM UI - now handled by updateUIDisplays()
    this.updateUIDisplays(); // Update wave counter
    this.updateUIDisplays(); // Update Phaser UI
  }

  toggleGameSpeed() {
    // Cycle through 1x -> 2x -> 3x -> 1x
    if (this.gameSpeed === 1) {
      this.gameSpeed = 2;
    } else if (this.gameSpeed === 2) {
      this.gameSpeed = 3;
    } else {
      this.gameSpeed = 1;
    }
    // this.updateWaveButton(); // OLD DOM UI - now handled by updateUIDisplays()
    this.updateUIDisplays(); // Update Phaser UI
  }

  /* OLD DOM UI - Now handled by updateUIDisplays() which updates Phaser Editor UIScene
  updateWaveButton() {
    const buttonElement = this.waveButton.node as HTMLButtonElement;
    if (this.waveActive) {
      // During wave, show speed control with clear indicator and solid colors
      if (this.gameSpeed === 1) {
        buttonElement.textContent = 'Speed: 1x';
        buttonElement.style.background = '#95b607';
        buttonElement.style.borderColor = '#006029';
      } else if (this.gameSpeed === 2) {
        buttonElement.textContent = 'Speed: 2x';
        buttonElement.style.background = '#ff9f22';
        buttonElement.style.borderColor = '#730f11';
      } else {
        buttonElement.textContent = 'Speed: 3x';
        buttonElement.style.background = '#ef4444';
        buttonElement.style.borderColor = '#730f11';
      }
    } else {
      // Between waves, show start wave button
      buttonElement.textContent = `Start Wave ${this.waveNumber + 1}`;
      buttonElement.style.background = '#95b607';
      buttonElement.style.borderColor = '#006029';
    }
  }
  */

  /* OLD UI EVENT HANDLERS - REPLACED BY UIScene.ts
  // Setup UI event handlers for Phaser Editor UI
  setupUIEventHandlers() {
    // NOTE: This method is deprecated. UI event handlers are now set up in UIScene.ts
    // The code has been commented out to prevent errors from old UI property references
    // See UIScene.ts setupButtonInteractivity() for the new implementation
  }
  */

  // Update UI text displays (called from game logic)
  // Emits events to UIScene which updates its own displays
  updateUIDisplays() {
    // Emit events to UIScene to update displays
    this.events.emit('updateGold', this.gold);
    this.events.emit('updateLives', this.lives);
    this.events.emit('updateWave', this.waveNumber);

    // Note: Tower costs and other detailed UI updates can be added as needed
    // For now, UIScene handles basic displays (gold, lives, wave number)
  }

  // Reset tower price to base cost from TowerManager stats
  resetTowerPrice(towerType: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard') {
    const baseCost = this.towerManager.getTowerStats(towerType).cost;
    this.towerPurchasePrice[towerType] = baseCost;
  }

  // Initialize all tower prices from TowerManager stats (called after towerManager is created)
  initializeTowerPrices() {
    this.towerPurchasePrice.basic = this.towerManager.getTowerStats('basic').cost;
    this.towerPurchasePrice.sniper = this.towerManager.getTowerStats('sniper').cost;
    this.towerPurchasePrice.melee = this.towerManager.getTowerStats('melee').cost;
    this.towerPurchasePrice.fact = this.towerManager.getTowerStats('fact').cost;
    this.towerPurchasePrice.wizard = this.towerManager.getTowerStats('wizard').cost;
  }

  // Helper to setup tower button click handlers and hover feedback (reduces duplication)
  setupTowerButton(button: Phaser.GameObjects.Rectangle, towerType: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard') {
    button.on('pointerdown', () => {
      this.selectedTowerType = towerType;
      this.lastTowerButtonClicked = { x: button.x, y: button.y };
      this.updateTowerSelection();
    });

    // Add hover feedback
    button.on('pointerover', () => {
      button.setScale(1.05); // Slight scale up on hover
    });

    button.on('pointerout', () => {
      button.setScale(1); // Return to normal size
    });
  }

  // Place a tower at clicked position with validation
  // Checks: gold cost, path distance, tower spacing, UI bounds
  // Creates ghost tower immediately, then shows quiz
  placeTower(x: number, y: number) {
    if (!this.gameStarted || this.waitingForQuestion || this.selectedTowerType === null) return;

    // Don't place if ghost tower already exists
    if (this.ghostTower !== null) return;

    // Check if wizard tower is unlocked (requires 5 correct answers)
    if (this.selectedTowerType === 'wizard' && this.totalCorrectAnswers < 5) {
      this.showErrorMessage(`Archmage locked! Need 5 correct answers (${this.totalCorrectAnswers}/5)`);
      return;
    }

    // Don't place in UI area (right sidebar) - calculate dynamic game width
    const width = this.scale.width;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    if (x > gameWidth) return;

    // Don't place on enemy path (40px clearance)
    if (this.towerManager.isTooCloseToPath(x, y)) return;

    // Get tower stats from centralized source (TowerManager)
    const towerStats = this.towerManager.getTowerStats(this.selectedTowerType);

    // Don't place too close to other towers
    if (this.towerManager.isTooCloseToTowers(x, y, towerStats.size)) {
      this.showErrorMessage('Too close to other tower!');
      return;
    }

    // check if player has enough gold (use dynamic price)
    const currentPrice = this.towerPurchasePrice[this.selectedTowerType];
    if (this.gold < currentPrice) {
      this.showErrorMessage('Not enough gold!');
      return;
    }

    // Quiz gate: First 2 towers (any type) are free, 3rd+ requires ghost + quiz
    if (this.totalTowersPlaced < 2) {
      // First 2 towers total - place immediately (no ghost, no quiz)
      this.completeTowerPlacement(x, y, this.selectedTowerType);
    } else {
      // 3rd+ tower - create ghost, then show quiz
      // Create ghost tower immediately (semi-transparent, non-interactive)
      const ghostGraphics = this.createTowerGraphics(x, y, this.selectedTowerType, towerStats, true);

      // Create ghost tower object (not added to towerManager yet)
      this.ghostTower = {
        x: x,
        y: y,
        range: towerStats.range,
        fireRate: towerStats.fireRate,
        damage: towerStats.damage,
        cost: currentPrice,
        lastFired: 0,
        type: this.selectedTowerType,
        graphics: ghostGraphics,
        upgrades: {},
        baseDamage: towerStats.damage,
        baseFireRate: towerStats.fireRate,
        size: towerStats.size,
        // Ghost towers don't have these yet (added when converted to real)
        buffRadius: undefined,
        baseBuffRadius: undefined,
        factText: undefined,
        boosted: false,
        boostedUntil: 0,
        currentSpell: undefined,
        nextSpell: undefined,
        correctAnswersWhenPlaced: undefined,
        lastChargeBlast: undefined
      };

      // Store pending placement data for quiz handler
      this.pendingTowerPlacement = { x, y, type: this.selectedTowerType };

      // CRITICAL FIX: Destroy placement preview so it doesn't follow cursor
      // The ghost tower is now placed at (x, y) and should stay there
      this.destroyPlacementPreview();

      // Show quiz immediately after creating ghost
      this.showTowerPurchaseQuestion(this.selectedTowerType);
    }
  }

  // Convert ghost tower to real tower
  // Called after correct quiz answer - deducts gold, makes interactive
  convertGhostToRealTower() {
    if (!this.ghostTower || !this.pendingTowerPlacement) return;

    const towerType = this.pendingTowerPlacement.type;
    const x = this.ghostTower.x;
    const y = this.ghostTower.y;

    // Get tower stats for this type
    const towerStats = this.towerManager.getTowerStats(towerType);

    // Deduct gold at current price
    const currentPrice = this.towerPurchasePrice[towerType];
    this.gold -= currentPrice;
    this.updateUIDisplays(); // Update UI

    // Increment purchase count
    this.towerPurchaseCount[towerType]++;

    // Reset price to base after successful purchase
    this.resetTowerPrice(towerType);

    // Unlock Question ability when first Fact tower is placed
    if (towerType === 'fact' && this.towerPurchaseCount.fact === 1) {
      this.abilityManager.unlockQuestionAbility();
    }

    // Update upgrade UI colors if tower is selected
    if (this.selectedTower) {
      this.updateUpgradeColors();
    }

    // Destroy ghost graphics and create real tower graphics
    this.ghostTower.graphics.destroy();

    // Create new real tower graphics (not ghost mode)
    const realGraphics = this.createTowerGraphics(x, y, towerType, towerStats, false);
    this.ghostTower.graphics = realGraphics;

    // Select fact text for tooltip (from incorrect questions or random)
    let factText = '';
    if (towerType === 'fact') {
      if (this.incorrectQuestionIndices.size > 0) {
        const incorrectIndex = Array.from(this.incorrectQuestionIndices)[Math.floor(Math.random() * this.incorrectQuestionIndices.size)];
        const question = this.quizData.questions[incorrectIndex];
        factText = question.explanation || question.question;
      } else {
        const randomQuestion = this.quizData.questions[Math.floor(Math.random() * this.quizData.questions.length)];
        factText = randomQuestion.explanation || randomQuestion.question;
      }
    }

    // Add tower-specific properties
    this.ghostTower.cost = currentPrice;
    if (towerType === 'fact') {
      this.ghostTower.buffRadius = 200;
      this.ghostTower.baseBuffRadius = 200;
      this.ghostTower.factText = factText;
    }
    if (towerType === 'wizard') {
      this.ghostTower.currentSpell = 'fire';
      this.ghostTower.nextSpell = 'ice';
      this.ghostTower.correctAnswersWhenPlaced = this.totalCorrectAnswers;
      this.ghostTower.lastChargeBlast = 0;
    }

    // CRITICAL FIX: Capture tower reference in closure before ghostTower is nulled
    const towerRef = this.ghostTower;

    // Add click handler to select tower for upgrades or Question ability
    realGraphics.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('[TowerDefenseScene] Converted tower clicked!', towerType, 'at', x, y);
      this.clickedOnTower = true;
      pointer.event.stopPropagation();

      // Check if we're in Training Camp selection mode for Question ability
      if (towerRef!.type === 'fact' && this.abilityManager.isQuestionAbilitySelectionMode()) {
        this.abilityManager.boostTrainingCamp(towerRef!);
        this.showTrainingCampBoostFeedback();
        return;
      }

      // Normal tower selection for upgrades
      this.selectedTowerType = null;
      this.updateTowerSelection();
      this.selectTowerForUpgrade(towerRef!);
    });

    // Add hover tooltip for Training Camps
    if (towerType === 'fact' && factText) {
      realGraphics.on('pointerover', () => {
        this.showFactTowerTooltip(towerRef!);
      });

      realGraphics.on('pointerout', () => {
        this.hideFactTowerTooltip();
      });
    }

    // Draw range circle and hide by default
    const rangeCircle = this.add.circle(x, y, this.ghostTower.range, towerStats.color, 0.1);
    rangeCircle.setStrokeStyle(2, towerStats.color, 0.3);
    rangeCircle.setVisible(false); // Hide by default, show only when selected
    this.ghostTower.rangeCircle = rangeCircle;

    // Add spell glow indicator for Wizard tower
    if (towerType === 'wizard' && this.ghostTower.nextSpell) {
      const glowColor = this.ghostTower.nextSpell === 'fire' ? 0xff0000 : (this.ghostTower.nextSpell === 'ice' ? 0x00ffff : 0xffff00);
      const glow = this.add.circle(x, y, 25 * this.ghostTower.size, glowColor, 0.25);
      glow.setStrokeStyle(2, glowColor, 0.3);
      this.ghostTower.spellGlow = glow;
    }

    // Add tower to manager
    this.towerManager.addTower(this.ghostTower);
    console.log('[TowerDefenseScene] Ghost tower converted to real tower. Total towers:', this.towerManager.getTowers().length);

    // Increment global tower count
    this.totalTowersPlaced++;

    // Clear ghost reference
    this.ghostTower = null;

    // Deselect tower type after placement
    this.selectedTowerType = null;
    this.updateTowerSelection();

    // Update Phaser UI to reflect gold changes and tower costs
    this.updateUIDisplays();
  }

  // Helper: Create tower graphics based on type
  // Used for both ghost towers and real towers
  createTowerGraphics(
    x: number,
    y: number,
    towerType: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard',
    towerStats: { color: number; spriteScale: number },
    isGhost: boolean = false
  ): Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Container {
    let towerGraphics: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Container;

    if (towerType === 'fact') {
      // Training Camp keeps rectangle style (no sprite asset)
      const rect = this.add.rectangle(x, y, 40, 40, towerStats.color);
      rect.setScale(towerStats.spriteScale);
      rect.setStrokeStyle(0);
      if (!isGhost) {
        rect.setInteractive({ useHandCursor: true });
      }
      towerGraphics = rect;
    } else if (towerType === 'melee' || towerType === 'wizard') {
      // Layered towers (Knight and Archmage) - use back and front sprites
      const container = this.add.container(x, y);

      const backKey = towerType === 'melee' ? 'tower_melee_back' : 'tower_wizard_back';
      const frontKey = towerType === 'melee' ? 'tower_melee_front' : 'tower_wizard_front';

      const backSprite = this.add.image(0, 0, backKey);
      const frontSprite = this.add.image(0, 0, frontKey);

      // Explicitly set origin to center (0.5, 0.5) to ensure sprites are centered in container
      backSprite.setOrigin(0.5, 0.5);
      frontSprite.setOrigin(0.5, 0.5);

      backSprite.setScale(towerStats.spriteScale);
      frontSprite.setScale(towerStats.spriteScale);

      container.add([backSprite, frontSprite]);

      // Calculate hitbox size based on sprite dimensions and scale
      // Assuming sprites are ~800x800, scaled to 0.1/0.11 = ~80-88 pixels
      const spriteSize = 100; // Generous hitbox for easier clicking
      container.setSize(spriteSize, spriteSize);
      if (!isGhost) {
        // Position circle at center of container bounds (spriteSize/2, spriteSize/2)
        // This aligns with the sprite centers which are at (0, 0) with origin (0.5, 0.5)
        container.setInteractive(new Phaser.Geom.Circle(spriteSize / 2, spriteSize / 2, spriteSize / 2), Phaser.Geom.Circle.Contains);
        (container.input! as { cursor?: string }).cursor = 'pointer';
      }

      towerGraphics = container;
    } else {
      // Standard towers (Ballista, Trebuchet) - single sprite
      const spriteKey = towerType === 'basic' ? 'tower_ballista' : 'tower_catapult';
      const sprite = this.add.image(x, y, spriteKey);
      sprite.setScale(towerStats.spriteScale);
      if (!isGhost) {
        sprite.setInteractive({ useHandCursor: true });
      }
      towerGraphics = sprite;
    }

    // Ghost towers are semi-transparent
    if (isGhost) {
      towerGraphics.setAlpha(0.5);
    }

    // Set depth so towers render above background (-2) and paths (-1) but below UI
    towerGraphics.setDepth(1);

    return towerGraphics;
  }

  // Complete tower placement after validation/quiz
  completeTowerPlacement(x: number, y: number, towerType: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard') {
    // Get tower stats from centralized source (TowerManager)
    const towerStats = this.towerManager.getTowerStats(towerType);

    // Deduct gold at current price
    const currentPrice = this.towerPurchasePrice[towerType];
    this.gold -= currentPrice;
    this.updateUIDisplays(); // Update UI

    // Increment purchase count
    this.towerPurchaseCount[towerType]++;

    // Reset price to base after successful purchase
    this.resetTowerPrice(towerType);

    // Unlock Question ability when first Fact tower is placed
    if (towerType === 'fact' && this.towerPurchaseCount.fact === 1) {
      this.abilityManager.unlockQuestionAbility();
    }

    // Update upgrade UI colors if tower is selected
    if (this.selectedTower) {
      this.updateUpgradeColors();
    }

    // Create tower visual using helper method
    const towerGraphics = this.createTowerGraphics(x, y, towerType, towerStats, false);

    // Select fact text for tooltip (from incorrect questions or random)
    let factText = '';
    if (towerType === 'fact') {
      if (this.incorrectQuestionIndices.size > 0) {
        const incorrectIndex = Array.from(this.incorrectQuestionIndices)[Math.floor(Math.random() * this.incorrectQuestionIndices.size)];
        const question = this.quizData.questions[incorrectIndex];
        factText = question.explanation || question.question;
      } else {
        const randomQuestion = this.quizData.questions[Math.floor(Math.random() * this.quizData.questions.length)];
        factText = randomQuestion.explanation || randomQuestion.question;
      }
    }

    const tower: Tower = {
      x: x,
      y: y,
      range: towerStats.range,
      fireRate: towerStats.fireRate,
      damage: towerStats.damage,
      cost: currentPrice, // Store actual paid price
      lastFired: 0,
      type: towerType,
      graphics: towerGraphics,
      upgrades: {},
      baseDamage: towerStats.damage,
      baseFireRate: towerStats.fireRate,
      size: towerStats.size,
      // Fact tower specific properties
      buffRadius: towerType === 'fact' ? 200 : undefined,
      baseBuffRadius: towerType === 'fact' ? 200 : undefined,
      factText: towerType === 'fact' ? factText : undefined,
      boosted: false,
      boostedUntil: 0,
      // Wizard tower specific properties
      currentSpell: towerType === 'wizard' ? 'fire' : undefined,
      nextSpell: towerType === 'wizard' ? 'ice' : undefined,
      correctAnswersWhenPlaced: towerType === 'wizard' ? this.totalCorrectAnswers : undefined,
      lastChargeBlast: towerType === 'wizard' ? 0 : undefined
    };

    // Add click handler to select tower for upgrades or Question ability
    towerGraphics.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('[TowerDefenseScene] Tower clicked!', towerType, 'at', x, y);
      this.clickedOnTower = true;
      pointer.event.stopPropagation();

      // Check if we're in Training Camp selection mode for Question ability
      if (tower.type === 'fact' && this.abilityManager.isQuestionAbilitySelectionMode()) {
        this.abilityManager.boostTrainingCamp(tower);
        this.showTrainingCampBoostFeedback();
        return;
      }

      // Normal tower selection for upgrades
      this.selectedTowerType = null;
      this.updateTowerSelection();
      this.selectTowerForUpgrade(tower);
    });

    // Add hover tooltip for Training Camps
    if (towerType === 'fact' && factText) {
      towerGraphics.on('pointerover', () => {
        this.showFactTowerTooltip(tower);
      });

      towerGraphics.on('pointerout', () => {
        this.hideFactTowerTooltip();
      });
    }

    // Draw range circle and hide by default
    const rangeCircle = this.add.circle(x, y, tower.range, towerStats.color, 0.1);
    rangeCircle.setStrokeStyle(2, towerStats.color, 0.3);
    rangeCircle.setVisible(false); // Hide by default, show only when selected
    tower.rangeCircle = rangeCircle;

    // Add spell glow indicator for Wizard tower
    if (towerType === 'wizard' && tower.nextSpell) {
      const glowColor = tower.nextSpell === 'fire' ? 0xff0000 : (tower.nextSpell === 'ice' ? 0x00ffff : 0xffff00);
      const glow = this.add.circle(x, y, 25 * towerStats.size, glowColor, 0.25);
      glow.setStrokeStyle(2, glowColor, 0.3);
      tower.spellGlow = glow;
    }

    this.towerManager.addTower(tower); // Register with manager
    console.log('[TowerDefenseScene] Tower added to manager. Total towers:', this.towerManager.getTowers().length);

    // Increment global tower count
    this.totalTowersPlaced++;

    // Deselect tower type after placement
    this.selectedTowerType = null;
    this.updateTowerSelection();

    // Update Phaser UI to reflect gold changes and tower costs
    this.updateUIDisplays();
  }

  showErrorMessage(message: string, color?: number) {
    if (this.errorMessage) {
      this.errorMessage.destroy();
    }

    // Responsive positioning - center horizontally, bottom third of screen
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const messageY = height * 0.65; // Position in bottom third

    // Convert hex color to CSS color string if provided
    const textColor = color !== undefined ? `#${color.toString(16).padStart(6, '0')}` : TEXT_STYLES.ERROR_MESSAGE.color;

    this.errorMessage = this.add.text(centerX, messageY, message, {
      ...TEXT_STYLES.ERROR_MESSAGE,
      color: textColor,
      fontSize: Math.min(24, width / 60) + 'px'
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      this.errorMessage?.destroy();
    });
  }

  // Helper to handle Training Camp boost feedback (reduces duplication)
  showTrainingCampBoostFeedback() {
    this.highlightFactTowers(false);
    this.showErrorMessage('Training Camp boosted! +10% radius, 15% buffs for 2 minutes');
  }

  // Update wizard tower button visual state based on unlock status
  updateWizardButtonState() {
    if (!this.uiScene) return;

    const unlocked = this.totalCorrectAnswers >= 5;

    // Access the archmage button from UIScene
    const archmageBtn = (this.uiScene as any).archmageBtn as Phaser.GameObjects.Image | undefined;
    if (!archmageBtn) return; // Button doesn't exist yet

    if (unlocked) {
      // Unlocked: full opacity, interactive
      archmageBtn.setAlpha(1);
      archmageBtn.clearTint();
      archmageBtn.setInteractive({ useHandCursor: true });
    } else {
      // Locked: reduced opacity and greyed out
      archmageBtn.setAlpha(0.5);
      archmageBtn.setTint(0x888888); // Grey tint
      archmageBtn.disableInteractive(); // Make it non-clickable
    }
  }

  /**
   * Handle window/canvas resize events
   * Updates game area, background, and paths for responsive scaling
   */
  handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    console.log('[TowerDefenseScene] Resize detected:', width, 'x', height);

    // Get actual background image dimensions
    // Default to 1920x1080 if image not loaded yet
    const bgWidth = this.backgroundImage?.width || 1920;
    const bgHeight = this.backgroundImage?.height || 1080;

    // Calculate "Cover" scale (fill screen, maintain aspect ratio)
    const scaleX = width / bgWidth;
    const scaleY = height / bgHeight;
    const scale = Math.max(scaleX, scaleY);

    // Update background if it exists
    if (this.backgroundImage) {
      this.backgroundImage.setPosition(width / 2, height / 2); // Center of screen
      this.backgroundImage.setScale(scale);
    }

    // Path points defined as percentages of the BACKGROUND IMAGE dimensions
    // This ensures alignment regardless of the image's native resolution
    const pathY1 = bgHeight * 0.65;
    const pathY2 = bgHeight * 0.26;
    const pathY3 = bgHeight * 0.72;
    
    const x2 = bgWidth * 0.352;
    const x4 = bgWidth * 0.66;

    const basePath = [
      { x: 0, y: pathY1 },
      { x: x2, y: pathY1 },
      { x: x2, y: pathY2 },
      { x: x4, y: pathY2 },
      { x: x4, y: pathY3 },
      { x: bgWidth, y: pathY3 }
    ];

    // Transform base points to screen space using the "Cover" scaling
    // Formula: (Point - ImageCenter) * Scale + ScreenCenter
    this.path = basePath.map(p => ({
      x: (p.x - bgWidth / 2) * scale + width / 2,
      y: (p.y - bgHeight / 2) * scale + height / 2
    }));

    // Redraw path
    if (this.pathGraphics) {
      this.pathGraphics.clear();
      this.pathGraphics.lineStyle(70 * scale, 0x5d4037, 1); // Scale path width
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i < this.path.length; i++) {
        this.pathGraphics.lineTo(this.path[i].x, this.path[i].y);
      }
      this.pathGraphics.strokePath();
      this.pathGraphics.setDepth(-1);
    }

    // Sync updated path with managers
    if (this.enemyManager) {
      this.enemyManager.setPath(this.path);
    }
    if (this.towerManager) {
      this.towerManager.setPath(this.path);
    }

    // Update selection indicator position if active
    this.updateTowerSelection();

    // Emit resize event for UIScene and other listeners
    GameEvents.emit(GAME_EVENTS.RESIZE, gameSize);
  }

  // Phaser lifecycle: Main game loop (runs ~60 times per second)
  // Handles: enemy spawning, movement, tower attacks, projectiles, DoT, boss timer
  update(time: number, delta: number) {
    // Check if paused due to mobile state (orientation/visibility)
    if (this.mobileSupport && this.mobileSupport.isPaused()) {
      return;
    }

    // Pause game when question popup is active
    if (this.questionPopupActive) {
      return; // Skip all game updates while popup is showing
    }

    // Handle keyboard shortcuts even when game not started
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const key1 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const key2 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    const key3 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    const key4 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

    // Handle Enter key to start wave
    if (Phaser.Input.Keyboard.JustDown(enterKey) && !this.waveActive && !this.waitingForQuestion) {
      this.startWave();
    }

    // Handle number keys for quiz answers
    if (this.currentQuizQuestion && this.currentQuizAnswerButtons && this.currentQuizOverlay && this.currentQuizPanel && this.currentQuizTextObj) {
      const keys = [key1, key2, key3, key4];
      for (let i = 0; i < keys.length; i++) {
        if (Phaser.Input.Keyboard.JustDown(keys[i]) && this.currentQuizQuestion.options.length > i) {
          const isCorrect = this.currentQuizQuestion.options[i] === this.currentQuizQuestion.answer;
          this.handleAnswer(isCorrect, this.currentQuizOverlay, this.currentQuizPanel, this.currentQuizTextObj, this.currentQuizAnswerButtons);
          break;
        }
      }
    }

    if (!this.gameStarted) return;

    // Handle spacebar for speed toggle
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.waveActive) {
      this.toggleGameSpeed();
    }

    const scaledDelta = delta * this.gameSpeed; // 2x speed when toggled

    // Apply cooldown buff (25% faster cooldowns)
    const cooldownMultiplier = this.activeBuff === 'cooldown' ? 1.25 : 1.0;

    // Update ability cooldowns (use real time, not scaled)
    // Question ability cooldown is paused between waves
    this.abilityManager.updateCooldowns(delta, cooldownMultiplier, !this.waveActive);

    // Update UI visuals for abilities
    if (this.uiScene) {
      this.uiScene.setPowerButtonState('lightning', this.abilityManager.getLightningStrikeStatus(this.gold).available);
      this.uiScene.setPowerButtonState('freeze', this.abilityManager.getFreezeStatus(this.gold).available);
      this.uiScene.setPowerButtonState('question', this.abilityManager.getQuestionAbilityStatus().available);
    }

    // Check for Training Camp boost expiration (2 minute duration)
    this.abilityManager.updateTrainingCampBoosts(this.towerManager.getTowers());

    // Boss question timer (30 seconds, uses real time not game speed)
    if (this.bossQuestionPopup && this.bossQuestion) {
      this.bossQuestionTimer += delta;
      const timeRemaining = Math.max(0, 30 - Math.floor(this.bossQuestionTimer / 1000));

      // Update countdown display
      const timerText = this.bossQuestionPopup.list[3] as Phaser.GameObjects.Text;
      if (timerText) {
        timerText.setText(`Time: ${timeRemaining}s`);
      }

      // Auto-fail on timeout
      if (this.bossQuestionTimer >= 30000) {
        const questionIndex = this.quizData.questions.findIndex(q => q.question === this.bossQuestion?.question);
        const bossBaseHealth = this.bossEnemy ? this.bossEnemy.maxHealth : 300;
        this.handleBossAnswer(false, bossBaseHealth, questionIndex);
      }
    }

    // FASTER SPAWNING: Decreases with wave number for more challenge
    if (this.waveActive && this.enemiesToSpawn > 0) {
      this.enemySpawnTimer += scaledDelta;
      // Spawn interval: 700ms base, decreases by 30ms per wave, min 300ms
      const spawnInterval = Math.max(300, 700 - (this.waveNumber * 30));
      if (this.enemySpawnTimer > spawnInterval) {
        const spawnedEnemy = this.enemyManager.spawnEnemy(
          this.waveNumber,
          this.enemiesToSpawn,
          (enemy) => {
            if (this.lightningStrikeActive) {
              this.executeLightningStrike(enemy);
            }
          },
          (baseHealth) => {
            this.bossActive = true;
            this.showBossQuestion(baseHealth);
          }
        );

        // Store boss reference
        if (spawnedEnemy.type === EnemyType.BOSS) {
          this.bossEnemy = spawnedEnemy;
        }

        this.enemiesToSpawn--;
        this.enemySpawnTimer = 0;
      }
    }

    // Wave completion: all enemies spawned and killed
    if (this.waveActive && this.enemiesToSpawn === 0 && this.enemyManager.getEnemies().length === 0) {
      this.waveActive = false;
      // Keep speed persistent - don't reset to 1x
      // this.updateWaveButton(); // OLD DOM UI - now handled by updateUIDisplays()

      // Clear boss state (buffs, UI, references)
      if (this.bossActive) {
        this.bossActive = false;
        this.bossEnemy = null;
        this.towerGlobalBuffActive = false; // Remove damage/fire rate buff
        if (this.bossBuffMessage) {
          this.bossBuffMessage.destroy();
          this.bossBuffMessage = undefined;
        }
        if (this.bossQuestionPopup) {
          this.bossQuestionPopup.destroy();
          this.bossQuestionPopup = undefined;
          // Bring UIScene back to top
          this.scene.bringToTop('UIScene');
        }
      }

      // Check for challenge round (every 10 waves: 10, 20, 30, etc.)
      if (this.waveNumber % 10 === 0) {
        this.startChallengeRound();
      }

      // Decrement buff rounds remaining (if buff is active)
      if (this.activeBuff && this.buffRoundsRemaining > 0) {
        this.buffRoundsRemaining--;
        if (this.buffRoundsRemaining === 0) {
          this.activeBuff = null; // Buff expired
        }
      }
    }

    // Update enemies (manager handles movement, health bars, cleanup)
    const { deaths, escapes } = this.enemyManager.updateEnemies(scaledDelta, this.activeBuff === 'gold');

    // Handle enemy deaths
    deaths.forEach(({ enemy, goldReward }) => {
      this.gold += goldReward;
      this.updateUIDisplays(); // Update UI

      // Clear boss reference if boss died
      if (enemy.type === EnemyType.BOSS && this.bossEnemy === enemy) {
        this.bossEnemy = null;
      }

      // Update upgrade UI colors if tower is selected
      if (this.selectedTower) {
        this.updateUpgradeColors();
      }
    });

    // Handle enemy escapes
    escapes.forEach(() => {
      this.lives--;
      this.updateUIDisplays(); // Update lives display

      if (this.lives <= 0) {
        this.gameOver();
      }
    });

    // Update healer and commander auras
    this.enemyManager.updateHealerAuras(this.gameSpeed);
    this.enemyManager.updateCommanderAuras();

    // Tower shooting logic (applies global boss buff if active)
    const towers = this.towerManager.getTowers();
    const enemies = this.enemyManager.getEnemies();

    // Debug log every 60 frames (~1 second) to avoid spam
    if (Math.floor(time / 1000) % 60 === 0 && time % 1000 < 50) {
      console.log('[TowerDefenseScene] Update: Towers:', towers.length, 'Enemies:', enemies.length);
    }

    towers.forEach(tower => {
      // Skip Training Camps (they don't attack)
      if (tower.type === 'fact') return;

      // Calculate Training Camp buffs (manager handles buff calculation)
      const { damageMultiplier: factTowerDamageBuff, fireRateMultiplier: factTowerSpeedBuff } =
        this.towerManager.calculateTrainingCampBuffs(tower);

      // Calculate fire rate with buffs
      let effectiveFireRate = tower.fireRate;
      effectiveFireRate *= factTowerSpeedBuff; // Training Camp buff
      if (this.towerGlobalBuffActive) {
        effectiveFireRate *= 0.85; // Boss buff: 15% faster
      }
      const adjustedFireRate = effectiveFireRate / this.gameSpeed; // Speed toggle

      if (time - tower.lastFired > adjustedFireRate) {
        const target = this.combatManager.findClosestEnemy(tower, this.enemyManager.getEnemies());
        if (target) {
          // Rotate tower to face target (with -90° offset for sprite orientation)
          const dx = target.x - tower.x;
          const dy = target.y - tower.y;
          const angle = Math.atan2(dy, dx);
          tower.graphics.setRotation(angle - Math.PI / 2);

          // Calculate damage with buffs
          let effectiveDamage = tower.damage;
          effectiveDamage *= factTowerDamageBuff; // Training Camp buff
          if (this.towerGlobalBuffActive) {
            effectiveDamage *= 1.15; // Boss buff: 15% more damage
          }

          if (tower.type === 'melee') {
            this.combatManager.applyDamage(target, effectiveDamage); // Hitscan (instant)

            // Apply AoE buff for melee attacks too
            if (this.activeBuff === 'aoe') {
              const aoeRadius = 7.5; // 0.5x red enemy hitbox (15px)
              this.enemyManager.getEnemies().forEach(enemy => {
                if (enemy === target) return; // Already damaged
                const ex = enemy.x - target.x;
                const ey = enemy.y - target.y;
                const enemyDist = Math.sqrt(ex * ex + ey * ey);
                if (enemyDist < aoeRadius) {
                  this.combatManager.applyDamage(enemy, effectiveDamage);
                }
              });
            }
          } else {
            this.projectileManager.shootProjectile(tower, target, effectiveDamage); // Projectile
          }
          tower.lastFired = time;
        }
      }
    });

    // update projectiles (manager returns hits this frame)
    const projectileHits = this.projectileManager.updateProjectiles(scaledDelta);

    // Handle projectile hits
    projectileHits.forEach(proj => {
      // Apply direct damage with armor reduction
      this.combatManager.applyDamage(proj.target, proj.damage);

      // Apply AoE buff (all tower attacks deal small AoE damage)
      if (this.activeBuff === 'aoe') {
        const aoeRadius = 7.5; // 0.5x red enemy hitbox (15px)
        this.enemyManager.getEnemies().forEach(enemy => {
          if (enemy === proj.target) return; // Already damaged
          const ex = enemy.x - proj.target.x;
          const ey = enemy.y - proj.target.y;
          const enemyDist = Math.sqrt(ex * ex + ey * ey);
          if (enemyDist < aoeRadius) {
            this.combatManager.applyDamage(enemy, proj.damage);
          }
        });
      }

      // Check for explosive upgrade (trebuchet/sniper)
      if (proj.sourceTower.upgrades.explosive) {
        // Explosion radius based on red enemy hitbox: 15 * 0.85 * 1.5 = ~19 pixels
        const explosionRadius = 19.125;

        this.enemyManager.getEnemies().forEach(enemy => {
          if (enemy === proj.target) return; // Already damaged
          const ex = enemy.x - proj.target.x;
          const ey = enemy.y - proj.target.y;
          const enemyDist = Math.sqrt(ex * ex + ey * ey);
          if (enemyDist < explosionRadius) {
            this.combatManager.applyDamage(enemy, proj.damage);
          }
        });

        // Visual explosion effect
        const explosion = this.add.graphics();
        explosion.fillStyle(0xff6600, 0.5);
        explosion.fillCircle(proj.target.x, proj.target.y, explosionRadius);
        this.time.delayedCall(100, () => explosion.destroy());
      }

      // Check for DOT upgrade (ballista/basic)
      if (proj.sourceTower.upgrades.dotArrows) {
        // Apply DOT: 2 damage per tick for 2 seconds (4 ticks total at 500ms per tick)
        this.combatManager.addDoTEffect(proj.target, 2, 4, time);
      }
    });

    // Update DoT effects (manager handles ticking, damage, and cleanup)
    this.combatManager.updateDoTEffects(time, this.gameSpeed, this.enemyManager.getEnemies());

    // Update UI displays to reflect current game state
    this.updateUIDisplays();
  }

  gameOver() {
    // Pause game with popup flag
    this.questionPopupActive = true;

    // Bring this scene to top so overlay appears above UIScene
    this.scene.bringToTop();

    // Save game session (works in both Phaser Editor and WordWyrm)
    const score = this.calculateScore();
    gameDataService.saveGameSession({
      score: score,
      waveNumber: this.waveNumber,
      gold: this.gold,
      lives: this.lives,
      towersPlaced: this.totalTowersPlaced,
      correctAnswers: this.totalCorrectAnswers
    }).then(() => {
      console.log('[TowerDefenseScene] Game session saved. Score:', score);
    }).catch(error => {
      console.error('[TowerDefenseScene] Error saving game session:', error);
    });

    // Responsive dimensions - center in game area (excluding sidebar)
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(700, gameWidth * 0.85);
    const panelHeight = Math.min(450, height * 0.65);

    // Popup background overlay - covers FULL SCREEN including sidebar
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    overlay.setDepth(10000);

    // Popup panel with shadow - cream background matching question popups
    const shadow = this.add.rectangle(centerX + 4, centerY + 4, panelWidth, panelHeight, 0x000000, 0.3);
    shadow.setDepth(10001);
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xfffaf2);
    panel.setStrokeStyle(4, 0xc4a46f);
    panel.setDepth(10002);

    // Simple scale animation
    panel.setScale(0.9);
    shadow.setScale(0.9);
    this.tweens.add({
      targets: [panel, shadow],
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Header background - red for game over
    const headerY = centerY - panelHeight/2 + 60;
    const headerBg = this.add.rectangle(centerX, headerY, panelWidth, 90, 0xcc0000);
    headerBg.setDepth(10003);
    const headerLine = this.add.rectangle(centerX, headerY + 45, panelWidth - 40, 4, 0xc4a46f);
    headerLine.setDepth(10004);

    // Game Over title
    const titleText = this.add.text(centerX, headerY, 'GAME OVER!', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);
    titleText.setDepth(10005);

    // Stats section
    const statsY = centerY - 20;
    const statsText = this.add.text(centerX, statsY,
      `Waves Survived: ${this.waveNumber}\n\nFinal Score: ${score}\n\nGold Earned: ${this.gold}\n\nCorrect Answers: ${this.totalCorrectAnswers}`,
      {
        fontSize: '20px',
        color: '#5c4a2f',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        lineSpacing: 8,
        resolution: 2
      }
    ).setOrigin(0.5);
    statsText.setDepth(10005);

    // Retry button
    const buttonY = centerY + panelHeight/2 - 60;
    const buttonBg = this.add.rectangle(centerX, buttonY, 200, 50, 0x96b902);
    buttonBg.setStrokeStyle(3, 0xc4a46f);
    buttonBg.setInteractive({ useHandCursor: true });
    buttonBg.setDepth(10005);

    const buttonText = this.add.text(centerX, buttonY, 'PLAY AGAIN', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);
    buttonText.setDepth(10006);

    // Button hover effects
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0xaad402);
      buttonBg.setScale(1.05);
      buttonText.setScale(1.05);
    });

    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x96b902);
      buttonBg.setScale(1);
      buttonText.setScale(1);
    });

    buttonBg.on('pointerdown', () => {
      this.scene.restart();
    });
  }

  // Calculate final score based on performance
  calculateScore(): number {
    return (this.waveNumber * 100) +
           (this.gold * 2) +
           (this.totalCorrectAnswers * 50) +
           (this.totalTowersPlaced * 10);
  }

  selectTowerForUpgrade(tower: Tower) {
    // Block tower selection while ghost tower exists
    if (this.ghostTower !== null) {
      return;
    }

    // Remove border and hide range from previously selected tower
    if (this.selectedTower && this.selectedTower !== tower) {
      // Only set stroke style on Rectangle/Image, not Container
      if ('setStrokeStyle' in this.selectedTower.graphics) {
        this.selectedTower.graphics.setStrokeStyle(0);
      }
      if (this.selectedTower.rangeCircle) {
        this.selectedTower.rangeCircle.setVisible(false);
      }
    }

    this.selectedTower = tower;

    // Add thick bright border to newly selected tower (10px for visibility, bright yellow-green)
    // Only set stroke style on Rectangle/Image, not Container
    if ('setStrokeStyle' in this.selectedTower.graphics) {
      this.selectedTower.graphics.setStrokeStyle(10, 0xffff00);
    }

    // Show range circle for selected tower
    if (this.selectedTower.rangeCircle) {
      this.selectedTower.rangeCircle.setVisible(true);
    }

    this.showUpgradeUI();
  }

  showUpgradeUI() {
    // Destroy existing upgrade UI
    if (this.upgradeContainer) {
      this.upgradeContainer.destroy();
    }

    // Remove existing upgrade selection indicator
    if (this.upgradeSelectionIndicator) {
      this.upgradeSelectionIndicator.destroy();
      this.upgradeSelectionIndicator = undefined;
    }

    if (!this.selectedTower) return;

    // Position upgrades near the selected tower
    const towerX = this.selectedTower.x;
    const towerY = this.selectedTower.y;
    const upgradeY = towerY - 60; // Above the tower

    const elements: Phaser.GameObjects.GameObject[] = [];
    this.upgradeButtons = [];

    // Ballista (basic) upgrades: DOT and Fire Rate
    if (this.selectedTower.type === 'basic') {
      // DOT upgrade box - modern rounded style
      const dotPurchased = this.selectedTower.upgrades.dotArrows;
      const dotPrice = this.upgradePrices.dotArrows;
      const canAffordDot = this.gold >= dotPrice;
      const dotBox = this.add.rectangle(towerX - 30, upgradeY, 60, 50, dotPurchased ? 0x96b902 : (canAffordDot ? 0xff9f22 : 0xcccccc), 0.95);
      dotBox.setStrokeStyle(2, dotPurchased ? 0x7a9700 : (canAffordDot ? 0xff8800 : 0x999999));
      dotBox.setDepth(50);
      if (!dotPurchased) {
        dotBox.setInteractive({ useHandCursor: true });
        dotBox.on('pointerdown', () => {
          this.lastUpgradeButtonClicked = { x: dotBox.x, y: dotBox.y };

          // Show selection indicator (icon_select 100x100)
          if (this.upgradeSelectionIndicator) {
            this.upgradeSelectionIndicator.destroy();
          }
          this.upgradeSelectionIndicator = this.add.image(dotBox.x, dotBox.y, 'icon_select');
          this.upgradeSelectionIndicator.setDepth(100);
          this.upgradeSelectionIndicator.setScale(0.5); // Scale down from 100x100 for upgrade button (60x50)

          this.purchaseUpgrade('dotArrows');
        });
      }
      const dotText = this.add.text(towerX - 30, upgradeY - 12, 'DOT', TEXT_STYLES.UPGRADE_TITLE).setOrigin(0.5);
      dotText.setDepth(51); // Above rectangle but doesn't block clicks

      if (dotPurchased) {
        const checkmark = this.add.image(towerX - 30, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(dotBox, dotText, checkmark);
      } else {
        const dotCost = this.add.text(towerX - 30, upgradeY + 8, `${dotPrice}g`, TEXT_STYLES.UPGRADE_COST).setOrigin(0.5);
        dotCost.setDepth(51);
        elements.push(dotBox, dotText, dotCost);
        this.upgradeButtons.push(dotBox);
      }

      // Fire rate upgrade box
      const firePurchased = this.selectedTower.upgrades.fasterFireRate;
      const firePrice = this.upgradePrices.fasterFireRate;
      const canAffordFire = this.gold >= firePrice;
      const fireBox = this.add.rectangle(towerX + 30, upgradeY, 60, 50, firePurchased ? 0x96b902 : (canAffordFire ? 0xff9f22 : 0xcccccc), 0.95);
      fireBox.setStrokeStyle(2, firePurchased ? 0x7a9700 : (canAffordFire ? 0xff8800 : 0x999999));
      fireBox.setDepth(50);
      if (!firePurchased) {
        fireBox.setInteractive({ useHandCursor: true });
        fireBox.on('pointerdown', () => {
          this.lastUpgradeButtonClicked = { x: fireBox.x, y: fireBox.y };

          // Show selection indicator (icon_select 100x100)
          if (this.upgradeSelectionIndicator) {
            this.upgradeSelectionIndicator.destroy();
          }
          this.upgradeSelectionIndicator = this.add.image(fireBox.x, fireBox.y, 'icon_select');
          this.upgradeSelectionIndicator.setDepth(100);
          this.upgradeSelectionIndicator.setScale(0.5); // Scale down from 100x100 for upgrade button (60x50)

          this.purchaseUpgrade('fasterFireRate');
        });
      }
      const fireText = this.add.text(towerX + 30, upgradeY - 12, 'Fire+', TEXT_STYLES.UPGRADE_TITLE).setOrigin(0.5);
      fireText.setDepth(51);

      if (firePurchased) {
        const checkmark = this.add.image(towerX + 30, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(fireBox, fireText, checkmark);
      } else {
        const fireCost = this.add.text(towerX + 30, upgradeY + 8, `${firePrice}g`, TEXT_STYLES.UPGRADE_COST).setOrigin(0.5);
        fireCost.setDepth(51);
        elements.push(fireBox, fireText, fireCost);
        this.upgradeButtons.push(fireBox);
      }
    }

    // Trebuchet (sniper) upgrade: Explosive
    if (this.selectedTower.type === 'sniper') {
      const explosivePurchased = this.selectedTower.upgrades.explosive;
      const explosivePrice = this.upgradePrices.explosive;
      const canAffordExplosive = this.gold >= explosivePrice;
      const explosiveBox = this.add.rectangle(towerX, upgradeY, 80, 50, explosivePurchased ? 0x96b902 : (canAffordExplosive ? 0xff9f22 : 0xcccccc), 0.95);
      explosiveBox.setStrokeStyle(2, explosivePurchased ? 0x7a9700 : (canAffordExplosive ? 0xff8800 : 0x999999));
      explosiveBox.setDepth(50);
      if (!explosivePurchased) {
        explosiveBox.setInteractive({ useHandCursor: true });
        explosiveBox.on('pointerdown', () => {
          this.lastUpgradeButtonClicked = { x: explosiveBox.x, y: explosiveBox.y };

          // Show selection indicator (icon_select 100x100)
          if (this.upgradeSelectionIndicator) {
            this.upgradeSelectionIndicator.destroy();
          }
          this.upgradeSelectionIndicator = this.add.image(explosiveBox.x, explosiveBox.y, 'icon_select');
          this.upgradeSelectionIndicator.setDepth(100);
          this.upgradeSelectionIndicator.setScale(0.5); // Scale down from 100x100 for upgrade button (80x50)

          this.purchaseUpgrade('explosive');
        });
      }
      const explosiveText = this.add.text(towerX, upgradeY - 12, 'Explosive', TEXT_STYLES.UPGRADE_TITLE).setOrigin(0.5);
      explosiveText.setDepth(51);

      if (explosivePurchased) {
        const checkmark = this.add.image(towerX, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(explosiveBox, explosiveText, checkmark);
      } else {
        const explosiveCost = this.add.text(towerX, upgradeY + 8, `${explosivePrice}g`, TEXT_STYLES.UPGRADE_COST).setOrigin(0.5);
        explosiveCost.setDepth(51);
        elements.push(explosiveBox, explosiveText, explosiveCost);
        this.upgradeButtons.push(explosiveBox);
      }
    }

    // Melee upgrade: Damage
    if (this.selectedTower.type === 'melee') {
      const damagePurchased = this.selectedTower.upgrades.moreDamage;
      const damagePrice = this.upgradePrices.moreDamage;
      const canAffordDamage = this.gold >= damagePrice;
      const damageBox = this.add.rectangle(towerX, upgradeY, 80, 50, damagePurchased ? 0x96b902 : (canAffordDamage ? 0xff9f22 : 0xcccccc), 0.95);
      damageBox.setStrokeStyle(2, damagePurchased ? 0x7a9700 : (canAffordDamage ? 0xff8800 : 0x999999));
      damageBox.setDepth(50);
      if (!damagePurchased) {
        damageBox.setInteractive({ useHandCursor: true });
        damageBox.on('pointerdown', () => {
          this.lastUpgradeButtonClicked = { x: damageBox.x, y: damageBox.y };

          // Show selection indicator (icon_select 100x100)
          if (this.upgradeSelectionIndicator) {
            this.upgradeSelectionIndicator.destroy();
          }
          this.upgradeSelectionIndicator = this.add.image(damageBox.x, damageBox.y, 'icon_select');
          this.upgradeSelectionIndicator.setDepth(100);
          this.upgradeSelectionIndicator.setScale(0.5); // Scale down from 100x100 for upgrade button (80x50)

          this.purchaseUpgrade('moreDamage');
        });
      }
      const damageText = this.add.text(towerX, upgradeY - 12, 'Damage+', TEXT_STYLES.UPGRADE_TITLE).setOrigin(0.5);
      damageText.setDepth(51);

      if (damagePurchased) {
        const checkmark = this.add.image(towerX, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(damageBox, damageText, checkmark);
      } else {
        const damageCost = this.add.text(towerX, upgradeY + 8, `${damagePrice}g`, TEXT_STYLES.UPGRADE_COST).setOrigin(0.5);
        damageCost.setDepth(51);
        elements.push(damageBox, damageText, damageCost);
        this.upgradeButtons.push(damageBox);
      }
    }

    // Add delete button (red X) below the tower
    // Two-step confirmation: Red X -> Green Checkmark -> Delete
    const deleteButtonY = towerY + 60; // Below the tower
    const deleteButton = this.add.rectangle(towerX, deleteButtonY, 50, 50, 0xef4444, 0.95);
    deleteButton.setStrokeStyle(2, 0xdc2626);
    deleteButton.setDepth(5000); // Very high depth to ensure it's above UIScene
    deleteButton.setInteractive({ useHandCursor: true });
    console.log('[TowerDefenseScene] Delete button created at', towerX, deleteButtonY, 'with depth', deleteButton.depth);

    // Track confirmation state
    let deleteConfirmed = false;

    // Add hover effect
    deleteButton.on('pointerover', () => {
      console.log('[TowerDefenseScene] Delete button hover');
      deleteButton.setScale(1.05);
    });
    deleteButton.on('pointerout', () => {
      console.log('[TowerDefenseScene] Delete button unhover');
      deleteButton.setScale(1);
    });

    // Add X/checkmark text
    const deleteText = this.add.text(towerX, deleteButtonY, 'X', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    deleteText.setDepth(5001); // Above delete button

    deleteButton.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
      console.log('[TowerDefenseScene] Delete button clicked! Confirmed:', deleteConfirmed);

      // CRITICAL: Stop event propagation so tower doesn't get re-selected
      event.stopPropagation();

      if (!deleteConfirmed) {
        // First click: Change to green checkmark
        console.log('[TowerDefenseScene] First click - showing confirmation');
        deleteButton.setFillStyle(0x96b902, 0.95);
        deleteButton.setStrokeStyle(2, 0x7a9700);
        deleteText.setText('✓');
        deleteConfirmed = true;
      } else {
        // Second click: Actually delete the tower
        console.log('[TowerDefenseScene] Second click - deleting tower');
        if (this.selectedTower) {
          this.towerManager.removeTower(this.selectedTower);
          this.selectedTower = null;
          if (this.upgradeContainer) {
            this.upgradeContainer.destroy();
            this.upgradeContainer = undefined;
          }
        }
      }
    });

    elements.push(deleteButton, deleteText);

    this.upgradeContainer = this.add.container(0, 0, elements);
    this.upgradeContainer.setDepth(50); // Ensure upgrade UI is above most game elements
  }

  updateUpgradeColors() {
    if (!this.selectedTower || !this.upgradeButtons || this.upgradeButtons.length === 0) return;

    // Just refresh the entire UI to show updated prices and colors
    this.showUpgradeUI();
  }

  // Delete tower and refund 50% of spent gold
  deleteTower() {
    if (!this.selectedTower) return;

    const tower = this.selectedTower;

    // Calculate total gold spent on this tower
    let totalSpent = tower.cost; // Initial purchase price

    // Add upgrade costs
    if (tower.upgrades.explosive) totalSpent += this.upgradePrices.explosive;
    if (tower.upgrades.dotArrows) totalSpent += this.upgradePrices.dotArrows;
    if (tower.upgrades.fasterFireRate) totalSpent += this.upgradePrices.fasterFireRate;
    if (tower.upgrades.moreDamage) totalSpent += this.upgradePrices.moreDamage;

    // Refund 50% of total spent
    const refund = Math.floor(totalSpent * 0.5);
    this.gold += refund;

    // Show feedback message
    this.showErrorMessage(`Tower sold! +${refund}g`, 0x96b902); // Green color for positive feedback

    // Remove tower from manager (this also destroys graphics)
    this.towerManager.removeTower(tower);

    // Hide upgrade UI
    if (this.upgradeContainer) {
      this.upgradeContainer.destroy();
      this.upgradeContainer = undefined;
    }
    if (this.upgradeSelectionIndicator) {
      this.upgradeSelectionIndicator.destroy();
      this.upgradeSelectionIndicator = undefined;
    }

    // Deselect tower
    this.selectedTower = null;

    // Update UI displays
    this.updateUIDisplays();
  }

  // Purchase tower upgrade with knowledge check quiz gate
  // Ballista: DoT arrows, faster fire rate
  // Trebuchet: Explosive projectiles
  // Melee: More damage
  purchaseUpgrade(upgradeType: 'explosive' | 'dotArrows' | 'fasterFireRate' | 'moreDamage') {
    if (!this.selectedTower) return;

    // Use dynamic price
    const currentPrice = this.upgradePrices[upgradeType];

    if (this.gold < currentPrice) {
      this.showErrorMessage('Not enough gold for upgrade!');
      return;
    }

    if (this.selectedTower.upgrades[upgradeType]) {
      return; // Already purchased on this tower
    }

    // Check if upgrade type is unlocked globally
    if (this.upgradeUnlocked[upgradeType]) {
      // Already unlocked - purchase directly
      this.completeUpgradePurchase(upgradeType);
    } else {
      // Not unlocked yet - show quiz gate
      // Deduct gold first (will be refunded if wrong answer)
      this.gold -= currentPrice;
      this.updateUIDisplays(); // Update UI
      this.updateUIDisplays(); // Update Phaser UI

      this.pendingUpgrade = { type: upgradeType };
      this.showUpgradeQuestion(upgradeType);
    }
  }

  // Select boss question using spaced repetition
  // Prioritizes previously incorrect answers, falls back to random
  selectBossQuestion(): QuizQuestion {
    const incorrectQuestions: QuizQuestion[] = [];
    const allQuestions = this.quizData.questions;

    // Find all questions answered incorrectly
    for (let i = 0; i < allQuestions.length; i++) {
      if (!this.bossAnsweredCorrectly[i]) {
        incorrectQuestions.push(allQuestions[i]);
      }
    }

    // Prioritize incorrect answers for learning reinforcement
    if (incorrectQuestions.length > 0) {
      return incorrectQuestions[Math.floor(Math.random() * incorrectQuestions.length)];
    }

    // No incorrect answers yet, pick random question
    return allQuestions[Math.floor(Math.random() * allQuestions.length)];
  }

  // Display boss question popup at bottom center
  // 30 second timer, 2x2 button grid, auto-fails on timeout
  showBossQuestion(bossBaseHealth: number) {
    const question = this.selectBossQuestion();
    this.bossQuestion = question;
    this.bossQuestionTimer = 0;

    // Pause game while question popup is active
    this.questionPopupActive = true;

    // Bring this scene to top so overlay appears above UIScene
    this.scene.bringToTop();

    // Find index for answer tracking
    const questionIndex = this.quizData.questions.findIndex(q => q.question === question.question);

    // Responsive dimensions
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const panelWidth = Math.min(680, width * 0.7);
    const panelHeight = Math.min(238, height * 0.35);
    const panelY = height - panelHeight / 2 - 40; // Position near bottom

    // Semi-transparent overlay
    const overlay = this.add.rectangle(centerX, height / 2, width, height, 0x000000, 0.3);

    // Panel background
    const panel = this.add.rectangle(centerX, panelY, panelWidth, panelHeight, 0x2c3e50);
    panel.setStrokeStyle(4, 0xff6600); // Orange border for warning

    // Warning label
    const warningText = this.add.text(centerX, panelY - 93, 'ANSWER BUT BEWARE!', {
      fontSize: '20px',
      color: '#ff6600',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // Timer display
    const timerText = this.add.text(centerX, panelY - 68, 'Time: 30s', {
      fontSize: '15px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // Question text
    const questionText = this.add.text(centerX, panelY - 43, question.question, {
      fontSize: '15px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 40 },
      resolution: 2
    }).setOrigin(0.5);

    const answerButtons: Phaser.GameObjects.Container[] = [];

    // Create answer buttons (2x2 grid)
    const buttonWidth = (panelWidth - 30) / 2;
    const buttonHeight = 43;

    question.options.forEach((option, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const xPos = centerX - panelWidth / 2 + 15 + (col * (buttonWidth + 10));
      const yPos = panelY + 17 + (row * 51);
      const isCorrect = option === question.answer;

      const btnBg = this.add.rectangle(xPos + buttonWidth / 2, yPos, buttonWidth, buttonHeight, 0x34495e);
      btnBg.setInteractive({ useHandCursor: true });

      const btnText = this.add.text(xPos + buttonWidth / 2, yPos, option, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: buttonWidth - 20 },
        resolution: 2
      }).setOrigin(0.5);

      const button = this.add.container(0, 0, [btnBg, btnText]);
      answerButtons.push(button);

      btnBg.on('pointerover', () => btnBg.setFillStyle(0x475569));
      btnBg.on('pointerout', () => btnBg.setFillStyle(0x34495e));

      btnBg.on('pointerdown', () => {
        this.handleBossAnswer(isCorrect, bossBaseHealth, questionIndex);
      });
    });

    // Keep overlay separate from container so it covers full screen
    overlay.setDepth(10000);

    this.bossQuestionPopup = this.add.container(0, 0, [panel, warningText, timerText, questionText, ...answerButtons]);
    this.bossQuestionPopup.setDepth(10001); // Ensure questions always appear on top
  }

  // Handle boss question answer (correct or incorrect)
  // Correct: Boss -10% HP, towers +15% damage/fire rate until wave ends
  // Incorrect: Boss +150 HP, +15% speed permanently
  handleBossAnswer(isCorrect: boolean, bossBaseHealth: number, questionIndex: number) {
    // Track for spaced repetition
    if (questionIndex >= 0) {
      this.bossAnsweredCorrectly[questionIndex] = isCorrect;
    }

    // Close question popup and resume game
    if (this.bossQuestionPopup) {
      this.bossQuestionPopup.destroy();
      this.bossQuestionPopup = undefined;
      // Bring UIScene back to top
      this.scene.bringToTop('UIScene');
      this.questionPopupActive = false; // Resume game
    }

    if (isCorrect) {
      // Correct: Debuff boss, buff player
      if (this.bossEnemy) {
        const hpReduction = Math.floor(bossBaseHealth * 0.1);
        this.bossEnemy.health -= hpReduction;
        this.bossEnemy.maxHealth -= hpReduction;
      }
      this.towerGlobalBuffActive = true; // +15% damage/fire rate

      this.bossBuffMessage = this.add.text(640, 50, 'Correct: you\'ve been buffed!', {
        fontSize: '28px',
        color: '#27ae60',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
    } else {
      // Incorrect: Buff boss
      if (this.bossEnemy) {
        this.bossEnemy.health += 150;
        this.bossEnemy.maxHealth += 150;
        this.bossEnemy.speed *= 1.15;
      }

      this.bossBuffMessage = this.add.text(640, 50, 'Incorrect: you\'ve been debuffed!', {
        ...TEXT_STYLES.ERROR_MESSAGE,
        fontSize: '28px'
      }).setOrigin(0.5);
    }
  }

  /**
   * Create a compact, contextual quiz popup above a button
   * @param buttonPos Position of the button that triggered the quiz
   * @param question Quiz question object
   * @param headerText Text to show in header (e.g., "Purchasing: Ballista (50g)")
   * @param onAnswer Callback function when answer is selected (isCorrect) => void
   * @returns Container with quiz UI elements
   */
  createCompactQuiz(
    buttonPos: { x: number; y: number },
    question: QuizQuestion,
    headerText: string,
    onAnswer: (isCorrect: boolean) => void
  ): Phaser.GameObjects.Container {
    // Compact dimensions
    const panelWidth = 350;
    const panelHeight = 200;
    const padding = 10;

    // Position above button with small gap
    const quizX = buttonPos.x;
    const quizY = buttonPos.y - panelHeight / 2 - 20; // 20px gap above button

    // Keep within screen bounds
    const finalX = Math.max(panelWidth / 2, Math.min(this.scale.width - panelWidth / 2, quizX));
    const finalY = Math.max(panelHeight / 2, Math.min(this.scale.height - panelHeight / 2, quizY));

    const elements: Phaser.GameObjects.GameObject[] = [];

    // Panel background (white)
    const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0xffffff);
    panel.setStrokeStyle(3, 0xc4a46f);
    elements.push(panel);

    // Header text (small, top of panel)
    const header = this.add.text(0, -panelHeight / 2 + 15, headerText, {
      fontSize: '11px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - padding * 2 },
      resolution: 2
    }).setOrigin(0.5);
    elements.push(header);

    // Question text (compact)
    const questionText = this.add.text(0, -panelHeight / 2 + 45, question.question, {
      fontSize: '10px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      align: 'center',
      wordWrap: { width: panelWidth - padding * 2 },
      resolution: 2
    }).setOrigin(0.5);
    elements.push(questionText);

    // Answer buttons (compact, 2x2 grid)
    const buttonWidth = (panelWidth - padding * 3) / 2;
    const buttonHeight = 35;
    const startY = -panelHeight / 2 + 90;

    question.options.forEach((option, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const xPos = -panelWidth / 2 + padding + buttonWidth / 2 + col * (buttonWidth + padding);
      const yPos = startY + row * (buttonHeight + 8);
      const isCorrect = option === question.answer;

      // Button background
      const btnBg = this.add.rectangle(xPos, yPos, buttonWidth, buttonHeight, 0xfff6e8);
      btnBg.setStrokeStyle(2, 0xc4a46f);
      btnBg.setInteractive({ useHandCursor: true });

      // Button text
      const btnText = this.add.text(xPos, yPos, option, {
        fontSize: '9px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: buttonWidth - 10 },
        resolution: 2
      }).setOrigin(0.5);

      // Hover effects
      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x96b902);
        btnBg.setStrokeStyle(3, 0x7a9700);
        btnText.setColor('#ffffff');
      });

      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0xfff6e8);
        btnBg.setStrokeStyle(2, 0xc4a46f);
        btnText.setColor('#473025');
      });

      // Click handler
      btnBg.on('pointerdown', () => {
        onAnswer(isCorrect);
      });

      elements.push(btnBg, btnText);
    });

    // Create container and position it
    const container = this.add.container(finalX, finalY, elements);

    // Scale-up animation
    container.setScale(0.8);
    this.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Back.easeOut'
    });

    // Click outside to dismiss - create invisible background
    const dismissBg = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.01);
    dismissBg.setInteractive();
    dismissBg.on('pointerdown', () => {
      onAnswer(false); // Treat as wrong answer (cancel)
    });

    // Add dismiss background at the beginning so it's behind the quiz
    container.addAt(dismissBg, 0);

    // Ensure quiz always appears on top
    container.setDepth(1000);

    return container;
  }

  // Show tower purchase quiz gate popup (COMPACT VERSION)
  // Requires answering a question correctly to purchase tower (from 3rd tower onward)
  // Wrong answer increases tower price by 25% and cancels purchase
  showTowerPurchaseQuestion(towerType: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard') {
    // Pause game while question popup is active
    this.questionPopupActive = true;

    // Bring this scene to top so overlay appears above UIScene
    this.scene.bringToTop();

    // Pick a random question from quiz pool
    const question = this.quizData.questions[Math.floor(Math.random() * this.quizData.questions.length)];

    // Get current tower price and name
    const currentPrice = this.towerPurchasePrice[towerType];
    const towerNames = { basic: 'Ballista', sniper: 'Trebuchet', melee: 'Knight', fact: 'Training Camp', wizard: 'Archmage' };
    const headerText = `Purchase ${towerNames[towerType]} (${currentPrice}g)`;

    // Responsive dimensions - center in game area (excluding sidebar)
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(700, gameWidth * 0.85);
    const panelHeight = Math.min(540, height * 0.75);

    // Popup background overlay - simple fade in
    const overlay = this.add.rectangle(centerX, centerY, gameWidth, height, 0x000000, 0);
    this.tweens.add({
      targets: overlay,
      alpha: 0.85,
      duration: 200,
      ease: 'Power1'
    });

    // Popup panel with shadow - cream background matching site
    const shadow = this.add.rectangle(centerX + 4, centerY + 4, panelWidth, panelHeight, 0x000000, 0.3);
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xfffaf2);
    panel.setStrokeStyle(4, 0xc4a46f);

    // Simple scale animation
    panel.setScale(0.9);
    shadow.setScale(0.9);
    this.tweens.add({
      targets: [panel, shadow],
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Header background - lime green matching site
    const headerY = centerY - panelHeight/2 + 60;
    const headerBg = this.add.rectangle(centerX, headerY, panelWidth, 90, 0x96b902);
    const headerLine = this.add.rectangle(centerX, headerY + 45, panelWidth - 40, 4, 0xc4a46f);

    // Tower purchase header
    const headerTextObj = this.add.text(centerX, headerY - 10, headerText, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // Question text
    const questionText = this.add.text(centerX, headerY + 20, question.question, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      resolution: 2
    }).setOrigin(0.5);

    // Create answer buttons
    const buttonWidth = panelWidth - 50;
    const buttonHeight = 60;
    const startY = centerY - panelHeight/2 + 170;
    const answerButtons: Phaser.GameObjects.Container[] = [];

    question.options.forEach((option, index) => {
      const yPos = startY + (index * 68);
      const isCorrect = option === question.answer;

      // Drop shadow for depth
      const btnShadow = this.add.rectangle(centerX + 4, yPos + 4, buttonWidth, buttonHeight, 0x000000, 0.15);
      // Main button background - cream with gold border
      const btnBg = this.add.rectangle(centerX, yPos, buttonWidth, buttonHeight, 0xfff6e8);
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.setStrokeStyle(3, 0xc4a46f);

      const btnText = this.add.text(centerX, yPos, option, {
        fontSize: '17px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 40 },
        resolution: 2
      }).setOrigin(0.5);

      const button = this.add.container(0, 0, [btnShadow, btnBg, btnText]);
      answerButtons.push(button);

      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x96b902);
        btnBg.setStrokeStyle(4, 0x7a9700);
        btnText.setColor('#ffffff');
        btnBg.setScale(1.02);
        btnText.setScale(1.02);
      });

      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0xfff6e8);
        btnBg.setStrokeStyle(3, 0xc4a46f);
        btnText.setColor('#473025');
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      btnBg.on('pointerdown', () => {
        // Disable all buttons
        answerButtons.forEach(btn => {
          const bg = btn.list[1] as Phaser.GameObjects.Rectangle;
          bg.removeInteractive();
        });

        if (isCorrect) {
          // Correct answer: Convert ghost to real tower
          console.log('[TowerDefenseScene] Correct answer! Converting ghost tower...');

          // Track correct answer
          this.totalCorrectAnswers++;

          // Update wizard button state (may unlock at 5 correct answers)
          this.updateWizardButtonState();

          // Show feedback
          const feedback = this.add.text(centerX, centerY + panelHeight/2 - 70, 'Correct!', {
            fontSize: '28px',
            color: '#96b902',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            resolution: 2
          }).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: feedback,
            alpha: 1,
            duration: 150,
            ease: 'Power2'
          });

          // Close popup after delay
          this.time.delayedCall(1500, () => {
            overlay.destroy();
            shadow.destroy();
            panel.destroy();
            headerBg.destroy();
            headerLine.destroy();
            headerTextObj.destroy();
            questionText.destroy();
            feedback.destroy();
            answerButtons.forEach(btn => btn.destroy());

            // Bring UIScene back to top
            this.scene.bringToTop('UIScene');

            // Resume game
            this.questionPopupActive = false;

            // Convert ghost tower to real tower
            if (this.ghostTower && this.pendingTowerPlacement) {
              this.convertGhostToRealTower();
              this.pendingTowerPlacement = null;
            }
          });
        } else {
          // Incorrect answer: Cancel purchase
          console.log('[TowerDefenseScene] Incorrect answer. Destroying ghost tower...');

          // Increase price by quiz penalty multiplier
          this.towerPurchasePrice[towerType] = Math.round(this.towerPurchasePrice[towerType] * BALANCE_CONSTANTS.QUIZ_PRICE_INCREASE_MULTIPLIER);

          // Show feedback
          const feedback = this.add.text(centerX, centerY + panelHeight/2 - 70, `Incorrect! Price increased to ${this.towerPurchasePrice[towerType]}g`, {
            fontSize: '24px',
            color: '#ef4444',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: panelWidth - 60 },
            resolution: 2
          }).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: feedback,
            alpha: 1,
            duration: 150,
            ease: 'Power2'
          });

          // Close popup after delay
          this.time.delayedCall(1500, () => {
            overlay.destroy();
            shadow.destroy();
            panel.destroy();
            headerBg.destroy();
            headerLine.destroy();
            headerTextObj.destroy();
            questionText.destroy();
            feedback.destroy();
            answerButtons.forEach(btn => btn.destroy());

            // Bring UIScene back to top
            this.scene.bringToTop('UIScene');

            // Resume game
            this.questionPopupActive = false;

            // Destroy ghost tower (no gold spent)
            if (this.ghostTower) {
              this.ghostTower.graphics.destroy();
              this.ghostTower = null;
            }
            this.pendingTowerPlacement = null;

            // Update UI to show new price
            this.updateUIDisplays();
          });
        }
      });
    });

    // Keep overlay separate from container so it covers full screen
    overlay.setDepth(10000);

    // Store reference to popup container for cleanup
    this.towerPurchaseQuestionPopup = this.add.container(0, 0, [shadow, panel, headerBg, headerLine, headerTextObj, questionText, ...answerButtons]);
    this.towerPurchaseQuestionPopup.setDepth(10001);

    /* OLD IMPLEMENTATION - Using createCompactQuiz (next to tower button)
    // Get button position (fallback to center if not set)
    const buttonPos = this.lastTowerButtonClicked || { x: this.scale.width / 2, y: this.scale.height - 100 };

    // Create compact quiz with answer callback
    this.towerPurchaseQuestionPopup = this.createCompactQuiz(
      buttonPos,
      question,
      headerText,
      (isCorrect) => {
        if (isCorrect) {
          // Correct answer: Convert ghost to real tower
          console.log('[TowerDefenseScene] Correct answer! Converting ghost tower...');

          // Track correct answer
          this.totalCorrectAnswers++;

          // Update wizard button state (may unlock at 5 correct answers)
          this.updateWizardButtonState();

          // Destroy quiz and resume game
          this.towerPurchaseQuestionPopup?.destroy();
          this.towerPurchaseQuestionPopup = undefined;
          this.questionPopupActive = false; // Resume game

          // Convert ghost tower to real tower
          if (this.ghostTower && this.pendingTowerPlacement) {
            this.convertGhostToRealTower();
            this.pendingTowerPlacement = null;
          }
        } else {
          // Incorrect answer: Cancel purchase, destroy ghost, increase price
          console.log('[TowerDefenseScene] Incorrect answer or cancelled. Destroying ghost tower...');

          // Increase price by quiz penalty multiplier
          this.towerPurchasePrice[towerType] = Math.round(this.towerPurchasePrice[towerType] * BALANCE_CONSTANTS.QUIZ_PRICE_INCREASE_MULTIPLIER);

          // Destroy quiz and resume game
          this.towerPurchaseQuestionPopup?.destroy();
          this.towerPurchaseQuestionPopup = undefined;
          this.questionPopupActive = false; // Resume game

          // Destroy ghost tower (no gold spent)
          if (this.ghostTower) {
            this.ghostTower.graphics.destroy();
            this.ghostTower = null;
          }
          this.pendingTowerPlacement = null;

          // Show feedback message
          this.showErrorMessage(`Purchase cancelled. Price is now ${this.towerPurchasePrice[towerType]}g`);
        }
      }
    );
    */
  }

  /* OLD DOM UI - Now handled by updateUIDisplays() which updates Phaser Editor UIScene
  // Update tower button prices in UI
  updateTowerButtonPrices() {
    // Update Ballista price
    const basicTitle = this.basicTowerBtn.node.querySelector('div:first-child') as HTMLElement;
    if (basicTitle) {
      basicTitle.nextElementSibling!.textContent = `Fast Fire • ${this.towerPurchasePrice.basic}g`;
    }

    // Update Trebuchet price
    const sniperTitle = this.sniperTowerBtn.node.querySelector('div:first-child') as HTMLElement;
    if (sniperTitle) {
      sniperTitle.nextElementSibling!.textContent = `Slow Fire • ${this.towerPurchasePrice.sniper}g`;
    }

    // Update Knight price
    const meleeTitle = this.meleeTowerBtn.node.querySelector('div:first-child') as HTMLElement;
    if (meleeTitle) {
      meleeTitle.nextElementSibling!.textContent = `Rapid Fire • ${this.towerPurchasePrice.melee}g`;
    }
  }
  */

  // Show upgrade unlock quiz popup (CENTERED VERSION)
  // Requires answering a question correctly to unlock upgrade type
  // Wrong answer refunds gold, increases price by 25%, and cancels purchase
  showUpgradeQuestion(upgradeType: 'explosive' | 'dotArrows' | 'fasterFireRate' | 'moreDamage') {
    // Pause game while question popup is active
    this.questionPopupActive = true;

    // Bring this scene to top so overlay appears above UIScene
    this.scene.bringToTop();

    // Pick a random question from quiz pool
    const question = this.quizData.questions[Math.floor(Math.random() * this.quizData.questions.length)];

    // Get current upgrade price and name
    const currentPrice = this.upgradePrices[upgradeType];
    const upgradeNames = {
      dotArrows: 'DOT Arrows',
      fasterFireRate: 'Faster Fire Rate',
      explosive: 'Explosive',
      moreDamage: 'More Damage'
    };
    const headerText = `Unlock ${upgradeNames[upgradeType]} (${currentPrice}g)`;

    // Responsive dimensions - center in game area (excluding sidebar)
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(700, gameWidth * 0.85);
    const panelHeight = Math.min(540, height * 0.75);

    // Popup background overlay - covers FULL SCREEN including sidebar
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.tweens.add({
      targets: overlay,
      alpha: 0.85,
      duration: 200,
      ease: 'Power1'
    });

    // Popup panel with shadow
    const shadow = this.add.rectangle(centerX + 4, centerY + 4, panelWidth, panelHeight, 0x000000, 0.3);
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xfffaf2);
    panel.setStrokeStyle(4, 0xc4a46f);

    panel.setScale(0.9);
    shadow.setScale(0.9);
    this.tweens.add({
      targets: [panel, shadow],
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Header background
    const headerY = centerY - panelHeight/2 + 60;
    const headerBg = this.add.rectangle(centerX, headerY, panelWidth, 90, 0x96b902);
    const headerLine = this.add.rectangle(centerX, headerY + 45, panelWidth - 40, 4, 0xc4a46f);

    const headerTextObj = this.add.text(centerX, headerY - 10, headerText, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    const questionText = this.add.text(centerX, headerY + 20, question.question, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      resolution: 2
    }).setOrigin(0.5);

    const buttonWidth = panelWidth - 50;
    const buttonHeight = 60;
    const startY = centerY - panelHeight/2 + 170;
    const answerButtons: Phaser.GameObjects.Container[] = [];

    question.options.forEach((option, index) => {
      const yPos = startY + (index * 68);
      const isCorrect = option === question.answer;

      const btnShadow = this.add.rectangle(centerX + 4, yPos + 4, buttonWidth, buttonHeight, 0x000000, 0.15);
      const btnBg = this.add.rectangle(centerX, yPos, buttonWidth, buttonHeight, 0xfff6e8);
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.setStrokeStyle(3, 0xc4a46f);

      const btnText = this.add.text(centerX, yPos, option, {
        fontSize: '17px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 40 },
        resolution: 2
      }).setOrigin(0.5);

      const button = this.add.container(0, 0, [btnShadow, btnBg, btnText]);
      answerButtons.push(button);

      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x96b902);
        btnBg.setStrokeStyle(4, 0x7a9700);
        btnText.setColor('#ffffff');
        btnBg.setScale(1.02);
        btnText.setScale(1.02);
      });

      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0xfff6e8);
        btnBg.setStrokeStyle(3, 0xc4a46f);
        btnText.setColor('#473025');
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      btnBg.on('pointerdown', () => {
        answerButtons.forEach(btn => {
          const bg = btn.list[1] as Phaser.GameObjects.Rectangle;
          bg.removeInteractive();
        });

        if (isCorrect) {
          console.log('[TowerDefenseScene] Correct answer! Unlocking upgrade...');
          this.totalCorrectAnswers++;
          this.updateWizardButtonState();
          this.upgradeUnlocked[upgradeType] = true;

          const feedback = this.add.text(centerX, centerY + panelHeight/2 - 70, 'Correct! Upgrade Unlocked!', {
            fontSize: '28px',
            color: '#96b902',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            resolution: 2
          }).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: feedback,
            alpha: 1,
            duration: 150,
            ease: 'Power2'
          });

          this.time.delayedCall(1500, () => {
            overlay.destroy();
            shadow.destroy();
            panel.destroy();
            headerBg.destroy();
            headerLine.destroy();
            headerTextObj.destroy();
            questionText.destroy();
            feedback.destroy();
            answerButtons.forEach(btn => btn.destroy());

            // Bring UIScene back to top
            this.scene.bringToTop('UIScene');

            this.questionPopupActive = false;

            if (this.pendingUpgrade) {
              this.completeUpgradePurchase(this.pendingUpgrade.type);
              this.pendingUpgrade = null;
            }
          });
        } else {
          console.log('[TowerDefenseScene] Incorrect answer. Refunding gold...');

          const refundAmount = this.upgradePrices[upgradeType];
          this.gold += refundAmount;
          this.updateUIDisplays();
          this.upgradePrices[upgradeType] = Math.round(this.upgradePrices[upgradeType] * BALANCE_CONSTANTS.QUIZ_PRICE_INCREASE_MULTIPLIER);

          const feedback = this.add.text(centerX, centerY + panelHeight/2 - 70, `Incorrect! Price increased to ${this.upgradePrices[upgradeType]}g`, {
            fontSize: '24px',
            color: '#ef4444',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: panelWidth - 60 },
            resolution: 2
          }).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: feedback,
            alpha: 1,
            duration: 150,
            ease: 'Power2'
          });

          this.time.delayedCall(1500, () => {
            overlay.destroy();
            shadow.destroy();
            panel.destroy();
            headerBg.destroy();
            headerLine.destroy();
            headerTextObj.destroy();
            questionText.destroy();
            feedback.destroy();
            answerButtons.forEach(btn => btn.destroy());

            // Bring UIScene back to top
            this.scene.bringToTop('UIScene');

            this.questionPopupActive = false;
            this.pendingUpgrade = null;

            if (this.selectedTower) {
              this.showUpgradeUI();
            }
          });
        }
      });
    });

    // Keep overlay separate from container so it covers full screen
    overlay.setDepth(10000);

    this.upgradeQuestionPopup = this.add.container(0, 0, [shadow, panel, headerBg, headerLine, headerTextObj, questionText, ...answerButtons]);
    this.upgradeQuestionPopup.setDepth(10001);
  }

  // Complete upgrade purchase after quiz success
  // Deducts gold, marks upgrade as purchased on tower, applies stat changes, resets price
  completeUpgradePurchase(upgradeType: 'explosive' | 'dotArrows' | 'fasterFireRate' | 'moreDamage') {
    if (!this.selectedTower) return;

    const currentPrice = this.upgradePrices[upgradeType];

    // Deduct gold
    this.gold -= currentPrice;
    this.updateUIDisplays(); // Update UI
    this.updateUIDisplays(); // Update Phaser UI

    // Mark as purchased on this tower
    this.selectedTower.upgrades[upgradeType] = true;

    // Apply stat changes
    switch (upgradeType) {
      case 'fasterFireRate':
        this.selectedTower.fireRate = this.selectedTower.baseFireRate * 0.85; // -15%
        break;
      case 'moreDamage':
        this.selectedTower.damage = this.selectedTower.baseDamage * 1.1; // +10%
        break;
      // explosive and dotArrows apply on projectile impact
    }

    // Reset price to base
    this.upgradePrices[upgradeType] = BALANCE_CONSTANTS.UPGRADE_BASE_PRICE;

    // Refresh upgrade UI
    this.showUpgradeUI();
  }

  // Show ability quiz popup (COMPACT VERSION)
  // lightning: 40g, 45s cooldown, enemy selection after quiz
  // freeze: 60g, 60s cooldown, freezes all enemies
  // question: free, 90s cooldown, boost selected Training Camp
  showAbilityQuestion(abilityType: 'lightning' | 'freeze' | 'question') {
    // Pause game while question popup is active
    this.questionPopupActive = true;

    // Bring this scene to top so overlay appears above UIScene
    this.scene.bringToTop();

    // Pick a random question from quiz pool
    const question = this.quizData.questions[Math.floor(Math.random() * this.quizData.questions.length)];

    // Get ability info for header
    const abilityInfo = {
      lightning: { name: 'Lightning Strike', cost: 40 },
      freeze: { name: 'Freeze', cost: 60 },
      question: { name: 'Question Ability', cost: 0 }
    };

    const info = abilityInfo[abilityType];
    const costText = info.cost > 0 ? ` (${info.cost}g)` : ' (Free)';
    const headerText = `Use ${info.name}${costText}`;

    // Responsive dimensions - center in game area (excluding sidebar)
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(700, gameWidth * 0.85);
    const panelHeight = Math.min(540, height * 0.75);

    // Popup background overlay - covers FULL SCREEN including sidebar
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.tweens.add({
      targets: overlay,
      alpha: 0.85,
      duration: 200,
      ease: 'Power1'
    });

    // Popup panel with shadow
    const shadow = this.add.rectangle(centerX + 4, centerY + 4, panelWidth, panelHeight, 0x000000, 0.3);
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xfffaf2);
    panel.setStrokeStyle(4, 0xc4a46f);

    panel.setScale(0.9);
    shadow.setScale(0.9);
    this.tweens.add({
      targets: [panel, shadow],
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Header background
    const headerY = centerY - panelHeight/2 + 60;
    const headerBg = this.add.rectangle(centerX, headerY, panelWidth, 90, 0x96b902);
    const headerLine = this.add.rectangle(centerX, headerY + 45, panelWidth - 40, 4, 0xc4a46f);

    const headerTextObj = this.add.text(centerX, headerY - 10, headerText, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    const questionText = this.add.text(centerX, headerY + 20, question.question, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      resolution: 2
    }).setOrigin(0.5);

    const buttonWidth = panelWidth - 50;
    const buttonHeight = 60;
    const startY = centerY - panelHeight/2 + 170;
    const answerButtons: Phaser.GameObjects.Container[] = [];

    question.options.forEach((option, index) => {
      const yPos = startY + (index * 68);
      const isCorrect = option === question.answer;

      const btnShadow = this.add.rectangle(centerX + 4, yPos + 4, buttonWidth, buttonHeight, 0x000000, 0.15);
      const btnBg = this.add.rectangle(centerX, yPos, buttonWidth, buttonHeight, 0xfff6e8);
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.setStrokeStyle(3, 0xc4a46f);

      const btnText = this.add.text(centerX, yPos, option, {
        fontSize: '17px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 40 },
        resolution: 2
      }).setOrigin(0.5);

      const button = this.add.container(0, 0, [btnShadow, btnBg, btnText]);
      answerButtons.push(button);

      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x96b902);
        btnBg.setStrokeStyle(4, 0x7a9700);
        btnText.setColor('#ffffff');
        btnBg.setScale(1.02);
        btnText.setScale(1.02);
      });

      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0xfff6e8);
        btnBg.setStrokeStyle(3, 0xc4a46f);
        btnText.setColor('#473025');
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      btnBg.on('pointerdown', () => {
        answerButtons.forEach(btn => {
          const bg = btn.list[1] as Phaser.GameObjects.Rectangle;
          bg.removeInteractive();
        });

        if (isCorrect) {
          console.log('[TowerDefenseScene] Correct answer! Activating ability...');
          this.totalCorrectAnswers++;
          this.updateWizardButtonState();

          const feedback = this.add.text(centerX, centerY + panelHeight/2 - 70, 'Correct!', {
            fontSize: '28px',
            color: '#96b902',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            resolution: 2
          }).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: feedback,
            alpha: 1,
            duration: 150,
            ease: 'Power2'
          });

          this.time.delayedCall(1500, () => {
            overlay.destroy();
            shadow.destroy();
            panel.destroy();
            headerBg.destroy();
            headerLine.destroy();
            headerTextObj.destroy();
            questionText.destroy();
            feedback.destroy();
            answerButtons.forEach(btn => btn.destroy());

            // Bring UIScene back to top
            this.scene.bringToTop('UIScene');

            this.questionPopupActive = false;
            this.activateAbility(abilityType);
          });
        } else {
          console.log('[TowerDefenseScene] Incorrect answer. Ability cancelled.');

          const questionIndex = this.quizData.questions.findIndex(q => q.question === question.question);
          if (questionIndex >= 0) {
            this.incorrectQuestionIndices.add(questionIndex);
          }

          const feedback = this.add.text(centerX, centerY + panelHeight/2 - 70, 'Incorrect! Ability Cancelled', {
            fontSize: '24px',
            color: '#ef4444',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            resolution: 2
          }).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: feedback,
            alpha: 1,
            duration: 150,
            ease: 'Power2'
          });

          this.time.delayedCall(1500, () => {
            overlay.destroy();
            shadow.destroy();
            panel.destroy();
            headerBg.destroy();
            headerLine.destroy();
            headerTextObj.destroy();
            questionText.destroy();
            feedback.destroy();
            answerButtons.forEach(btn => btn.destroy());

            // Bring UIScene back to top
            this.scene.bringToTop('UIScene');

            this.questionPopupActive = false;
          });
        }
      });
    });

    // Keep overlay separate from container so it covers full screen
    overlay.setDepth(10000);

    this.abilityQuestionPopup = this.add.container(0, 0, [shadow, panel, headerBg, headerLine, headerTextObj, questionText, ...answerButtons]);
    this.abilityQuestionPopup.setDepth(10001);
  }

  // Activate ability after successful quiz
  activateAbility(abilityType: 'lightning' | 'freeze' | 'question') {
    if (abilityType === 'lightning') {
      // Deduct cost and set cooldown
      this.gold -= 40;
      this.updateUIDisplays(); // Update UI
      this.abilityManager.useLightningStrike();
      this.updateAbilityButtons();
      this.updateUIDisplays(); // Update Phaser UI

      // Enter enemy selection mode
      this.lightningStrikeActive = true;
      this.showErrorMessage('Select an enemy to strike!');
    } else if (abilityType === 'freeze') {
      // Deduct cost and set cooldown
      this.gold -= 60;
      this.updateUIDisplays(); // Update UI
      this.updateAbilityButtons();
      this.updateUIDisplays(); // Update Phaser UI

      // Freeze all enemies
      this.freezeAllEnemies();
    } else if (abilityType === 'question') {
      // Set cooldown (no cost)
      this.abilityManager.useQuestionAbility();
      this.updateAbilityButtons();

      // Check if there are any Training Camps to boost
      const factTowers = this.towerManager.getTowers().filter(t => t.type === 'fact');
      if (factTowers.length === 0) {
        this.showErrorMessage('No Training Camps to boost!');
        // Refund cooldown since ability can't be used
        this.abilityManager.resetQuestionAbilityCooldown();
        this.updateAbilityButtons();
      } else {
        // Highlight all Training Camps for selection
        this.highlightFactTowers(true);
        this.showErrorMessage('Select a Training Camp to boost!');
      }
    }
  }

  // Freeze all enemies for 5 seconds (bosses slowed 50% instead)
  freezeAllEnemies() {
    // Apply freeze effect through manager
    this.frozenEnemies = this.abilityManager.applyFreeze(this.enemyManager.getEnemies());

    // Unfreeze after 5 seconds
    this.time.delayedCall(5000, () => {
      this.abilityManager.restoreEnemySpeeds(this.frozenEnemies, this.enemyManager.getEnemies());
      this.frozenEnemies.clear();
    });
  }

  // Execute Lightning Strike on selected enemy
  // Deals 100 damage to target, 25 damage in AoE (30px radius)
  executeLightningStrike(target: Enemy) {
    if (!this.lightningStrikeActive || !this.enemyManager.getEnemies().includes(target)) return;

    // Deactivate selection mode
    this.lightningStrikeActive = false;
    if (this.errorMessage) {
      this.errorMessage.destroy();
      this.errorMessage = undefined;
    }

    // Deal 100 damage to target (with armor reduction)
    this.combatManager.applyDamage(target, 100);

    // Visual lightning effect on target
    const lightning = this.add.graphics();
    lightning.lineStyle(4, 0xffff00, 1);
    lightning.beginPath();
    lightning.moveTo(target.x, 0);
    lightning.lineTo(target.x, target.y);
    lightning.strokePath();
    lightning.fillStyle(0xffff00, 0.6);
    lightning.fillCircle(target.x, target.y, 15);

    // Damage number
    const damageText = this.add.text(target.x, target.y - 30, `-100`, {
      fontSize: '20px',
      color: '#ffff00',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: damageText,
      y: target.y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => damageText.destroy()
    });

    // AoE damage (30px radius, 25 damage)
    const aoeRadius = 30;
    this.enemyManager.getEnemies().forEach(enemy => {
      if (enemy === target) return; // Skip target (already damaged)

      const dx = enemy.x - target.x;
      const dy = enemy.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < aoeRadius) {
        this.combatManager.applyDamage(enemy, 25);

        // AoE damage number
        const aoeDamageText = this.add.text(enemy.x, enemy.y - 20, `-25`, {
          fontSize: '14px',
          color: '#ffaa00',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
          targets: aoeDamageText,
          y: enemy.y - 40,
          alpha: 0,
          duration: 600,
          onComplete: () => aoeDamageText.destroy()
        });
      }
    });

    // AoE visual effect
    const aoeCircle = this.add.graphics();
    aoeCircle.lineStyle(3, 0xffaa00, 0.8);
    aoeCircle.strokeCircle(target.x, target.y, aoeRadius);
    aoeCircle.fillStyle(0xffaa00, 0.2);
    aoeCircle.fillCircle(target.x, target.y, aoeRadius);

    // Fade out visual effects
    this.tweens.add({
      targets: [lightning, aoeCircle],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        lightning.destroy();
        aoeCircle.destroy();
      }
    });
  }

  // Highlight or un-highlight Training Camps for Question ability selection
  highlightFactTowers(highlight: boolean) {
    this.towerManager.getTowers().forEach(tower => {
      if (tower.type === 'fact') {
        if (highlight) {
          // Add pulsing green highlight
          if ('setStrokeStyle' in tower.graphics) {
            tower.graphics.setStrokeStyle(6, 0x00ff00);
          }
          this.tweens.add({
            targets: tower.graphics,
            alpha: { from: 1, to: 0.6 },
            duration: 500,
            yoyo: true,
            repeat: -1
          });
        } else {
          // Remove highlight
          if ('setStrokeStyle' in tower.graphics) {
            tower.graphics.setStrokeStyle(0);
          }
          this.tweens.killTweensOf(tower.graphics);
          tower.graphics.setAlpha(1);
        }
      }
    });
  }

  // Show tooltip with educational fact for Training Camp
  showFactTowerTooltip(tower: Tower) {
    if (!tower.factText) return;

    // Hide existing tooltip if any
    this.hideFactTowerTooltip();

    // Calculate responsive dimensions
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;

    // Tooltip dimensions
    const tooltipMaxWidth = Math.min(300, gameWidth * 0.4);
    const tooltipPadding = 15;

    // Create tooltip container
    this.factTowerTooltip = this.add.container(0, 0);

    // Background panel
    const bg = this.add.rectangle(0, 0, tooltipMaxWidth, 100, 0x2c3e50, 0.95);
    bg.setStrokeStyle(3, 0x96b902); // Green border (Training Camp color)
    this.factTowerTooltip.add(bg);

    // Title text
    const titleText = this.add.text(0, -40, 'Educational Fact', {
      fontSize: Math.min(16, width * 0.02) + 'px',
      fontFamily: 'Arial',
      color: '#96b902',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: tooltipMaxWidth - tooltipPadding * 2 }
    });
    titleText.setOrigin(0.5);
    this.factTowerTooltip.add(titleText);

    // Fact text
    const factTextObj = this.add.text(0, -10, tower.factText, {
      fontSize: Math.min(14, width * 0.018) + 'px',
      fontFamily: 'Arial',
      color: '#ecf0f1',
      align: 'center',
      wordWrap: { width: tooltipMaxWidth - tooltipPadding * 2 }
    });
    factTextObj.setOrigin(0.5);
    this.factTowerTooltip.add(factTextObj);

    // Adjust background height based on text
    const textHeight = factTextObj.height;
    const totalHeight = textHeight + 60; // Title + padding
    bg.setSize(tooltipMaxWidth, totalHeight);
    bg.setY(0);
    factTextObj.setY(titleText.y + titleText.height / 2 + factTextObj.height / 2 + 10);

    // Position tooltip near tower but keep it on screen
    let tooltipX = tower.x;
    let tooltipY = tower.y - totalHeight / 2 - 40; // Above tower

    // Keep tooltip within game area bounds
    if (tooltipX - tooltipMaxWidth / 2 < 10) {
      tooltipX = tooltipMaxWidth / 2 + 10;
    }
    if (tooltipX + tooltipMaxWidth / 2 > gameWidth - 10) {
      tooltipX = gameWidth - tooltipMaxWidth / 2 - 10;
    }
    if (tooltipY - totalHeight / 2 < 10) {
      tooltipY = tower.y + totalHeight / 2 + 40; // Below tower instead
    }

    this.factTowerTooltip.setPosition(tooltipX, tooltipY);
    this.factTowerTooltip.setDepth(10000); // Above everything
  }

  // Hide Training Camp tooltip
  hideFactTowerTooltip() {
    if (this.factTowerTooltip) {
      this.factTowerTooltip.destroy();
      this.factTowerTooltip = undefined;
    }
  }

  // Start challenge round (every 10 waves)
  // Select 3 challenging questions and reset state
  startChallengeRound() {
    this.challengeRoundActive = true;
    this.challengeQuestionIndex = 0;
    this.challengeCorrectCount = 0;

    // Select 3 challenging questions (prioritize incorrect ones from previous challenges)
    this.challengeQuestions = [];
    const availableIndices: number[] = [];

    // First priority: questions incorrect in previous challenges
    if (this.challengeIncorrectIndices.size > 0) {
      availableIndices.push(...Array.from(this.challengeIncorrectIndices));
    }

    // Fill remaining slots with random questions
    for (let i = 0; i < this.quizData.questions.length && availableIndices.length < this.quizData.questions.length; i++) {
      if (!availableIndices.includes(i)) {
        availableIndices.push(i);
      }
    }

    // Shuffle and pick 3
    for (let i = availableIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
    }

    const selectedIndices = availableIndices.slice(0, 3);
    this.challengeQuestions = selectedIndices.map(i => this.quizData.questions[i]);

    // Show first question
    this.showChallengeQuestion();
  }

  // Show current challenge question (one at a time)
  showChallengeQuestion() {
    if (this.challengeQuestionIndex >= this.challengeQuestions.length) {
      // All questions answered - show rewards
      this.showChallengeRewards();
      return;
    }

    // Pause game while question popup is active
    this.questionPopupActive = true;

    // Bring this scene to top so overlay appears above UIScene
    this.scene.bringToTop();

    const question = this.challengeQuestions[this.challengeQuestionIndex];

    // Responsive dimensions - center in game area
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;

    const panelWidth = Math.min(600, gameWidth * 0.8);
    const panelHeight = Math.min(500, height * 0.8);

    // Overlay - covers FULL SCREEN including sidebar
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    overlay.setOrigin(0.5);
    overlay.setDepth(9000);

    // Panel shadow
    const shadow = this.add.rectangle(centerX + 4, centerY + 4, panelWidth, panelHeight, 0x000000, 0.4);
    shadow.setOrigin(0.5);
    shadow.setDepth(9001);

    // Main panel
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xffffff, 1);
    panel.setOrigin(0.5);
    panel.setStrokeStyle(3, 0x473025);
    panel.setDepth(9002);

    // Header background
    const headerBg = this.add.rectangle(centerX, centerY - panelHeight / 2 + 40, panelWidth, 80, 0xff6b35, 1);
    headerBg.setOrigin(0.5);
    headerBg.setDepth(9003);

    // Header line
    const headerLine = this.add.rectangle(centerX, centerY - panelHeight / 2 + 80, panelWidth, 3, 0x473025, 1);
    headerLine.setOrigin(0.5);
    headerLine.setDepth(9004);

    // Challenge info text
    const challengeInfoText = this.add.text(centerX, centerY - panelHeight / 2 + 40,
      `Challenge Round ${this.waveNumber}\nQuestion ${this.challengeQuestionIndex + 1} of 3`, {
      fontSize: Math.min(20, width * 0.025) + 'px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '700',
      align: 'center',
      resolution: 2
    });
    challengeInfoText.setOrigin(0.5);
    challengeInfoText.setDepth(9005);

    // Question text
    const questionText = this.add.text(centerX, centerY - panelHeight / 2 + 140, question.question, {
      fontSize: Math.min(18, width * 0.022) + 'px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      align: 'center',
      wordWrap: { width: panelWidth - 80 },
      resolution: 2
    });
    questionText.setOrigin(0.5);
    questionText.setDepth(9005);

    // Answer buttons (4 options)
    const answerButtons: Phaser.GameObjects.Container[] = [];
    const buttonWidth = panelWidth - 80;
    const buttonHeight = 50;
    const startY = centerY - 20;
    const buttonSpacing = 65;

    question.options.forEach((option, index) => {
      const btnY = startY + (index * buttonSpacing);
      const btnBg = this.add.rectangle(centerX, btnY, buttonWidth, buttonHeight, 0xf4f1de, 1);
      btnBg.setStrokeStyle(2, 0x473025);
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.setDepth(9005);

      const btnText = this.add.text(centerX, btnY, option, {
        fontSize: Math.min(16, width * 0.02) + 'px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: buttonWidth - 40 },
        resolution: 2
      });
      btnText.setOrigin(0.5);
      btnText.setDepth(9006);

      const btn = this.add.container(0, 0, [btnBg, btnText]);

      btnBg.on('pointerdown', () => {
        const isCorrect = option === question.answer;
        this.handleChallengeAnswer(isCorrect, question, overlay, panel, shadow, headerBg, headerLine, challengeInfoText, questionText, answerButtons);
      });

      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0xe3dfc8);
        btnBg.setScale(0.98);
        btnText.setScale(0.98);
      });

      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0xf4f1de);
        btnBg.setScale(1);
        btnText.setScale(1);
      });

      answerButtons.push(btn);
    });

    // Keep overlay separate from container so it covers full screen
    overlay.setDepth(10000);

    this.challengeQuestionPopup = this.add.container(0, 0, [shadow, panel, headerBg, headerLine, challengeInfoText, questionText, ...answerButtons]);
    this.challengeQuestionPopup.setDepth(10001); // Ensure questions always appear on top
  }

  // Handle challenge question answer
  handleChallengeAnswer(
    isCorrect: boolean,
    question: QuizQuestion,
    overlay: Phaser.GameObjects.Rectangle,
    panel: Phaser.GameObjects.Rectangle,
    shadow: Phaser.GameObjects.Rectangle,
    headerBg: Phaser.GameObjects.Rectangle,
    headerLine: Phaser.GameObjects.Rectangle,
    challengeInfoText: Phaser.GameObjects.Text,
    questionText: Phaser.GameObjects.Text,
    answerButtons: Phaser.GameObjects.Container[]
  ) {
    // Disable all buttons
    answerButtons.forEach(btn => {
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
      bg.disableInteractive();
    });

    if (isCorrect) {
      this.challengeCorrectCount++;

      // Show "Correct!" feedback
      const feedbackText = this.add.text(panel.x, panel.y + panel.height / 2 - 80, 'Correct!', {
        fontSize: '24px',
        color: '#27ae60',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '700',
        resolution: 2
      });
      feedbackText.setOrigin(0.5);
      feedbackText.setDepth(9007);
      this.challengeQuestionPopup?.add(feedbackText);

      // Continue button
      const continueBtnBg = this.add.rectangle(panel.x, panel.y + panel.height / 2 - 30, 200, 50, 0x95b607, 1);
      continueBtnBg.setStrokeStyle(2, 0x006029);
      continueBtnBg.setInteractive({ useHandCursor: true });
      continueBtnBg.setDepth(9007);

      const continueBtnText = this.add.text(panel.x, panel.y + panel.height / 2 - 30, 'Continue', {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '700',
        resolution: 2
      });
      continueBtnText.setOrigin(0.5);
      continueBtnText.setDepth(9008);

      continueBtnBg.on('pointerdown', () => {
        this.challengeQuestionPopup?.destroy();
        this.challengeQuestionPopup = undefined;
        this.challengeQuestionIndex++;
        this.showChallengeQuestion();
      });

      continueBtnBg.on('pointerover', () => {
        continueBtnBg.setFillStyle(0x7a9700);
        continueBtnBg.setScale(0.98);
        continueBtnText.setScale(0.98);
      });

      continueBtnBg.on('pointerout', () => {
        continueBtnBg.setFillStyle(0x95b607);
        continueBtnBg.setScale(1);
        continueBtnText.setScale(1);
      });

      this.challengeQuestionPopup?.add([continueBtnBg, continueBtnText]);
    } else {
      // Track incorrect question for future challenges
      const questionIndex = this.quizData.questions.findIndex(q => q.question === question.question);
      if (questionIndex >= 0) {
        this.challengeIncorrectIndices.add(questionIndex);
      }

      // Show "Incorrect!" feedback
      const feedbackText = this.add.text(panel.x, panel.y + panel.height / 2 - 150, 'Incorrect!', {
        fontSize: '24px',
        color: '#e74c3c',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '700',
        resolution: 2
      });
      feedbackText.setOrigin(0.5);
      feedbackText.setDepth(9007);
      this.challengeQuestionPopup?.add(feedbackText);

      // Show explanation
      const explanation = question.explanation || `The correct answer is: ${question.answer}`;
      const explanationText = this.add.text(panel.x, panel.y + panel.height / 2 - 100, explanation, {
        fontSize: '16px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: panel.width * 0.8 },
        resolution: 2
      });
      explanationText.setOrigin(0.5);
      explanationText.setDepth(9007);
      this.challengeQuestionPopup?.add(explanationText);

      // Continue button
      const continueBtnBg = this.add.rectangle(panel.x, panel.y + panel.height / 2 - 30, 200, 50, 0x95b607, 1);
      continueBtnBg.setStrokeStyle(2, 0x006029);
      continueBtnBg.setInteractive({ useHandCursor: true });
      continueBtnBg.setDepth(9007);

      const continueBtnText = this.add.text(panel.x, panel.y + panel.height / 2 - 30, 'Continue', {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '700',
        resolution: 2
      });
      continueBtnText.setOrigin(0.5);
      continueBtnText.setDepth(9008);

      continueBtnBg.on('pointerdown', () => {
        this.challengeQuestionPopup?.destroy();
        this.challengeQuestionPopup = undefined;
        this.challengeQuestionIndex++;
        this.showChallengeQuestion();
      });

      continueBtnBg.on('pointerover', () => {
        continueBtnBg.setFillStyle(0x7a9700);
        continueBtnBg.setScale(0.98);
        continueBtnText.setScale(0.98);
      });

      continueBtnBg.on('pointerout', () => {
        continueBtnBg.setFillStyle(0x95b607);
        continueBtnBg.setScale(1);
        continueBtnText.setScale(1);
      });

      this.challengeQuestionPopup?.add([continueBtnBg, continueBtnText]);
    }
  }

  // Show rewards based on challenge score
  showChallengeRewards() {
    this.challengeRoundActive = false;

    // Determine rewards based on score
    if (this.challengeCorrectCount === 3) {
      // 3/3 correct - show buff selection menu
      this.showBuffSelectionMenu();
    } else if (this.challengeCorrectCount === 2) {
      // 2/3 correct - give 100 gold
      this.gold += 100;
      this.updateUIDisplays(); // Update UI
      this.updateUIDisplays(); // Update Phaser UI
      this.showChallengeRewardMessage('100 Gold Earned!', 'You got 2 out of 3 questions correct.');
    } else if (this.challengeCorrectCount === 1) {
      // 1/3 correct - give 2 free tower upgrades
      this.showChallengeRewardMessage('2 Free Upgrades!', 'You got 1 out of 3 questions correct. Your next 2 tower upgrades are free!');
      // TODO: Implement free upgrade tracking
    } else {
      // 0/3 correct - no reward
      this.showChallengeRewardMessage('No Reward', 'You got 0 out of 3 questions correct. Better luck next time!');
    }
  }

  // Show simple reward message (for gold/upgrades/nothing)
  showChallengeRewardMessage(title: string, message: string) {
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;

    const panelWidth = Math.min(500, gameWidth * 0.7);
    const panelHeight = Math.min(300, height * 0.5);

    // Overlay - covers FULL SCREEN including sidebar
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    overlay.setOrigin(0.5);
    overlay.setDepth(9000);

    // Panel
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xffffff, 1);
    panel.setOrigin(0.5);
    panel.setStrokeStyle(3, 0x473025);
    panel.setDepth(9001);

    // Title
    const titleText = this.add.text(centerX, centerY - 60, title, {
      fontSize: '28px',
      color: '#ff6b35',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '700',
      align: 'center',
      resolution: 2
    });
    titleText.setOrigin(0.5);
    titleText.setDepth(9002);

    // Message
    const messageText = this.add.text(centerX, centerY, message, {
      fontSize: '18px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      resolution: 2
    });
    messageText.setOrigin(0.5);
    messageText.setDepth(9002);

    // Continue button
    const btnBg = this.add.rectangle(centerX, centerY + 80, 200, 50, 0x95b607, 1);
    btnBg.setStrokeStyle(2, 0x006029);
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.setDepth(9002);

    const btnText = this.add.text(centerX, centerY + 80, 'Continue', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '700',
      resolution: 2
    });
    btnText.setOrigin(0.5);
    btnText.setDepth(9003);

    btnBg.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      titleText.destroy();
      messageText.destroy();
      btnBg.destroy();
      btnText.destroy();
      // Bring UIScene back to top
      this.scene.bringToTop('UIScene');
      this.questionPopupActive = false; // Resume game after challenge round ends
    });

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x7a9700);
      btnBg.setScale(0.98);
      btnText.setScale(0.98);
    });

    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x95b607);
      btnBg.setScale(1);
      btnText.setScale(1);
    });
  }

  // Show buff selection menu (roguelike style)
  showBuffSelectionMenu() {
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;

    const panelWidth = Math.min(700, gameWidth * 0.9);
    const panelHeight = Math.min(500, height * 0.8);

    // Overlay - covers FULL SCREEN including sidebar
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    overlay.setOrigin(0.5);
    overlay.setDepth(9000);

    // Panel
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0xffffff, 1);
    panel.setOrigin(0.5);
    panel.setStrokeStyle(3, 0x473025);
    panel.setDepth(9001);

    // Title
    const titleText = this.add.text(centerX, centerY - panelHeight / 2 + 50, 'Choose Your Buff!', {
      fontSize: '32px',
      color: '#ff6b35',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '700',
      align: 'center',
      resolution: 2
    });
    titleText.setOrigin(0.5);
    titleText.setDepth(9002);

    const subtitleText = this.add.text(centerX, centerY - panelHeight / 2 + 90, 'Perfect Score! Select a buff for the next 10 rounds:', {
      fontSize: '16px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      align: 'center',
      resolution: 2
    });
    subtitleText.setOrigin(0.5);
    subtitleText.setDepth(9002);

    // Buff buttons (3 options)
    const buffs: Array<{ type: 'aoe' | 'gold' | 'cooldown', name: string, description: string, color: number }> = [
      { type: 'aoe', name: 'AoE Attacks', description: 'All tower shots deal AoE damage\n(Small radius around impact)', color: 0xe74c3c },
      { type: 'gold', name: 'Gold Boost', description: 'All enemies drop +1 extra gold\nwhen defeated', color: 0xf39c12 },
      { type: 'cooldown', name: 'Quick Cooldowns', description: 'All ability cooldowns are\n25% faster', color: 0x3498db }
    ];

    const buttonWidth = 200;
    const buttonHeight = 180;
    const startX = centerX - (buttonWidth + 20);
    const buttonY = centerY + 20;

    buffs.forEach((buff, index) => {
      const btnX = startX + (index * (buttonWidth + 20));

      // Button background
      const btnBg = this.add.rectangle(btnX, buttonY, buttonWidth, buttonHeight, buff.color, 1);
      btnBg.setStrokeStyle(3, 0x473025);
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.setDepth(9002);

      // Buff name
      const nameText = this.add.text(btnX, buttonY - 50, buff.name, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '700',
        align: 'center',
        resolution: 2
      });
      nameText.setOrigin(0.5);
      nameText.setDepth(9003);

      // Buff description
      const descText = this.add.text(btnX, buttonY + 20, buff.description, {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: buttonWidth - 20 },
        resolution: 2
      });
      descText.setOrigin(0.5);
      descText.setDepth(9003);

      btnBg.on('pointerdown', () => {
        this.activateBuff(buff.type);
        overlay.destroy();
        panel.destroy();
        titleText.destroy();
        subtitleText.destroy();
        btnBg.destroy();
        nameText.destroy();
        descText.destroy();
        // Destroy other buttons
        buffs.forEach((_, i) => {
          if (i !== index) {
            const otherBtnX = startX + (i * (buttonWidth + 20));
            this.children.list.forEach(child => {
              if (child instanceof Phaser.GameObjects.Rectangle && child.x === otherBtnX && child.y === buttonY) {
                child.destroy();
              }
              if (child instanceof Phaser.GameObjects.Text && child.x === otherBtnX) {
                child.destroy();
              }
            });
          }
        });
      });

      btnBg.on('pointerover', () => {
        btnBg.setScale(1.05);
        nameText.setScale(1.05);
        descText.setScale(1.05);
      });

      btnBg.on('pointerout', () => {
        btnBg.setScale(1);
        nameText.setScale(1);
        descText.setScale(1);
      });
    });
  }

  // Activate selected buff
  activateBuff(buffType: 'aoe' | 'gold' | 'cooldown') {
    this.activeBuff = buffType;
    this.buffRoundsRemaining = 10;

    let buffName = '';
    if (buffType === 'aoe') buffName = 'AoE Attacks';
    else if (buffType === 'gold') buffName = 'Gold Boost';
    else if (buffType === 'cooldown') buffName = 'Quick Cooldowns';

    this.showErrorMessage(`${buffName} activated for 10 rounds!`);
    this.time.delayedCall(3000, () => {
      if (this.errorMessage) {
        this.errorMessage.destroy();
        this.errorMessage = undefined;
      }
    });
  }


  /**
   * Calculate distance from point to line segment
   */
  distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Line segment is actually a point
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }

    // Calculate projection of point onto line segment (clamped to [0, 1])
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    // Find nearest point on segment
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;

    // Calculate distance to nearest point
    return Math.sqrt((px - nearestX) * (px - nearestX) + (py - nearestY) * (py - nearestY));
  }

  /**
   * Phaser lifecycle: Clean up event listeners when scene is shut down
   */
  shutdown() {
    if (this.mobileSupport) {
      this.mobileSupport.destroy();
    }
  }
}
