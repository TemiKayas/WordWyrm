import Phaser from 'phaser';
import { Quiz, QuizQuestion } from '@/lib/processors/ai-generator';

// Enemy type definitions
// RED: Low HP, slow (25 HP, 50 speed, 0.85 size)
// BLUE: Medium HP, medium speed (50 HP, 55 speed, 1.0 size)
// YELLOW: High HP, fast (75 HP, 60.5 speed, 1.2 size)
// BOSS: Spawns every 5 waves with quiz integration (300 + 50*wave HP, 57.75 speed, 1.7 size)
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
interface Tower {
  x: number;
  y: number;
  range: number; // attack radius
  fireRate: number; // ms between attacks
  damage: number;
  cost: number; // purchase price
  lastFired: number; // timestamp of last attack
  type: 'basic' | 'sniper' | 'melee';
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
  private selectedTowerType: 'basic' | 'sniper' | 'melee' | null = 'basic';
  private selectedTower: Tower | null = null; // selected for upgrades
  private clickedOnTower: boolean = false; // prevent double-click placement

  // Quiz system (between-wave questions)
  private quizData!: Quiz;
  private currentQuestionIndex: number = 0;
  private waitingForQuestion: boolean = false;

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
    const goldBg = this.add.rectangle(width - sidebarWidth/2, 495, sidebarWidth - 20, 40, 0xffffff, 0.95);
    goldBg.setOrigin(0.5);
    goldBg.setStrokeStyle(2, 0xc4a46f);

    this.goldText = this.add.text(width - sidebarWidth/2, 495, `Gold: ${this.gold}`, {
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

    this.updateTowerSelection();

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
          this.showQuestion();
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
      { btn: this.meleeTowerBtn, type: 'melee' }
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
    } else { // melee
      towerStats = {
        color: 0xf44336,
        range: 60,
        fireRate: 100,
        damage: 8,
        cost: 25,
        size: 0.85 // Melee - 15% smaller
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

    // check if player has enough gold
    if (this.gold < towerStats.cost) {
      this.showErrorMessage('Not enough gold!');
      return;
    }

    // deduct gold
    this.gold -= towerStats.cost;
    this.goldText.setText(`Gold: ${this.gold}`);

    // Update upgrade UI colors if tower is selected
    if (this.selectedTower) {
      this.updateUpgradeColors();
    }

    const towerGraphics = this.add.rectangle(x, y, 40, 40, towerStats.color);
    towerGraphics.setScale(towerStats.size); // Apply size scaling
    towerGraphics.setStrokeStyle(0); // Initialize with no stroke
    towerGraphics.setInteractive({ useHandCursor: true });

    const tower: Tower = {
      x: x,
      y: y,
      range: towerStats.range,
      fireRate: towerStats.fireRate,
      damage: towerStats.damage,
      cost: towerStats.cost,
      lastFired: 0,
      type: this.selectedTowerType,
      graphics: towerGraphics,
      upgrades: {},
      baseDamage: towerStats.damage,
      baseFireRate: towerStats.fireRate,
      size: towerStats.size
    };

    // Add click handler to select tower for upgrades
    towerGraphics.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.clickedOnTower = true; // Mark that we clicked on a tower
      pointer.event.stopPropagation();
      // Deselect tower spawn button when clicking on existing tower
      this.selectedTowerType = null;
      this.updateTowerSelection();
      this.selectTowerForUpgrade(tower);
    });

    // draw range circle
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

      // Show between-wave quiz question
      this.showQuestion();
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
        if (enemy.type === EnemyType.RED) goldReward = 0;
        else if (enemy.type === EnemyType.BLUE) goldReward = 1;
        else if (enemy.type === EnemyType.YELLOW) goldReward = 2;
        else if (enemy.type === EnemyType.BOSS) goldReward = 50;

        this.gold += goldReward;
        this.goldText.setText(`Gold: ${this.gold}`);

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
      // Calculate fire rate with buffs
      let effectiveFireRate = tower.fireRate;
      if (this.towerGlobalBuffActive) {
        effectiveFireRate *= 0.85; // Boss buff: 15% faster
      }
      const adjustedFireRate = effectiveFireRate / this.gameSpeed; // Speed toggle

      if (time - tower.lastFired > adjustedFireRate) {
        const target = this.findClosestEnemy(tower);
        if (target) {
          // Calculate damage with buffs
          let effectiveDamage = tower.damage;
          if (this.towerGlobalBuffActive) {
            effectiveDamage *= 1.15; // Boss buff: 15% more damage
          }

          if (tower.type === 'melee') {
            target.health -= effectiveDamage; // Hitscan (instant)
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
    const UPGRADE_COST = 15;

    // Ballista (basic) upgrades: DOT and Fire Rate
    if (this.selectedTower.type === 'basic') {
      // DOT upgrade box - modern rounded style
      const dotPurchased = this.selectedTower.upgrades.dotArrows;
      const canAffordDot = this.gold >= UPGRADE_COST;
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
        const dotCost = this.add.text(towerX - 30, upgradeY + 8, '15g', { fontSize: '9px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: '600', resolution: 2 }).setOrigin(0.5);
        elements.push(dotBox, dotText, dotCost);
        this.upgradeButtons.push(dotBox);
      }

      // Fire rate upgrade box
      const firePurchased = this.selectedTower.upgrades.fasterFireRate;
      const canAffordFire = this.gold >= UPGRADE_COST;
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
        const fireCost = this.add.text(towerX + 30, upgradeY + 8, '15g', { fontSize: '9px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: '600', resolution: 2 }).setOrigin(0.5);
        elements.push(fireBox, fireText, fireCost);
        this.upgradeButtons.push(fireBox);
      }
    }

    // Trebuchet (sniper) upgrade: Explosive
    if (this.selectedTower.type === 'sniper') {
      const explosivePurchased = this.selectedTower.upgrades.explosive;
      const canAffordExplosive = this.gold >= UPGRADE_COST;
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
        const explosiveCost = this.add.text(towerX, upgradeY + 8, '15g', { fontSize: '9px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: '600', resolution: 2 }).setOrigin(0.5);
        elements.push(explosiveBox, explosiveText, explosiveCost);
        this.upgradeButtons.push(explosiveBox);
      }
    }

    // Melee upgrade: Damage
    if (this.selectedTower.type === 'melee') {
      const damagePurchased = this.selectedTower.upgrades.moreDamage;
      const canAffordDamage = this.gold >= UPGRADE_COST;
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
        const damageCost = this.add.text(towerX, upgradeY + 8, '15g', { fontSize: '9px', color: '#473025', fontFamily: 'Quicksand, sans-serif', fontStyle: '600', resolution: 2 }).setOrigin(0.5);
        elements.push(damageBox, damageText, damageCost);
        this.upgradeButtons.push(damageBox);
      }
    }

    this.upgradeContainer = this.add.container(0, 0, elements);
  }

  updateUpgradeColors() {
    if (!this.selectedTower || !this.upgradeButtons || this.upgradeButtons.length === 0) return;

    const UPGRADE_COST = 15;
    const canAfford = this.gold >= UPGRADE_COST;

    // Update all unpurchased upgrade button colors with modern site colors
    this.upgradeButtons.forEach(button => {
      button.setFillStyle(canAfford ? 0xff9f22 : 0xcccccc, 0.95);
      button.setStrokeStyle(2, canAfford ? 0xff8800 : 0x999999);
    });
  }

  // Purchase tower upgrade (15 gold each)
  // Ballista: DoT arrows, faster fire rate
  // Trebuchet: Explosive projectiles
  // Melee: More damage
  purchaseUpgrade(upgradeType: 'explosive' | 'dotArrows' | 'fasterFireRate' | 'moreDamage') {
    if (!this.selectedTower) return;

    const UPGRADE_COST = 15;

    if (this.gold < UPGRADE_COST) {
      this.showErrorMessage('Not enough gold for upgrade!');
      return;
    }

    if (this.selectedTower.upgrades[upgradeType]) {
      return; // Already purchased
    }

    // Deduct cost
    this.gold -= UPGRADE_COST;
    this.goldText.setText(`Gold: ${this.gold}`);

    // Mark as purchased
    this.selectedTower.upgrades[upgradeType] = true;

    // Apply stat changes (projectile effects handled on hit)
    switch (upgradeType) {
      case 'fasterFireRate':
        this.selectedTower.fireRate = this.selectedTower.baseFireRate * 0.85; // -15%
        break;
      case 'moreDamage':
        this.selectedTower.damage = this.selectedTower.baseDamage * 1.1; // +10%
        break;
      // explosive and dotArrows apply on projectile impact
    }

    this.showUpgradeUI(); // Refresh UI
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
}
