import Phaser from 'phaser';
import { Quiz, QuizQuestion } from '@/lib/processors/ai-generator';

// Enemy type definitions
// RED: Low HP, slow (25 HP, 50 speed, 0.85 size, 1 gold)
// BLUE: Medium HP, medium speed (50 HP, 55 speed, 1.0 size, 2 gold)
// YELLOW: High HP, fast (75 HP, 60.5 speed, 1.2 size, 3 gold)
// BOSS: Spawns every 5 waves with quiz integration (300 + 50*wave HP, 57.75 speed, 1.7 size, 50 gold)
enum EnemyType {
  RED = 'RED',
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
  BOSS = 'BOSS',
}

// Enemy entity - follows path and takes damage from towers
interface Enemy {
  x: number;
  y: number;
  speed: number; // pixels per second
  health: number;
  maxHealth: number;
  type: EnemyType;
  pathIndex: number; // current target waypoint
  graphics: Phaser.GameObjects.Graphics; // visual representation
  size: number; // scale multiplier for visual size
  healthBarBg?: Phaser.GameObjects.Graphics; // health bar background
  healthBarFill?: Phaser.GameObjects.Graphics; // health bar fill
}

// Tower entity - attacks enemies in range
// Ballista (basic): Fast fire, 50 gold, 150 range
// Trebuchet (sniper): Slow fire, 75 gold, 300 range
// Melee: Very fast fire, 25 gold, 60 range
// Fact: Support tower, 40 gold, 200 buff radius (doesn't attack)
interface Tower {
  x: number;
  y: number;
  range: number; // attack radius (or buff radius for Fact tower)
  fireRate: number; // ms between attacks
  damage: number;
  cost: number; // purchase price
  lastFired: number; // timestamp of last attack
  type: 'basic' | 'sniper' | 'melee' | 'fact';
  graphics: Phaser.GameObjects.Rectangle;
  upgrades: {
    explosive?: boolean; // Trebuchet: AoE damage
    dotArrows?: boolean; // Ballista: damage over time
    fasterFireRate?: boolean; // Ballista: -15% fire rate
    moreDamage?: boolean; // Melee: +10% damage
  };
  baseDamage: number; // original damage (for buff calculations)
  baseFireRate: number; // original fire rate (for buff calculations)
  size: number; // visual scale multiplier

  // Fact tower specific properties
  buffRadius?: number; // Only for fact towers
  factText?: string; // Educational fact displayed on hover
  boosted?: boolean; // If Question ability buff is active
  boostedUntil?: number; // Timestamp when boost expires
  baseBuffRadius?: number; // Original buff radius before Question ability
}

// Damage over time effect (from Ballista upgrade)
// Deals 2 damage per 500ms tick for 4 ticks (2 seconds total)
interface DotEffect {
  enemy: Enemy;
  damagePerTick: number;
  ticksRemaining: number;
  lastTick: number;
}

// Projectile entity - travels from tower to enemy
// Melee towers use hitscan (instant damage) instead of projectiles
interface Projectile {
  x: number;
  y: number;
  target: Enemy; // tracking target
  graphics: Phaser.GameObjects.Graphics;
  sourceTower: Tower; // for checking upgrades (explosive, DoT)
  damage: number; // can be buffed beyond tower base damage
}

// Waypoint in enemy path
interface PathPoint {
  x: number;
  y: number;
}

// Main tower defense scene with quiz integration
// Wave formula: 5 + (1.25 * waveNumber) enemies per wave
// Boss spawns every 5 waves (5, 10, 15, etc.) as the 5th enemy
export default class TowerDefenseScene extends Phaser.Scene {
  // Game entities
  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private dotEffects: DotEffect[] = [];
  private pathPoints: PathPoint[] = []; // enemy movement path

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

  // Tower placement/selection
  private selectedTowerType: 'basic' | 'sniper' | 'melee' | 'fact' | null = 'basic';
  private selectedTower: Tower | null = null; // selected for upgrades
  private clickedOnTower: boolean = false; // prevent double-click placement

  // Quiz system (between-wave questions)
  private quizData!: Quiz;
  private currentQuestionIndex: number = 0;
  private waitingForQuestion: boolean = false;

  // Tower purchase quiz gate system
  private towerPurchaseCount: { basic: number; sniper: number; melee: number; fact: number } = {
    basic: 0,
    sniper: 0,
    melee: 0,
    fact: 0
  };
  private towerPurchasePrice: { basic: number; sniper: number; melee: number; fact: number } = {
    basic: 50,
    sniper: 75,
    melee: 25,
    fact: 40
  };
  private pendingTowerPlacement: { x: number; y: number; type: 'basic' | 'sniper' | 'melee' | 'fact' } | null = null;
  private towerPurchaseQuestionPopup?: Phaser.GameObjects.Container;

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
    dotArrows: 15,
    fasterFireRate: 15,
    explosive: 15,
    moreDamage: 15
  };
  private pendingUpgrade: { type: 'explosive' | 'dotArrows' | 'fasterFireRate' | 'moreDamage' } | null = null;
  private upgradeQuestionPopup?: Phaser.GameObjects.Container;

  // Active ability system
  private lightningStrikeCooldown: number = 0; // ms remaining
  private freezeCooldown: number = 0; // ms remaining
  private questionAbilityCooldown: number = 0; // ms remaining
  private questionAbilityUnlocked: boolean = false; // Unlocked after placing first Fact Tower
  private lightningStrikeActive: boolean = false; // Waiting for enemy selection
  private pendingLightningTarget: Enemy | null = null;
  private abilityQuestionPopup?: Phaser.GameObjects.Container;
  private abilityButtons?: Phaser.GameObjects.Container;
  private frozenEnemies: Set<Enemy> = new Set(); // Track frozen enemies
  private incorrectQuestionIndices: Set<number> = new Set(); // Track incorrect questions for Fact Tower tooltips
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

  // UI elements
  private waveButtonText!: Phaser.GameObjects.Text;
  private waveCounterText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private basicTowerBtn!: Phaser.GameObjects.DOMElement;
  private sniperTowerBtn!: Phaser.GameObjects.DOMElement;
  private meleeTowerBtn!: Phaser.GameObjects.DOMElement;
  private factTowerBtn!: Phaser.GameObjects.DOMElement;
  private waveButton!: Phaser.GameObjects.DOMElement;
  private backButton!: Phaser.GameObjects.DOMElement;
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
  init(data: { quiz: Quiz }) {
    this.quizData = data.quiz;
  }

  // Phaser lifecycle: Preload assets
  preload() {
    this.load.svg('checkmark', '/components/game/data/images/checkmark-1.svg', { width: 20, height: 20 });
  }

  create() {
    // Get screen dimensions
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;

    // Setup keyboard controls
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Clean grass background
    const grass = this.add.graphics();
    grass.fillStyle(0x8bc34a);
    grass.fillRect(0, 0, width, height);

    // Subtle grass texture
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const shade = 0x7cb342 + Math.floor(Math.random() * 0x102010);
      grass.fillStyle(shade, 0.25);
      grass.fillRect(x, y, 3, 5);
    }

    // Dynamic path based on screen size
    const pathY1 = height * 0.65;
    const pathY2 = height * 0.25;
    const pathY3 = height * 0.72;

    this.pathPoints = [
      { x: 0, y: pathY1 },
      { x: gameWidth * 0.3, y: pathY1 },
      { x: gameWidth * 0.3, y: pathY2 },
      { x: gameWidth * 0.7, y: pathY2 },
      { x: gameWidth * 0.7, y: pathY3 },
      { x: gameWidth - 20, y: pathY3 }
    ];

    // Modern path styling
    const path = this.add.graphics();
    path.lineStyle(70, 0x8d6e63, 1);
    path.beginPath();
    path.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    for (let i = 1; i < this.pathPoints.length; i++) {
      path.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
    }
    path.strokePath();

    // Clean modern sidebar - cream background matching site
    const sidebar = this.add.rectangle(width - sidebarWidth/2, height/2, sidebarWidth, height, 0xFFFAF2, 1);
    sidebar.setStrokeStyle(0); // No border for clean look

    // Back button with WordWyrm 3D styling
    const backButtonStyle = {
      'background': '#fffcf8',
      'color': '#473025',
      'font-family': 'Quicksand, sans-serif',
      'font-weight': '700',
      'font-size': '15px',
      'padding': '10px 20px',
      'border-radius': '13px',
      'border': '2px solid #473025',
      'cursor': 'pointer',
      'display': 'flex',
      'align-items': 'center',
      'gap': '6px',
      'position': 'relative',
      'z-index': '1000',
      'transition': 'all 0.2s ease'
    };

    this.backButton = this.add.dom(25, 25, 'button', backButtonStyle, '← Back');
    this.backButton.setDepth(1000);
    this.backButton.setOrigin(0, 0);

    this.backButton.addListener('click');
    this.backButton.on('click', () => {
      window.location.href = '/teacher/dashboard';
    });

    this.backButton.addListener('mouseenter');
    this.backButton.on('mouseenter', () => {
      const el = this.backButton.node as HTMLElement;
      el.style.transform = 'scale(0.98)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
      el.style.background = '#fff5e8';
    });

    this.backButton.addListener('mouseleave');
    this.backButton.on('mouseleave', () => {
      const el = this.backButton.node as HTMLElement;
      el.style.transform = 'scale(1)';
      el.style.boxShadow = 'none';
      el.style.background = '#fffcf8';
    });

    // lives display (top left) - aligned with back button
    const livesBg = this.add.rectangle(25, 75, 120, 40, 0xffffff, 0.9);
    livesBg.setOrigin(0, 0);
    livesBg.setStrokeStyle(2, 0xc4a46f);

    this.livesText = this.add.text(85, 95, `Lives: ${this.lives}`, {
      fontSize: '18px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      resolution: 2
    }).setOrigin(0.5);

    // gold display in sidebar - clean minimal design
    const goldBg = this.add.rectangle(width - sidebarWidth/2, 600, sidebarWidth - 20, 40, 0xffffff, 0.95);
    goldBg.setOrigin(0.5);
    goldBg.setStrokeStyle(2, 0xc4a46f);

    this.goldText = this.add.text(width - sidebarWidth/2, 600, `Gold: ${this.gold}`, {
      fontSize: '18px',
      color: '#ff9f22',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      resolution: 2
    }).setOrigin(0.5);

    // wave counter (above wave button) - clean and minimal
    this.waveCounterText = this.add.text(width - sidebarWidth/2, 35, 'Round 0', {
      fontSize: '18px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      resolution: 2
    }).setOrigin(0.5);

    // Wave button with WordWyrm 3D styling (no gradient, solid color with border)
    const waveButtonStyle = {
      'background': '#95b607',
      'color': 'white',
      'font-family': 'Quicksand, sans-serif',
      'font-weight': 'bold',
      'font-size': '18px',
      'padding': '12px 20px',
      'border-radius': '13px',
      'border': '2px solid #006029',
      'cursor': 'pointer',
      'transition': 'all 0.2s ease',
      'width': '180px',
      'text-align': 'center'
    };

    this.waveButton = this.add.dom(width - sidebarWidth/2, 85, 'button', waveButtonStyle, 'Start Wave 1');

    this.waveButton.addListener('click');
    this.waveButton.on('click', () => {
      if (!this.waveActive && this.gameStarted && !this.waitingForQuestion) {
        this.startWave();
      } else if (this.waveActive) {
        this.toggleGameSpeed();
      }
    });

    this.waveButton.addListener('mouseenter');
    this.waveButton.on('mouseenter', () => {
      const el = this.waveButton.node as HTMLElement;
      el.style.transform = 'scale(0.98)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
      el.style.background = '#7a9700';
    });

    this.waveButton.addListener('mouseleave');
    this.waveButton.on('mouseleave', () => {
      const el = this.waveButton.node as HTMLElement;
      el.style.transform = 'scale(1)';
      el.style.boxShadow = 'none';
      // Reset to current state's color
      if (!this.waveActive) {
        el.style.background = '#95b607';
      }
    });

    // tower selector title - clean and minimal
    this.add.text(width - sidebarWidth/2, 150, 'Select Tower:', {
      fontSize: '16px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      resolution: 2
    }).setOrigin(0.5);

    // Tower buttons with WordWyrm 3D styling (no gradients, solid colors with borders)
    const createTowerButton = (y: number, text: string, subtitle: string, bgColor: string, borderColor: string) => {
      const container = document.createElement('div');
      container.style.cssText = `
        background: ${bgColor};
        color: white;
        font-family: Quicksand, sans-serif;
        font-weight: 700;
        font-size: 15px;
        padding: 16px 12px;
        border-radius: 13px;
        border: 2px solid ${borderColor};
        cursor: pointer;
        width: 180px;
        text-align: center;
        transition: all 0.2s ease;
      `;

      const title = document.createElement('div');
      title.textContent = text;
      title.style.cssText = 'font-size: 16px; font-weight: 700; margin-bottom: 4px;';

      const desc = document.createElement('div');
      desc.textContent = subtitle;
      desc.style.cssText = 'font-size: 12px; opacity: 0.9;';

      container.appendChild(title);
      container.appendChild(desc);

      return this.add.dom(width - sidebarWidth/2, y, container);
    };

    // Ballista (Purple with dark border)
    this.basicTowerBtn = createTowerButton(220, 'Ballista', 'Fast Fire • 50g',
      '#A8277F', '#730f11');

    this.basicTowerBtn.addListener('click');
    this.basicTowerBtn.on('click', () => {
      this.selectedTowerType = this.selectedTowerType === 'basic' ? null : 'basic';
      this.updateTowerSelection();
    });

    this.basicTowerBtn.addListener('mouseenter');
    this.basicTowerBtn.on('mouseenter', () => {
      const el = this.basicTowerBtn.node as HTMLElement;
      el.style.transform = 'scale(0.98)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
      el.style.background = '#8B1F68';
    });

    this.basicTowerBtn.addListener('mouseleave');
    this.basicTowerBtn.on('mouseleave', () => {
      const el = this.basicTowerBtn.node as HTMLElement;
      el.style.transform = 'scale(1)';
      el.style.boxShadow = 'none';
      el.style.background = '#A8277F';
    });

    // Trebuchet (Green with dark border)
    this.sniperTowerBtn = createTowerButton(320, 'Trebuchet', 'Slow Fire • 75g',
      '#95b607', '#006029');

    this.sniperTowerBtn.addListener('click');
    this.sniperTowerBtn.on('click', () => {
      this.selectedTowerType = this.selectedTowerType === 'sniper' ? null : 'sniper';
      this.updateTowerSelection();
    });

    this.sniperTowerBtn.addListener('mouseenter');
    this.sniperTowerBtn.on('mouseenter', () => {
      const el = this.sniperTowerBtn.node as HTMLElement;
      el.style.transform = 'scale(0.98)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
      el.style.background = '#7a9700';
    });

    this.sniperTowerBtn.addListener('mouseleave');
    this.sniperTowerBtn.on('mouseleave', () => {
      const el = this.sniperTowerBtn.node as HTMLElement;
      el.style.transform = 'scale(1)';
      el.style.boxShadow = 'none';
      el.style.background = '#95b607';
    });

    // Melee Tower (Orange with dark border)
    this.meleeTowerBtn = createTowerButton(420, 'Melee Tower', 'Rapid Fire • 25g',
      '#fd9227', '#730f11');

    this.meleeTowerBtn.addListener('click');
    this.meleeTowerBtn.on('click', () => {
      this.selectedTowerType = this.selectedTowerType === 'melee' ? null : 'melee';
      this.updateTowerSelection();
    });

    this.meleeTowerBtn.addListener('mouseenter');
    this.meleeTowerBtn.on('mouseenter', () => {
      const el = this.meleeTowerBtn.node as HTMLElement;
      el.style.transform = 'scale(0.98)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
      el.style.background = '#e6832b';
    });

    this.meleeTowerBtn.addListener('mouseleave');
    this.meleeTowerBtn.on('mouseleave', () => {
      const el = this.meleeTowerBtn.node as HTMLElement;
      el.style.transform = 'scale(1)';
      el.style.boxShadow = 'none';
      el.style.background = '#fd9227';
    });

    // Fact Tower (Blue with dark border) - Support tower
    this.factTowerBtn = createTowerButton(520, 'Fact Tower', 'Support • 40g',
      '#3498db', '#2c3e50');

    this.factTowerBtn.addListener('click');
    this.factTowerBtn.on('click', () => {
      this.selectedTowerType = this.selectedTowerType === 'fact' ? null : 'fact';
      this.updateTowerSelection();
    });

    this.factTowerBtn.addListener('mouseenter');
    this.factTowerBtn.on('mouseenter', () => {
      const el = this.factTowerBtn.node as HTMLElement;
      el.style.transform = 'scale(0.98)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
      el.style.background = '#2980b9';
    });

    this.factTowerBtn.addListener('mouseleave');
    this.factTowerBtn.on('mouseleave', () => {
      const el = this.factTowerBtn.node as HTMLElement;
      el.style.transform = 'scale(1)';
      el.style.boxShadow = 'none';
      el.style.background = '#3498db';
    });

    this.updateTowerSelection();

    // Create ability buttons at bottom center
    this.createAbilityButtons();

    // enable click to place towers
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Right-click deselects the selected tower (for upgrade UI)
      if (pointer.rightButtonDown()) {
        // Remove border from selected tower
        if (this.selectedTower) {
          this.selectedTower.graphics.setStrokeStyle(0);
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

      // Check if clicking on a tower or UI area
      if (pointer.x <= 1080) {
        // Deselect tower when clicking on map
        // Remove border from selected tower
        if (this.selectedTower) {
          this.selectedTower.graphics.setStrokeStyle(0);
        }
        this.selectedTower = null;
        if (this.upgradeContainer) {
          this.upgradeContainer.destroy();
          this.upgradeContainer = undefined;
        }
      }
      this.placeTower(pointer.x, pointer.y);
    });

    // show start game button
    this.showStartGameButton();
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
          this.gold = 50;
          this.goldText.setText(`Gold: ${this.gold}`);
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

    // check if we have questions left
    if (this.currentQuestionIndex >= this.quizData.questions.length) {
      // no more questions, just give gold
      this.gold += 50;
      this.goldText.setText(`Gold: ${this.gold}`);

      // Update upgrade UI colors if tower is selected
      if (this.selectedTower) {
        this.updateUpgradeColors();
      }

      this.waitingForQuestion = false;
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

    // popup background overlay - simple fade in
    const overlay = this.add.rectangle(centerX, centerY, gameWidth, height, 0x000000, 0);
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

    this.questionPopup = this.add.container(0, 0, [overlay, shadow, panel, headerBg, headerLine, questionNum, questionText, ...answerButtons]);
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
    this.goldText.setText(`Gold: ${this.gold}`);

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
          // Clear quiz references
          this.currentQuizQuestion = undefined;
          this.currentQuizAnswerButtons = undefined;
          this.currentQuizOverlay = undefined;
          this.currentQuizPanel = undefined;
          this.currentQuizTextObj = undefined;
          this.waitingForQuestion = false;
          this.gameStarted = true;
          this.currentQuestionIndex++;
        }
      });
    });
  }

  updateTowerSelection() {
    // Update DOM button styles for selection
    const buttons = [
      { btn: this.basicTowerBtn, type: 'basic' },
      { btn: this.sniperTowerBtn, type: 'sniper' },
      { btn: this.meleeTowerBtn, type: 'melee' },
      { btn: this.factTowerBtn, type: 'fact' }
    ];

    buttons.forEach(({ btn, type }) => {
      const element = btn.node as HTMLElement;
      if (this.selectedTowerType === type) {
        element.style.outline = '4px solid #473025';
        element.style.outlineOffset = '2px';
        element.style.transform = 'scale(1.05)';
      } else {
        element.style.outline = 'none';
        if (!element.matches(':hover')) {
          element.style.transform = 'scale(1)';
        }
      }
    });
  }

  // Create ability UI buttons at bottom center of game area
  createAbilityButtons() {
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const bottomY = height - 60; // 60px from bottom

    const buttonWidth = 140;
    const buttonHeight = 50;
    const buttonSpacing = 20;
    const totalWidth = (buttonWidth * 3) + (buttonSpacing * 2);
    const startX = centerX - totalWidth / 2;

    const elements: Phaser.GameObjects.GameObject[] = [];

    // Lightning Strike Button (40g + quiz, 45s cooldown)
    const lightningX = startX + buttonWidth / 2;
    const lightningShadow = this.add.rectangle(lightningX + 2, bottomY + 2, buttonWidth, buttonHeight, 0x000000, 0.3);
    const lightningBg = this.add.rectangle(lightningX, bottomY, buttonWidth, buttonHeight, 0xff9f22);
    lightningBg.setStrokeStyle(2, 0x730f11);
    lightningBg.setInteractive({ useHandCursor: true });

    const lightningTitle = this.add.text(lightningX, bottomY - 10, '⚡ Lightning', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    const lightningInfo = this.add.text(lightningX, bottomY + 10, '40g • 45s CD', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      resolution: 2
    }).setOrigin(0.5);

    lightningBg.on('pointerover', () => {
      if (this.lightningStrikeCooldown <= 0 && this.gold >= 40) {
        lightningBg.setFillStyle(0xe6832b);
        lightningBg.setScale(1.05);
        lightningTitle.setScale(1.05);
        lightningInfo.setScale(1.05);
      }
    });

    lightningBg.on('pointerout', () => {
      lightningBg.setFillStyle(0xff9f22);
      lightningBg.setScale(1);
      lightningTitle.setScale(1);
      lightningInfo.setScale(1);
    });

    lightningBg.on('pointerdown', () => {
      if (this.lightningStrikeCooldown <= 0 && this.gold >= 40 && this.gameStarted) {
        this.showAbilityQuestion('lightning');
      }
    });

    elements.push(lightningShadow, lightningBg, lightningTitle, lightningInfo);

    // Freeze Button (60g + quiz, 60s cooldown)
    const freezeX = startX + buttonWidth * 1.5 + buttonSpacing;
    const freezeShadow = this.add.rectangle(freezeX + 2, bottomY + 2, buttonWidth, buttonHeight, 0x000000, 0.3);
    const freezeBg = this.add.rectangle(freezeX, bottomY, buttonWidth, buttonHeight, 0x3498db);
    freezeBg.setStrokeStyle(2, 0x2c3e50);
    freezeBg.setInteractive({ useHandCursor: true });

    const freezeTitle = this.add.text(freezeX, bottomY - 10, '❄ Freeze', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    const freezeInfo = this.add.text(freezeX, bottomY + 10, '60g • 60s CD', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      resolution: 2
    }).setOrigin(0.5);

    freezeBg.on('pointerover', () => {
      if (this.freezeCooldown <= 0 && this.gold >= 60) {
        freezeBg.setFillStyle(0x2980b9);
        freezeBg.setScale(1.05);
        freezeTitle.setScale(1.05);
        freezeInfo.setScale(1.05);
      }
    });

    freezeBg.on('pointerout', () => {
      freezeBg.setFillStyle(0x3498db);
      freezeBg.setScale(1);
      freezeTitle.setScale(1);
      freezeInfo.setScale(1);
    });

    freezeBg.on('pointerdown', () => {
      if (this.freezeCooldown <= 0 && this.gold >= 60 && this.gameStarted) {
        this.showAbilityQuestion('freeze');
      }
    });

    elements.push(freezeShadow, freezeBg, freezeTitle, freezeInfo);

    // Question Button (unlocked by Fact Tower, free, 90s cooldown)
    const questionX = startX + buttonWidth * 2.5 + buttonSpacing * 2;
    const questionShadow = this.add.rectangle(questionX + 2, bottomY + 2, buttonWidth, buttonHeight, 0x000000, 0.3);
    const questionBg = this.add.rectangle(questionX, bottomY, buttonWidth, buttonHeight, 0x96b902);
    questionBg.setStrokeStyle(2, 0x006029);
    questionBg.setInteractive({ useHandCursor: true });

    const questionTitle = this.add.text(questionX, bottomY - 10, '? Question', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    const questionInfo = this.add.text(questionX, bottomY + 10, 'LOCKED', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: '600',
      resolution: 2
    }).setOrigin(0.5);

    questionBg.on('pointerover', () => {
      if (this.questionAbilityUnlocked && this.questionAbilityCooldown <= 0) {
        questionBg.setFillStyle(0x7a9700);
        questionBg.setScale(1.05);
        questionTitle.setScale(1.05);
        questionInfo.setScale(1.05);
      }
    });

    questionBg.on('pointerout', () => {
      questionBg.setFillStyle(0x96b902);
      questionBg.setScale(1);
      questionTitle.setScale(1);
      questionInfo.setScale(1);
    });

    questionBg.on('pointerdown', () => {
      if (this.questionAbilityUnlocked && this.questionAbilityCooldown <= 0 && this.gameStarted) {
        this.showAbilityQuestion('question');
      }
    });

    elements.push(questionShadow, questionBg, questionTitle, questionInfo);

    this.abilityButtons = this.add.container(0, 0, elements);
  }

  // Update ability button states (cooldowns, locked status, affordability)
  updateAbilityButtons() {
    if (!this.abilityButtons) return;

    const elements = this.abilityButtons.list;

    // Lightning Strike button (indices 1-3: bg, title, info)
    const lightningBg = elements[1] as Phaser.GameObjects.Rectangle;
    const lightningInfo = elements[3] as Phaser.GameObjects.Text;

    if (this.lightningStrikeCooldown > 0) {
      const secondsLeft = Math.ceil(this.lightningStrikeCooldown / 1000);
      lightningInfo.setText(`CD: ${secondsLeft}s`);
      lightningBg.setFillStyle(0x666666);
      lightningBg.disableInteractive();
    } else if (this.gold < 40) {
      lightningInfo.setText('40g • 45s CD');
      lightningBg.setFillStyle(0x888888);
      lightningBg.disableInteractive();
    } else {
      lightningInfo.setText('40g • 45s CD');
      lightningBg.setFillStyle(0xff9f22);
      lightningBg.setInteractive({ useHandCursor: true });
    }

    // Freeze button (indices 5-7: bg, title, info)
    const freezeBg = elements[5] as Phaser.GameObjects.Rectangle;
    const freezeInfo = elements[7] as Phaser.GameObjects.Text;

    if (this.freezeCooldown > 0) {
      const secondsLeft = Math.ceil(this.freezeCooldown / 1000);
      freezeInfo.setText(`CD: ${secondsLeft}s`);
      freezeBg.setFillStyle(0x666666);
      freezeBg.disableInteractive();
    } else if (this.gold < 60) {
      freezeInfo.setText('60g • 60s CD');
      freezeBg.setFillStyle(0x888888);
      freezeBg.disableInteractive();
    } else {
      freezeInfo.setText('60g • 60s CD');
      freezeBg.setFillStyle(0x3498db);
      freezeBg.setInteractive({ useHandCursor: true });
    }

    // Question button (indices 9-11: bg, title, info)
    const questionBg = elements[9] as Phaser.GameObjects.Rectangle;
    const questionInfo = elements[11] as Phaser.GameObjects.Text;

    if (!this.questionAbilityUnlocked) {
      questionInfo.setText('LOCKED');
      questionBg.setFillStyle(0x666666);
      questionBg.disableInteractive();
    } else if (this.questionAbilityCooldown > 0) {
      const secondsLeft = Math.ceil(this.questionAbilityCooldown / 1000);
      questionInfo.setText(`CD: ${secondsLeft}s`);
      questionBg.setFillStyle(0x666666);
      questionBg.disableInteractive();
    } else {
      questionInfo.setText('Free • 90s CD');
      questionBg.setFillStyle(0x96b902);
      questionBg.setInteractive({ useHandCursor: true });
    }
  }

  startWave() {
    if (this.waveActive) return;
    this.waveActive = true;
    this.waveNumber++;
    // INCREASED DIFFICULTY: More enemies per wave (8 + 3 per wave, max 40)
    this.enemiesToSpawn = Math.min(40, Math.floor(8 + (3 * this.waveNumber)));
    this.enemySpawnTimer = 0;
    this.updateWaveButton();
    this.waveCounterText.setText(`Round ${this.waveNumber}`);
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
    this.updateWaveButton();
  }

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

  // Place a tower at clicked position with validation
  // Checks: gold cost, path distance, tower spacing, UI bounds
  // Shows quiz gate for 2nd+ tower purchase
  placeTower(x: number, y: number) {
    if (!this.gameStarted || this.waitingForQuestion || this.selectedTowerType === null) return;

    // Don't place in UI area (right panel)
    if (x > 1080) return;

    // Don't place on enemy path (40px clearance)
    const tooCloseToPath = this.pathPoints.some((point, i) => {
      if (i === 0) return false;
      const prev = this.pathPoints[i - 1];
      const distToSegment = this.pointToSegmentDistance(x, y, prev.x, prev.y, point.x, point.y);
      return distToSegment < 40;
    });

    if (tooCloseToPath) return;

    // tower stats based on type
    let towerStats: { color: number; range: number; fireRate: number; damage: number; cost: number; size: number };
    if (this.selectedTowerType === 'basic') {
      towerStats = {
        color: 0x3498db,
        range: 150,
        fireRate: 500,
        damage: 12.5,
        cost: 50,
        size: 1.0 // Ballista - unchanged
      };
    } else if (this.selectedTowerType === 'sniper') {
      towerStats = {
        color: 0xff9800,
        range: 300,
        fireRate: 2000,
        damage: 50,
        cost: 75,
        size: 1.2 // Trebuchet - 20% larger
      };
    } else if (this.selectedTowerType === 'melee') {
      towerStats = {
        color: 0xf44336,
        range: 60,
        fireRate: 100,
        damage: 8,
        cost: 25,
        size: 0.85 // Melee - 15% smaller
      };
    } else { // fact
      towerStats = {
        color: 0x3498db, // Blue color
        range: 200, // Buff radius, not attack range
        fireRate: 0, // Doesn't attack
        damage: 0, // Doesn't deal damage
        cost: 40,
        size: 1.0 // Same as Ballista
      };
    }

    // don't place too close to other towers
    // Base tower size is 40x40, so radius is 20. Add 10% buffer = 22 pixel radius
    // But need to account for different tower sizes
    const BASE_RADIUS = 20;
    const newTowerRadiusWithBuffer = BASE_RADIUS * towerStats.size * 1.1;

    const tooCloseToTower = this.towers.some(tower => {
      const existingTowerRadiusWithBuffer = BASE_RADIUS * tower.size * 1.1;
      const minDistance = newTowerRadiusWithBuffer + existingTowerRadiusWithBuffer;

      const dx = tower.x - x;
      const dy = tower.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < minDistance;
    });

    if (tooCloseToTower) {
      this.showErrorMessage('Too close to other tower!');
      return;
    }

    // check if player has enough gold (use dynamic price)
    const currentPrice = this.towerPurchasePrice[this.selectedTowerType];
    if (this.gold < currentPrice) {
      this.showErrorMessage('Not enough gold!');
      return;
    }

    // Quiz gate: First tower of each type is free, 2nd+ requires quiz
    if (this.towerPurchaseCount[this.selectedTowerType] === 0) {
      // First tower of this type - place immediately
      this.completeTowerPlacement(x, y, this.selectedTowerType);
    } else {
      // 2nd+ tower - show quiz gate
      this.pendingTowerPlacement = { x, y, type: this.selectedTowerType };
      this.showTowerPurchaseQuestion(this.selectedTowerType);
    }
  }

  // Complete tower placement after validation/quiz
  completeTowerPlacement(x: number, y: number, towerType: 'basic' | 'sniper' | 'melee' | 'fact') {
    // Get tower stats
    let towerStats: { color: number; range: number; fireRate: number; damage: number; size: number };
    if (towerType === 'basic') {
      towerStats = {
        color: 0x3498db,
        range: 150,
        fireRate: 500,
        damage: 12.5,
        size: 1.0
      };
    } else if (towerType === 'sniper') {
      towerStats = {
        color: 0xff9800,
        range: 300,
        fireRate: 2000,
        damage: 50,
        size: 1.2
      };
    } else if (towerType === 'melee') {
      towerStats = {
        color: 0xf44336,
        range: 60,
        fireRate: 100,
        damage: 8,
        size: 0.85
      };
    } else { // fact
      towerStats = {
        color: 0x3498db,
        range: 200,
        fireRate: 0,
        damage: 0,
        size: 1.0
      };
    }

    // Deduct gold at current price
    const currentPrice = this.towerPurchasePrice[towerType];
    this.gold -= currentPrice;
    this.goldText.setText(`Gold: ${this.gold}`);
    this.updateAbilityButtons(); // Update ability affordability

    // Increment purchase count
    this.towerPurchaseCount[towerType]++;

    // Reset price to base after successful purchase
    if (towerType === 'basic') {
      this.towerPurchasePrice.basic = 50;
    } else if (towerType === 'sniper') {
      this.towerPurchasePrice.sniper = 75;
    } else if (towerType === 'melee') {
      this.towerPurchasePrice.melee = 25;
    } else {
      this.towerPurchasePrice.fact = 40;
    }
    this.updateTowerButtonPrices();

    // Unlock Question ability when first Fact tower is placed
    if (towerType === 'fact' && this.towerPurchaseCount.fact === 1) {
      this.questionAbilityUnlocked = true;
      this.updateAbilityButtons();
    }

    // Update upgrade UI colors if tower is selected
    if (this.selectedTower) {
      this.updateUpgradeColors();
    }

    const towerGraphics = this.add.rectangle(x, y, 40, 40, towerStats.color);
    towerGraphics.setScale(towerStats.size);
    towerGraphics.setStrokeStyle(0);
    towerGraphics.setInteractive({ useHandCursor: true });

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
      boostedUntil: 0
    };

    // Add click handler to select tower for upgrades or Question ability
    towerGraphics.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.clickedOnTower = true;
      pointer.event.stopPropagation();

      // Check if we're in Fact Tower selection mode for Question ability
      if (tower.type === 'fact' && this.questionAbilityCooldown > 0 && this.questionAbilityCooldown < 90000) {
        this.boostFactTower(tower);
        return;
      }

      // Normal tower selection for upgrades
      this.selectedTowerType = null;
      this.updateTowerSelection();
      this.selectTowerForUpgrade(tower);
    });

    // Add hover tooltip for Fact Towers
    if (towerType === 'fact' && factText) {
      towerGraphics.on('pointerover', () => {
        this.showFactTowerTooltip(tower);
      });

      towerGraphics.on('pointerout', () => {
        this.hideFactTowerTooltip();
      });
    }

    // Draw range circle
    const rangeCircle = this.add.circle(x, y, tower.range, towerStats.color, 0.1);
    rangeCircle.setStrokeStyle(2, towerStats.color, 0.3);

    this.towers.push(tower);
  }

  showErrorMessage(message: string) {
    if (this.errorMessage) {
      this.errorMessage.destroy();
    }

    this.errorMessage = this.add.text(640, 600, message, {
      fontSize: '24px',
      color: '#e74c3c',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      this.errorMessage?.destroy();
    });
  }

  pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;
    const distX = px - nearestX;
    const distY = py - nearestY;
    return Math.sqrt(distX * distX + distY * distY);
  }

  // Spawn a single enemy based on wave number
  // Boss: Every 5 waves (5, 10, 15...) as the 5th enemy spawn
  // Regular enemies: Type probability scales with wave number
  spawnEnemy() {
    const startPoint = this.pathPoints[0];

    // Boss spawn logic: every 5 waves, spawn as 5th enemy
    const isBossWave = this.waveNumber % 5 === 0;
    const enemiesSpawned = Math.min(40, Math.floor(8 + (3 * this.waveNumber))) - this.enemiesToSpawn;
    const shouldSpawnBoss = isBossWave && enemiesSpawned === 4; // 5th enemy (0-indexed)

    let type: EnemyType;
    let health: number;
    let speed: number;
    let color: number;
    let size: number;

    if (shouldSpawnBoss) {
      // Boss spawns with quiz question popup
      type = EnemyType.BOSS;
      health = 300 + (50 * this.waveNumber); // Scales with wave
      speed = 57.75; // Between blue and yellow
      color = 0x6a0dad; // Deep purple
      size = 1.7; // 2x red enemy size

      this.bossActive = true;
      this.showBossQuestion(health); // Triggers quiz popup
    } else {
      // Regular enemy spawn - HARDER SCALING
      const rand = Math.random();

      if (this.waveNumber < 3) {
        // Waves 1-2: Only red
        type = EnemyType.RED;
      } else if (this.waveNumber < 6) {
        // Waves 3-5: 60% red, 40% blue (more blues)
        type = rand < 0.6 ? EnemyType.RED : EnemyType.BLUE;
      } else {
        // Wave 6+: 40% red, 40% blue, 20% yellow (balanced difficulty)
        if (rand < 0.4) type = EnemyType.RED;
        else if (rand < 0.8) type = EnemyType.BLUE;
        else type = EnemyType.YELLOW;
      }

      // Set stats based on enemy type - balanced for early game
      if (type === EnemyType.RED) {
        health = 25;
        speed = 50;
        color = 0xff0000;
        size = 0.85;
      } else if (type === EnemyType.BLUE) {
        health = 50;
        speed = 55;
        color = 0x0000ff;
        size = 1.0;
      } else { // YELLOW
        health = 75;
        speed = 60.5;
        color = 0xffff00;
        size = 1.2;
      }
    }

    // Create visual representation
    const graphics = this.add.graphics();
    graphics.fillStyle(color);
    graphics.beginPath();

    if (type === EnemyType.BOSS) {
      // Hexagon shape for boss
      const radius = 20;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) graphics.moveTo(x, y);
        else graphics.lineTo(x, y);
      }
      graphics.closePath();
      graphics.fillPath();
    } else {
      // Triangle shape for regular enemies
      graphics.moveTo(0, -15);
      graphics.lineTo(15, 10);
      graphics.lineTo(-15, 10);
      graphics.closePath();
      graphics.fillPath();
    }

    graphics.setPosition(startPoint.x, startPoint.y);
    graphics.setScale(size);

    // Make enemy interactive for Lightning Strike ability
    // Graphics objects need an explicit hit area defined
    if (type === EnemyType.BOSS) {
      graphics.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
    } else {
      graphics.setInteractive(new Phaser.Geom.Circle(0, 0, 15), Phaser.Geom.Circle.Contains);
    }
    graphics.input!.cursor = 'pointer';

    // Create health bar background
    const healthBarBg = this.add.graphics();
    const healthBarWidth = 30 * size;
    const healthBarHeight = 4;
    const healthBarY = -25 * size;

    healthBarBg.fillStyle(0x000000, 0.5);
    healthBarBg.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    healthBarBg.setPosition(startPoint.x, startPoint.y);

    // Create health bar fill
    const healthBarFill = this.add.graphics();
    healthBarFill.fillStyle(type === EnemyType.BOSS ? 0x6a0dad : 0x00ff00);
    healthBarFill.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    healthBarFill.setPosition(startPoint.x, startPoint.y);

    // Create enemy entity
    const enemy: Enemy = {
      x: startPoint.x,
      y: startPoint.y,
      speed: speed,
      health: health,
      maxHealth: health,
      type: type,
      pathIndex: 1, // Start at second waypoint (first is spawn)
      graphics: graphics,
      size: size,
      healthBarBg: healthBarBg,
      healthBarFill: healthBarFill
    };

    this.enemies.push(enemy);

    // Add Lightning Strike click handler
    graphics.on('pointerdown', () => {
      if (this.lightningStrikeActive) {
        this.executeLightningStrike(enemy);
      }
    });

    // Store boss reference for buff/debuff application
    if (type === EnemyType.BOSS) {
      this.bossEnemy = enemy;
    }
  }

  // Phaser lifecycle: Main game loop (runs ~60 times per second)
  // Handles: enemy spawning, movement, tower attacks, projectiles, DoT, boss timer
  update(time: number, delta: number) {
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
    if (this.lightningStrikeCooldown > 0) {
      this.lightningStrikeCooldown = Math.max(0, this.lightningStrikeCooldown - (delta * cooldownMultiplier));
    }
    if (this.freezeCooldown > 0) {
      this.freezeCooldown = Math.max(0, this.freezeCooldown - (delta * cooldownMultiplier));
    }
    // Question ability cooldown is paused between waves
    if (this.waveActive && this.questionAbilityCooldown > 0) {
      this.questionAbilityCooldown = Math.max(0, this.questionAbilityCooldown - (delta * cooldownMultiplier));
    }

    // Update ability button UI to reflect cooldown changes
    this.updateAbilityButtons();

    // Check for Fact Tower boost expiration (2 minute duration)
    this.towers.forEach(tower => {
      if (tower.type === 'fact' && tower.boosted && tower.boostedUntil) {
        if (Date.now() > tower.boostedUntil) {
          tower.boosted = false;
          tower.boostedUntil = undefined;
          // Restore original buff radius (reduce by 10%)
          if (tower.buffRadius && tower.baseBuffRadius) {
            tower.buffRadius = tower.baseBuffRadius;
          }
        }
      }
    });

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
        this.spawnEnemy();
        this.enemiesToSpawn--;
        this.enemySpawnTimer = 0;
      }
    }

    // Wave completion: all enemies spawned and killed
    if (this.waveActive && this.enemiesToSpawn === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      // Keep speed persistent - don't reset to 1x
      this.updateWaveButton();

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

      // No more between-wave questions - waves can start immediately
    }

    // update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy.pathIndex >= this.pathPoints.length) {
        // reached end, lose a life
        this.lives--;
        this.livesText.setText(`Lives: ${this.lives}`);
        enemy.graphics.destroy();
        enemy.healthBarBg?.destroy();
        enemy.healthBarFill?.destroy();
        this.enemies.splice(i, 1);

        if (this.lives <= 0) {
          this.gameOver();
        }
        continue;
      }

      const target = this.pathPoints[enemy.pathIndex];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // reached waypoint
        enemy.pathIndex++;
      } else {
        // move towards waypoint (use scaledDelta for speed)
        enemy.x += (dx / dist) * enemy.speed * scaledDelta / 1000;
        enemy.y += (dy / dist) * enemy.speed * scaledDelta / 1000;

        // rotate triangle to face direction
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        enemy.graphics.setRotation(angle);
      }

      enemy.graphics.setPosition(enemy.x, enemy.y);

      // Update health bars
      if (enemy.healthBarBg && enemy.healthBarFill) {
        enemy.healthBarBg.setPosition(enemy.x, enemy.y);
        enemy.healthBarFill.setPosition(enemy.x, enemy.y);

        // Redraw health bar fill based on current health
        const healthBarWidth = 30 * enemy.size;
        const healthBarHeight = 4;
        const healthBarY = -25 * enemy.size;
        const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);

        enemy.healthBarFill.clear();

        // Color based on health percentage
        let healthColor = 0x00ff00; // Green
        if (enemy.type === EnemyType.BOSS) {
          healthColor = 0x6a0dad; // Purple for boss
        } else if (healthPercent < 0.3) {
          healthColor = 0xff0000; // Red
        } else if (healthPercent < 0.6) {
          healthColor = 0xffff00; // Yellow
        }

        enemy.healthBarFill.fillStyle(healthColor);
        enemy.healthBarFill.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
      }

      // remove if dead
      if (enemy.health <= 0) {
        // Award gold based on enemy type
        let goldReward = 0;
        if (enemy.type === EnemyType.RED) goldReward = 1;
        else if (enemy.type === EnemyType.BLUE) goldReward = 2;
        else if (enemy.type === EnemyType.YELLOW) goldReward = 3;
        else if (enemy.type === EnemyType.BOSS) goldReward = 50;

        // Apply gold buff (+1 gold per kill)
        if (this.activeBuff === 'gold') {
          goldReward += 1;
        }

        this.gold += goldReward;
        this.goldText.setText(`Gold: ${this.gold}`);
        this.updateAbilityButtons(); // Update ability affordability

        enemy.graphics.destroy();
        enemy.healthBarBg?.destroy();
        enemy.healthBarFill?.destroy();
        this.enemies.splice(i, 1);

        // Clear boss reference if boss died
        if (enemy.type === EnemyType.BOSS && this.bossEnemy === enemy) {
          this.bossEnemy = null;
        }

        // Update upgrade UI colors if tower is selected
        if (this.selectedTower) {
          this.updateUpgradeColors();
        }
      }
    }

    // Tower shooting logic (applies global boss buff if active)
    this.towers.forEach(tower => {
      // Skip Fact Towers (they don't attack)
      if (tower.type === 'fact') return;

      // Calculate Fact Tower buffs (5% or 15% if boosted, strongest only, don't stack)
      let factTowerDamageBuff = 1.0;
      let factTowerSpeedBuff = 1.0;

      this.towers.forEach(factTower => {
        if (factTower.type !== 'fact') return;

        const dx = tower.x - factTower.x;
        const dy = tower.y - factTower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const buffRadius = factTower.buffRadius || 200;

        if (distance < buffRadius) {
          if (factTower.boosted) {
            // Boosted: 15% damage and speed
            factTowerDamageBuff = Math.max(factTowerDamageBuff, 1.15);
            factTowerSpeedBuff = Math.max(factTowerSpeedBuff, 0.85); // Lower = faster
          } else {
            // Normal: 5% damage and speed
            factTowerDamageBuff = Math.max(factTowerDamageBuff, 1.05);
            factTowerSpeedBuff = Math.max(factTowerSpeedBuff, 0.95); // Lower = faster
          }
        }
      });

      // Calculate fire rate with buffs
      let effectiveFireRate = tower.fireRate;
      effectiveFireRate *= factTowerSpeedBuff; // Fact Tower buff
      if (this.towerGlobalBuffActive) {
        effectiveFireRate *= 0.85; // Boss buff: 15% faster
      }
      const adjustedFireRate = effectiveFireRate / this.gameSpeed; // Speed toggle

      if (time - tower.lastFired > adjustedFireRate) {
        const target = this.findClosestEnemy(tower);
        if (target) {
          // Calculate damage with buffs
          let effectiveDamage = tower.damage;
          effectiveDamage *= factTowerDamageBuff; // Fact Tower buff
          if (this.towerGlobalBuffActive) {
            effectiveDamage *= 1.15; // Boss buff: 15% more damage
          }

          if (tower.type === 'melee') {
            target.health -= effectiveDamage; // Hitscan (instant)

            // Apply AoE buff for melee attacks too
            if (this.activeBuff === 'aoe') {
              const aoeRadius = 7.5; // 0.5x red enemy hitbox (15px)
              this.enemies.forEach(enemy => {
                if (enemy === target) return; // Already damaged
                const ex = enemy.x - target.x;
                const ey = enemy.y - target.y;
                const enemyDist = Math.sqrt(ex * ex + ey * ey);
                if (enemyDist < aoeRadius) {
                  enemy.health -= effectiveDamage;
                }
              });
            }
          } else {
            this.shootProjectile(tower, target, effectiveDamage); // Projectile
          }
          tower.lastFired = time;
        }
      }
    });

    // update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      if (!proj.target || proj.target.health <= 0) {
        proj.graphics.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = proj.target.x - proj.x;
      const dy = proj.target.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) {
        // hit target - apply direct damage
        proj.target.health -= proj.damage;

        // Apply AoE buff (all tower attacks deal small AoE damage)
        if (this.activeBuff === 'aoe') {
          const aoeRadius = 7.5; // 0.5x red enemy hitbox (15px)
          this.enemies.forEach(enemy => {
            if (enemy === proj.target) return; // Already damaged
            const ex = enemy.x - proj.target.x;
            const ey = enemy.y - proj.target.y;
            const enemyDist = Math.sqrt(ex * ex + ey * ey);
            if (enemyDist < aoeRadius) {
              enemy.health -= proj.damage;
            }
          });
        }

        // Check for explosive upgrade (trebuchet/sniper)
        if (proj.sourceTower.upgrades.explosive) {
          // Explosion radius based on red enemy hitbox: 15 * 0.85 * 1.5 = ~19 pixels
          const explosionRadius = 19.125;

          this.enemies.forEach(enemy => {
            if (enemy === proj.target) return; // Already damaged
            const ex = enemy.x - proj.target.x;
            const ey = enemy.y - proj.target.y;
            const enemyDist = Math.sqrt(ex * ex + ey * ey);
            if (enemyDist < explosionRadius) {
              enemy.health -= proj.damage;
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
          const existingDot = this.dotEffects.find(dot => dot.enemy === proj.target);
          if (!existingDot) {
            this.dotEffects.push({
              enemy: proj.target,
              damagePerTick: 2,
              ticksRemaining: 4,
              lastTick: time
            });
          } else {
            // Refresh DOT duration
            existingDot.ticksRemaining = 4;
            existingDot.lastTick = time;
          }
        }

        proj.graphics.destroy();
        this.projectiles.splice(i, 1);
      } else {
        // move towards target (use scaledDelta for speed)
        const speed = 400;
        proj.x += (dx / dist) * speed * scaledDelta / 1000;
        proj.y += (dy / dist) * speed * scaledDelta / 1000;
        proj.graphics.setPosition(proj.x, proj.y);
      }
    }

    // update DOT effects
    for (let i = this.dotEffects.length - 1; i >= 0; i--) {
      const dot = this.dotEffects[i];

      // Remove if enemy is dead
      if (dot.enemy.health <= 0 || !this.enemies.includes(dot.enemy)) {
        this.dotEffects.splice(i, 1);
        continue;
      }

      // Tick every 500ms (adjusted for game speed)
      const dotTickRate = 500 / this.gameSpeed;
      if (time - dot.lastTick > dotTickRate) {
        dot.enemy.health -= dot.damagePerTick;
        dot.ticksRemaining--;
        dot.lastTick = time;

        // Show damage number
        const damageText = this.add.text(dot.enemy.x, dot.enemy.y - 20, `-${dot.damagePerTick}`, {
          fontSize: '12px',
          color: '#ff6600',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
          targets: damageText,
          y: dot.enemy.y - 40,
          alpha: 0,
          duration: 500,
          onComplete: () => damageText.destroy()
        });

        // Remove if out of ticks
        if (dot.ticksRemaining <= 0) {
          this.dotEffects.splice(i, 1);
        }
      }
    }
  }

  findClosestEnemy(tower: Tower): Enemy | null {
    let closest: Enemy | null = null;
    let minDist = tower.range;

    this.enemies.forEach(enemy => {
      if (enemy.health <= 0) return;

      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    });

    return closest;
  }

  shootProjectile(tower: Tower, target: Enemy, damage?: number) {
    const projGraphics = this.add.graphics();
    projGraphics.fillStyle(0xf39c12);
    projGraphics.fillCircle(0, 0, 6);
    projGraphics.setPosition(tower.x, tower.y);

    const proj: Projectile = {
      x: tower.x,
      y: tower.y,
      target: target,
      graphics: projGraphics,
      sourceTower: tower,
      damage: damage !== undefined ? damage : tower.damage
    };

    this.projectiles.push(proj);
  }

  gameOver() {
    this.scene.pause();

    // Game over overlay and text (variables unused but objects are rendered)
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
    this.add.text(640, 360, 'GAME OVER!', {
      fontSize: '64px',
      color: '#ff0000',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(640, 440, `You survived ${this.waveNumber} waves!`, {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  selectTowerForUpgrade(tower: Tower) {
    // Remove border from previously selected tower
    if (this.selectedTower && this.selectedTower !== tower) {
      this.selectedTower.graphics.setStrokeStyle(0);
    }

    this.selectedTower = tower;

    // Add thick bright border to newly selected tower (10px for visibility, bright yellow-green)
    this.selectedTower.graphics.setStrokeStyle(10, 0xffff00);

    this.showUpgradeUI();
  }

  showUpgradeUI() {
    // Destroy existing upgrade UI
    if (this.upgradeContainer) {
      this.upgradeContainer.destroy();
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
      if (!dotPurchased) {
        dotBox.setInteractive({ useHandCursor: true });
        dotBox.on('pointerdown', () => this.purchaseUpgrade('dotArrows'));
      }
      const dotText = this.add.text(towerX - 30, upgradeY - 12, 'DOT', { fontSize: '10px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5);

      if (dotPurchased) {
        const checkmark = this.add.image(towerX - 30, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(dotBox, dotText, checkmark);
      } else {
        const dotCost = this.add.text(towerX - 30, upgradeY + 8, `${dotPrice}g`, { fontSize: '9px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: '600', resolution: 2 }).setOrigin(0.5);
        elements.push(dotBox, dotText, dotCost);
        this.upgradeButtons.push(dotBox);
      }

      // Fire rate upgrade box
      const firePurchased = this.selectedTower.upgrades.fasterFireRate;
      const firePrice = this.upgradePrices.fasterFireRate;
      const canAffordFire = this.gold >= firePrice;
      const fireBox = this.add.rectangle(towerX + 30, upgradeY, 60, 50, firePurchased ? 0x96b902 : (canAffordFire ? 0xff9f22 : 0xcccccc), 0.95);
      fireBox.setStrokeStyle(2, firePurchased ? 0x7a9700 : (canAffordFire ? 0xff8800 : 0x999999));
      if (!firePurchased) {
        fireBox.setInteractive({ useHandCursor: true });
        fireBox.on('pointerdown', () => this.purchaseUpgrade('fasterFireRate'));
      }
      const fireText = this.add.text(towerX + 30, upgradeY - 12, 'Fire+', { fontSize: '10px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5);

      if (firePurchased) {
        const checkmark = this.add.image(towerX + 30, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(fireBox, fireText, checkmark);
      } else {
        const fireCost = this.add.text(towerX + 30, upgradeY + 8, `${firePrice}g`, { fontSize: '9px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: '600', resolution: 2 }).setOrigin(0.5);
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
      if (!explosivePurchased) {
        explosiveBox.setInteractive({ useHandCursor: true });
        explosiveBox.on('pointerdown', () => this.purchaseUpgrade('explosive'));
      }
      const explosiveText = this.add.text(towerX, upgradeY - 12, 'Explosive', { fontSize: '10px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5);

      if (explosivePurchased) {
        const checkmark = this.add.image(towerX, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(explosiveBox, explosiveText, checkmark);
      } else {
        const explosiveCost = this.add.text(towerX, upgradeY + 8, `${explosivePrice}g`, { fontSize: '9px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: '600', resolution: 2 }).setOrigin(0.5);
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
      if (!damagePurchased) {
        damageBox.setInteractive({ useHandCursor: true });
        damageBox.on('pointerdown', () => this.purchaseUpgrade('moreDamage'));
      }
      const damageText = this.add.text(towerX, upgradeY - 12, 'Damage+', { fontSize: '10px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5);

      if (damagePurchased) {
        const checkmark = this.add.image(towerX, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(damageBox, damageText, checkmark);
      } else {
        const damageCost = this.add.text(towerX, upgradeY + 8, `${damagePrice}g`, { fontSize: '9px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: '600', resolution: 2 }).setOrigin(0.5);
        elements.push(damageBox, damageText, damageCost);
        this.upgradeButtons.push(damageBox);
      }
    }

    this.upgradeContainer = this.add.container(0, 0, elements);
  }

  updateUpgradeColors() {
    if (!this.selectedTower || !this.upgradeButtons || this.upgradeButtons.length === 0) return;

    // Just refresh the entire UI to show updated prices and colors
    this.showUpgradeUI();
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
      this.goldText.setText(`Gold: ${this.gold}`);

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

    this.bossQuestionPopup = this.add.container(0, 0, [overlay, panel, warningText, timerText, questionText, ...answerButtons]);
  }

  // Handle boss question answer (correct or incorrect)
  // Correct: Boss -10% HP, towers +15% damage/fire rate until wave ends
  // Incorrect: Boss +150 HP, +15% speed permanently
  handleBossAnswer(isCorrect: boolean, bossBaseHealth: number, questionIndex: number) {
    // Track for spaced repetition
    if (questionIndex >= 0) {
      this.bossAnsweredCorrectly[questionIndex] = isCorrect;
    }

    // Close question popup
    if (this.bossQuestionPopup) {
      this.bossQuestionPopup.destroy();
      this.bossQuestionPopup = undefined;
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
        fontSize: '28px',
        color: '#e74c3c',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
    }
  }

  // Show tower purchase quiz gate popup
  // Requires answering a question correctly to purchase tower (from 2nd purchase onward)
  // Wrong answer increases tower price by 25% and re-prompts
  showTowerPurchaseQuestion(towerType: 'basic' | 'sniper' | 'melee' | 'fact') {
    // Pick a random question from quiz pool
    const question = this.quizData.questions[Math.floor(Math.random() * this.quizData.questions.length)];

    // Get current tower price
    const currentPrice = this.towerPurchasePrice[towerType];
    const towerNames = { basic: 'Ballista', sniper: 'Trebuchet', melee: 'Melee Tower', fact: 'Fact Tower' };

    // Responsive dimensions - center in game area (excluding sidebar)
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(700, gameWidth * 0.85);
    const panelHeight = Math.min(540, height * 0.75);

    // Popup background overlay
    const overlay = this.add.rectangle(centerX, centerY, gameWidth, height, 0x000000, 0);
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

    // Scale animation
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
    const headerBg = this.add.rectangle(centerX, headerY, panelWidth, 90, 0xff9f22);
    const headerLine = this.add.rectangle(centerX, headerY + 45, panelWidth - 40, 4, 0xc4a46f);

    // Tower purchase indicator
    const towerInfoText = this.add.text(centerX, headerY - 20, `Purchasing: ${towerNames[towerType]} (${currentPrice}g)`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // Question text
    const questionText = this.add.text(centerX, headerY + 15, question.question, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      resolution: 2
    }).setOrigin(0.5);

    const answerButtons: Phaser.GameObjects.Container[] = [];

    // Create answer buttons
    const buttonWidth = panelWidth - 50;
    const buttonHeight = 60;
    const startY = centerY - panelHeight/2 + 170;

    question.options.forEach((option, index) => {
      const yPos = startY + (index * 68);
      const isCorrect = option === question.answer;

      // Drop shadow
      const btnShadow = this.add.rectangle(centerX + 4, yPos + 4, buttonWidth, buttonHeight, 0x000000, 0.15);
      // Main button
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
        btnBg.setScale(0.98);
        btnText.setScale(0.98);
        this.handleTowerPurchaseAnswer(isCorrect, towerType, overlay, panel, shadow, headerBg, headerLine, towerInfoText, questionText, answerButtons);
      });
    });

    this.towerPurchaseQuestionPopup = this.add.container(0, 0, [overlay, shadow, panel, headerBg, headerLine, towerInfoText, questionText, ...answerButtons]);
  }

  // Handle tower purchase quiz answer
  // Correct: Place tower, increment counter, reset price
  // Incorrect: Increase price by 25%, re-prompt
  handleTowerPurchaseAnswer(
    isCorrect: boolean,
    towerType: 'basic' | 'sniper' | 'melee' | 'fact',
    overlay: Phaser.GameObjects.Rectangle,
    panel: Phaser.GameObjects.Rectangle,
    shadow: Phaser.GameObjects.Rectangle,
    headerBg: Phaser.GameObjects.Rectangle,
    headerLine: Phaser.GameObjects.Rectangle,
    towerInfoText: Phaser.GameObjects.Text,
    questionText: Phaser.GameObjects.Text,
    answerButtons: Phaser.GameObjects.Container[]
  ) {
    // Disable all buttons
    answerButtons.forEach(btn => {
      const bg = btn.list[1] as Phaser.GameObjects.Rectangle;
      bg.removeInteractive();
    });

    if (isCorrect) {
      // Correct answer: Place tower and proceed
      const width = this.scale.width;
      const height = this.scale.height;
      const sidebarWidth = Math.min(220, width * 0.15);
      const gameWidth = width - sidebarWidth;
      const centerX = gameWidth / 2;
      const centerY = height / 2;
      const panelHeight = Math.min(540, height * 0.75);
      const panelBottom = centerY + panelHeight / 2;
      const feedbackY = panelBottom - 80;

      const feedback = this.add.text(centerX, feedbackY, 'Correct! Placing tower...', {
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

      // Close popup and place tower
      this.time.delayedCall(1000, () => {
        const fadeTargets = [overlay, panel, shadow, headerBg, headerLine, towerInfoText, questionText, feedback, ...answerButtons];
        this.tweens.add({
          targets: fadeTargets,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            // Destroy container first (this will destroy all children)
            this.towerPurchaseQuestionPopup?.destroy();
            this.towerPurchaseQuestionPopup = undefined;

            // Now actually place the tower
            if (this.pendingTowerPlacement) {
              this.completeTowerPlacement(this.pendingTowerPlacement.x, this.pendingTowerPlacement.y, this.pendingTowerPlacement.type);
              this.pendingTowerPlacement = null;
            }
          }
        });
      });
    } else {
      // Incorrect answer: Increase price by 25% and re-prompt
      this.towerPurchasePrice[towerType] = Math.round(this.towerPurchasePrice[towerType] * 1.25);
      this.updateTowerButtonPrices();

      const width = this.scale.width;
      const height = this.scale.height;
      const sidebarWidth = Math.min(220, width * 0.15);
      const gameWidth = width - sidebarWidth;
      const centerX = gameWidth / 2;
      const centerY = height / 2;
      const panelHeight = Math.min(540, height * 0.75);
      const panelBottom = centerY + panelHeight / 2;
      const feedbackY = panelBottom - 80;

      const feedback = this.add.text(centerX, feedbackY, `Incorrect! Price increased to ${this.towerPurchasePrice[towerType]}g`, {
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

      // Close popup and re-prompt
      this.time.delayedCall(1500, () => {
        const fadeTargets = [overlay, panel, shadow, headerBg, headerLine, towerInfoText, questionText, feedback, ...answerButtons];
        this.tweens.add({
          targets: fadeTargets,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            // Destroy container first (this will destroy all children)
            this.towerPurchaseQuestionPopup?.destroy();
            this.towerPurchaseQuestionPopup = undefined;

            // Check if player can still afford it
            if (this.gold >= this.towerPurchasePrice[towerType]) {
              // Re-show question with new price
              this.showTowerPurchaseQuestion(towerType);
            } else {
              // Can't afford anymore
              this.showErrorMessage(`Not enough gold! Need ${this.towerPurchasePrice[towerType]}g`);
              this.pendingTowerPlacement = null;
            }
          }
        });
      });
    }
  }

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

    // Update Melee Tower price
    const meleeTitle = this.meleeTowerBtn.node.querySelector('div:first-child') as HTMLElement;
    if (meleeTitle) {
      meleeTitle.nextElementSibling!.textContent = `Rapid Fire • ${this.towerPurchasePrice.melee}g`;
    }
  }

  // Show upgrade knowledge check quiz popup
  // Requires answering a question correctly to unlock upgrade type
  // Wrong answer refunds gold, increases price by 25%, and re-prompts
  showUpgradeQuestion(upgradeType: 'explosive' | 'dotArrows' | 'fasterFireRate' | 'moreDamage') {
    // Pick a random question from quiz pool
    const question = this.quizData.questions[Math.floor(Math.random() * this.quizData.questions.length)];

    // Get current upgrade price
    const currentPrice = this.upgradePrices[upgradeType];
    const upgradeNames = {
      dotArrows: 'DOT Arrows',
      fasterFireRate: 'Faster Fire Rate',
      explosive: 'Explosive',
      moreDamage: 'More Damage'
    };

    // Responsive dimensions - center in game area (excluding sidebar)
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(700, gameWidth * 0.85);
    const panelHeight = Math.min(540, height * 0.75);

    // Popup background overlay
    const overlay = this.add.rectangle(centerX, centerY, gameWidth, height, 0x000000, 0);
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

    // Scale animation
    panel.setScale(0.9);
    shadow.setScale(0.9);
    this.tweens.add({
      targets: [panel, shadow],
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Header background - purple for upgrades
    const headerY = centerY - panelHeight/2 + 60;
    const headerBg = this.add.rectangle(centerX, headerY, panelWidth, 90, 0xA8277F);
    const headerLine = this.add.rectangle(centerX, headerY + 45, panelWidth - 40, 4, 0xc4a46f);

    // Upgrade unlock indicator
    const upgradeInfoText = this.add.text(centerX, headerY - 20, `Unlocking: ${upgradeNames[upgradeType]} (${currentPrice}g)`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // Question text
    const questionText = this.add.text(centerX, headerY + 15, question.question, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      resolution: 2
    }).setOrigin(0.5);

    const answerButtons: Phaser.GameObjects.Container[] = [];

    // Create answer buttons
    const buttonWidth = panelWidth - 50;
    const buttonHeight = 60;
    const startY = centerY - panelHeight/2 + 170;

    question.options.forEach((option, index) => {
      const yPos = startY + (index * 68);
      const isCorrect = option === question.answer;

      // Drop shadow
      const btnShadow = this.add.rectangle(centerX + 4, yPos + 4, buttonWidth, buttonHeight, 0x000000, 0.15);
      // Main button
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
        btnBg.setScale(0.98);
        btnText.setScale(0.98);
        this.handleUpgradeAnswer(isCorrect, upgradeType, overlay, panel, shadow, headerBg, headerLine, upgradeInfoText, questionText, answerButtons);
      });
    });

    this.upgradeQuestionPopup = this.add.container(0, 0, [overlay, shadow, panel, headerBg, headerLine, upgradeInfoText, questionText, ...answerButtons]);
  }

  // Handle upgrade quiz answer
  // Correct: Unlock upgrade, apply to tower, deduct gold, reset price
  // Incorrect: Refund gold, increase price by 25%, re-prompt
  handleUpgradeAnswer(
    isCorrect: boolean,
    upgradeType: 'explosive' | 'dotArrows' | 'fasterFireRate' | 'moreDamage',
    overlay: Phaser.GameObjects.Rectangle,
    panel: Phaser.GameObjects.Rectangle,
    shadow: Phaser.GameObjects.Rectangle,
    headerBg: Phaser.GameObjects.Rectangle,
    headerLine: Phaser.GameObjects.Rectangle,
    upgradeInfoText: Phaser.GameObjects.Text,
    questionText: Phaser.GameObjects.Text,
    answerButtons: Phaser.GameObjects.Container[]
  ) {
    // Disable all buttons
    answerButtons.forEach(btn => {
      const bg = btn.list[1] as Phaser.GameObjects.Rectangle;
      bg.removeInteractive();
    });

    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelHeight = Math.min(540, height * 0.75);
    const panelBottom = centerY + panelHeight / 2;
    const feedbackY = panelBottom - 80;

    if (isCorrect) {
      // Correct answer: Unlock upgrade globally and apply to selected tower
      this.upgradeUnlocked[upgradeType] = true;

      const feedback = this.add.text(centerX, feedbackY, 'Correct! Upgrade unlocked!', {
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

      // Close popup and complete upgrade
      this.time.delayedCall(1000, () => {
        const fadeTargets = [overlay, panel, shadow, headerBg, headerLine, upgradeInfoText, questionText, feedback, ...answerButtons];
        this.tweens.add({
          targets: fadeTargets,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            // Destroy container first (this will destroy all children)
            this.upgradeQuestionPopup?.destroy();
            this.upgradeQuestionPopup = undefined;

            // Complete the upgrade purchase
            if (this.pendingUpgrade) {
              this.completeUpgradePurchase(this.pendingUpgrade.type);
              this.pendingUpgrade = null;
            }
          }
        });
      });
    } else {
      // Incorrect answer: Refund gold, increase price, re-prompt
      // Refund the gold that was deducted
      const currentPrice = this.upgradePrices[upgradeType];
      this.gold += currentPrice;
      this.goldText.setText(`Gold: ${this.gold}`);

      // Increase price by 25%
      this.upgradePrices[upgradeType] = Math.round(this.upgradePrices[upgradeType] * 1.25);

      const feedback = this.add.text(centerX, feedbackY, `Incorrect! Gold refunded. Price now ${this.upgradePrices[upgradeType]}g`, {
        fontSize: '22px',
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

      // Close popup and re-prompt
      this.time.delayedCall(1500, () => {
        const fadeTargets = [overlay, panel, shadow, headerBg, headerLine, upgradeInfoText, questionText, feedback, ...answerButtons];
        this.tweens.add({
          targets: fadeTargets,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            // Destroy container first (this will destroy all children)
            this.upgradeQuestionPopup?.destroy();
            this.upgradeQuestionPopup = undefined;

            // Check if player can still afford it
            if (this.gold >= this.upgradePrices[upgradeType]) {
              // Re-show question with new price
              this.showUpgradeQuestion(upgradeType);
            } else {
              // Can't afford anymore
              this.showErrorMessage(`Not enough gold! Need ${this.upgradePrices[upgradeType]}g`);
              this.pendingUpgrade = null;
              // Refresh upgrade UI to show updated prices
              if (this.selectedTower) {
                this.showUpgradeUI();
              }
            }
          }
        });
      });
    }
  }

  // Complete upgrade purchase after quiz success
  // Deducts gold, marks upgrade as purchased on tower, applies stat changes, resets price
  completeUpgradePurchase(upgradeType: 'explosive' | 'dotArrows' | 'fasterFireRate' | 'moreDamage') {
    if (!this.selectedTower) return;

    const currentPrice = this.upgradePrices[upgradeType];

    // Deduct gold
    this.gold -= currentPrice;
    this.goldText.setText(`Gold: ${this.gold}`);

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

    // Reset price to base (15g)
    this.upgradePrices[upgradeType] = 15;

    // Refresh upgrade UI
    this.showUpgradeUI();
  }

  // Show ability quiz popup
  // lightning: 40g, 45s cooldown, enemy selection after quiz
  // freeze: 60g, 60s cooldown, freezes all enemies
  // question: free, 90s cooldown, boost selected Fact Tower
  showAbilityQuestion(abilityType: 'lightning' | 'freeze' | 'question') {
    // Pick a random question from quiz pool
    const question = this.quizData.questions[Math.floor(Math.random() * this.quizData.questions.length)];

    const abilityInfo = {
      lightning: { name: 'Lightning Strike', cost: 40, color: 0xff9f22 },
      freeze: { name: 'Freeze', cost: 60, color: 0x3498db },
      question: { name: 'Question Ability', cost: 0, color: 0x96b902 }
    };

    const info = abilityInfo[abilityType];

    // Responsive dimensions - center in game area (excluding sidebar)
    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(700, gameWidth * 0.85);
    const panelHeight = Math.min(540, height * 0.75);

    // Popup background overlay
    const overlay = this.add.rectangle(centerX, centerY, gameWidth, height, 0x000000, 0);
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

    // Scale animation
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
    const headerBg = this.add.rectangle(centerX, headerY, panelWidth, 90, info.color);
    const headerLine = this.add.rectangle(centerX, headerY + 45, panelWidth - 40, 4, 0xc4a46f);

    // Ability indicator
    const costText = info.cost > 0 ? ` (${info.cost}g)` : ' (Free)';
    const abilityInfoText = this.add.text(centerX, headerY - 20, `Using: ${info.name}${costText}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // Question text
    const questionText = this.add.text(centerX, headerY + 15, question.question, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      resolution: 2
    }).setOrigin(0.5);

    const answerButtons: Phaser.GameObjects.Container[] = [];

    // Create answer buttons
    const buttonWidth = panelWidth - 50;
    const buttonHeight = 60;
    const startY = centerY - panelHeight/2 + 170;

    question.options.forEach((option, index) => {
      const yPos = startY + (index * 68);
      const isCorrect = option === question.answer;

      // Drop shadow
      const btnShadow = this.add.rectangle(centerX + 4, yPos + 4, buttonWidth, buttonHeight, 0x000000, 0.15);
      // Main button
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
        btnBg.setScale(0.98);
        btnText.setScale(0.98);
        this.handleAbilityAnswer(isCorrect, abilityType, question, overlay, panel, shadow, headerBg, headerLine, abilityInfoText, questionText, answerButtons);
      });
    });

    this.abilityQuestionPopup = this.add.container(0, 0, [overlay, shadow, panel, headerBg, headerLine, abilityInfoText, questionText, ...answerButtons]);
  }

  // Handle ability quiz answer
  // Correct: Deduct cost, activate ability, set cooldown
  // Incorrect: Track for spaced repetition, don't activate ability
  handleAbilityAnswer(
    isCorrect: boolean,
    abilityType: 'lightning' | 'freeze' | 'question',
    question: QuizQuestion,
    overlay: Phaser.GameObjects.Rectangle,
    panel: Phaser.GameObjects.Rectangle,
    shadow: Phaser.GameObjects.Rectangle,
    headerBg: Phaser.GameObjects.Rectangle,
    headerLine: Phaser.GameObjects.Rectangle,
    abilityInfoText: Phaser.GameObjects.Text,
    questionText: Phaser.GameObjects.Text,
    answerButtons: Phaser.GameObjects.Container[]
  ) {
    // Disable all buttons
    answerButtons.forEach(btn => {
      const bg = btn.list[1] as Phaser.GameObjects.Rectangle;
      bg.removeInteractive();
    });

    const width = this.scale.width;
    const height = this.scale.height;
    const sidebarWidth = Math.min(220, width * 0.15);
    const gameWidth = width - sidebarWidth;
    const centerX = gameWidth / 2;
    const centerY = height / 2;
    const panelHeight = Math.min(540, height * 0.75);
    const panelBottom = centerY + panelHeight / 2;
    const feedbackY = panelBottom - 80;

    if (isCorrect) {
      // Correct answer: Activate ability
      const feedback = this.add.text(centerX, feedbackY, 'Correct! Ability activated!', {
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

      // Close popup and activate ability
      this.time.delayedCall(1000, () => {
        const fadeTargets = [overlay, panel, shadow, headerBg, headerLine, abilityInfoText, questionText, feedback, ...answerButtons];
        this.tweens.add({
          targets: fadeTargets,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            this.abilityQuestionPopup?.destroy();
            this.abilityQuestionPopup = undefined;

            // Activate the ability
            this.activateAbility(abilityType);
          }
        });
      });
    } else {
      // Incorrect answer: Don't activate, but track for spaced repetition
      const questionIndex = this.quizData.questions.findIndex(q => q.question === question.question);
      if (questionIndex >= 0) {
        this.incorrectQuestionIndices.add(questionIndex);
      }

      const feedback = this.add.text(centerX, feedbackY, 'Incorrect! Ability not activated.', {
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

      // Close popup
      this.time.delayedCall(1500, () => {
        const fadeTargets = [overlay, panel, shadow, headerBg, headerLine, abilityInfoText, questionText, feedback, ...answerButtons];
        this.tweens.add({
          targets: fadeTargets,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            this.abilityQuestionPopup?.destroy();
            this.abilityQuestionPopup = undefined;
          }
        });
      });
    }
  }

  // Activate ability after successful quiz
  activateAbility(abilityType: 'lightning' | 'freeze' | 'question') {
    if (abilityType === 'lightning') {
      // Deduct cost and set cooldown
      this.gold -= 40;
      this.goldText.setText(`Gold: ${this.gold}`);
      this.lightningStrikeCooldown = 45000; // 45 seconds in ms
      this.updateAbilityButtons();

      // Enter enemy selection mode
      this.lightningStrikeActive = true;
      this.showErrorMessage('Select an enemy to strike!');
    } else if (abilityType === 'freeze') {
      // Deduct cost and set cooldown
      this.gold -= 60;
      this.goldText.setText(`Gold: ${this.gold}`);
      this.freezeCooldown = 60000; // 60 seconds in ms
      this.updateAbilityButtons();

      // Freeze all enemies
      this.freezeAllEnemies();
    } else if (abilityType === 'question') {
      // Set cooldown (no cost)
      this.questionAbilityCooldown = 90000; // 90 seconds in ms
      this.updateAbilityButtons();

      // Check if there are any Fact Towers to boost
      const factTowers = this.towers.filter(t => t.type === 'fact');
      if (factTowers.length === 0) {
        this.showErrorMessage('No Fact Towers to boost!');
        // Refund cooldown since ability can't be used
        this.questionAbilityCooldown = 0;
        this.updateAbilityButtons();
      } else {
        // Highlight all Fact Towers for selection
        this.highlightFactTowers(true);
        this.showErrorMessage('Select a Fact Tower to boost!');
      }
    }
  }

  // Freeze all enemies for 5 seconds (bosses slowed 50% instead)
  freezeAllEnemies() {
    const currentTime = Date.now();
    this.enemies.forEach(enemy => {
      if (enemy.type === EnemyType.BOSS) {
        // Bosses are slowed by 50% for 5 seconds
        enemy.speed *= 0.5;
        this.frozenEnemies.add(enemy);
      } else {
        // Regular enemies are frozen (speed = 0)
        enemy.speed = 0;
        this.frozenEnemies.add(enemy);
      }
    });

    // Unfreeze after 5 seconds
    this.time.delayedCall(5000, () => {
      this.frozenEnemies.forEach(enemy => {
        if (!this.enemies.includes(enemy)) return; // Enemy already dead

        if (enemy.type === EnemyType.BOSS) {
          // Restore boss speed
          enemy.speed *= 2; // Undo the 50% slow
        } else {
          // Restore regular enemy speed based on type
          if (enemy.type === EnemyType.RED) enemy.speed = 50;
          else if (enemy.type === EnemyType.BLUE) enemy.speed = 55;
          else if (enemy.type === EnemyType.YELLOW) enemy.speed = 60.5;
        }
      });
      this.frozenEnemies.clear();
    });
  }

  // Execute Lightning Strike on selected enemy
  // Deals 100 damage to target, 25 damage in AoE (30px radius)
  executeLightningStrike(target: Enemy) {
    if (!this.lightningStrikeActive || !this.enemies.includes(target)) return;

    // Deactivate selection mode
    this.lightningStrikeActive = false;
    if (this.errorMessage) {
      this.errorMessage.destroy();
      this.errorMessage = undefined;
    }

    // Deal 100 damage to target
    target.health -= 100;

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
    this.enemies.forEach(enemy => {
      if (enemy === target) return; // Skip target (already damaged)

      const dx = enemy.x - target.x;
      const dy = enemy.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < aoeRadius) {
        enemy.health -= 25;

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

  // Highlight or un-highlight Fact Towers for Question ability selection
  highlightFactTowers(highlight: boolean) {
    this.towers.forEach(tower => {
      if (tower.type === 'fact') {
        if (highlight) {
          // Add pulsing green highlight
          tower.graphics.setStrokeStyle(6, 0x00ff00);
          this.tweens.add({
            targets: tower.graphics,
            alpha: { from: 1, to: 0.6 },
            duration: 500,
            yoyo: true,
            repeat: -1
          });
        } else {
          // Remove highlight
          tower.graphics.setStrokeStyle(0);
          this.tweens.killTweensOf(tower.graphics);
          tower.graphics.setAlpha(1);
        }
      }
    });
  }

  // Boost selected Fact Tower (+10% radius, 5%→15% buffs for 2 mins)
  boostFactTower(tower: Tower) {
    if (tower.type !== 'fact') return;

    // Remove highlights
    this.highlightFactTowers(false);
    if (this.errorMessage) {
      this.errorMessage.destroy();
      this.errorMessage = undefined;
    }

    // Apply boost
    tower.boosted = true;
    tower.boostedUntil = Date.now() + 120000; // 2 minutes in ms
    if (tower.baseBuffRadius) {
      tower.buffRadius = tower.baseBuffRadius * 1.1; // +10% radius
    }

    // Visual feedback
    this.showErrorMessage('Fact Tower boosted! +10% radius, 15% buffs for 2 minutes');
    this.time.delayedCall(2000, () => {
      if (this.errorMessage) {
        this.errorMessage.destroy();
        this.errorMessage = undefined;
      }
    });

    // Set up boost expiration (handled in update loop)
  }

  // Show tooltip with educational fact for Fact Tower
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
    bg.setStrokeStyle(3, 0x96b902); // Green border (Fact Tower color)
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

  // Hide Fact Tower tooltip
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

    // Overlay
    const overlay = this.add.rectangle(centerX, centerY, gameWidth, height, 0x000000, 0.85);
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

    this.challengeQuestionPopup = this.add.container(0, 0, [overlay, shadow, panel, headerBg, headerLine, challengeInfoText, questionText, ...answerButtons]);
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
      this.goldText.setText(`Gold: ${this.gold}`);
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

    // Overlay
    const overlay = this.add.rectangle(centerX, centerY, gameWidth, height, 0x000000, 0.85);
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

    // Overlay
    const overlay = this.add.rectangle(centerX, centerY, gameWidth, height, 0x000000, 0.85);
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
}
