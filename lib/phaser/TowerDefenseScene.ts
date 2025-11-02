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
  private gameSpeed: number = 1; // 1x or 2x speed toggle

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
  private basicTowerBtn!: Phaser.GameObjects.Rectangle;
  private sniperTowerBtn!: Phaser.GameObjects.Rectangle;
  private meleeTowerBtn!: Phaser.GameObjects.Rectangle;
  private upgradeContainer?: Phaser.GameObjects.Container;
  private upgradeButtons: Phaser.GameObjects.Rectangle[] = [];
  private startGameButton?: Phaser.GameObjects.Container;
  private questionPopup?: Phaser.GameObjects.Container;
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
    // grass background
    const grass = this.add.graphics();
    grass.fillStyle(0x27ae60);
    grass.fillRect(0, 0, 1280, 720);

    // grass texture pattern
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 1280;
      const y = Math.random() * 720;
      const shade = 0x229954 + Math.floor(Math.random() * 0x102010);
      grass.fillStyle(shade, 0.3);
      grass.fillRect(x, y, 2, 4);
    }

    // path with right angles (grey gravel)
    this.pathPoints = [
      { x: 0, y: 450 },
      { x: 300, y: 450 },
      { x: 300, y: 150 },
      { x: 700, y: 150 },
      { x: 700, y: 500 },
      { x: 1080, y: 500 }
    ];

    const path = this.add.graphics();
    path.lineStyle(60, 0x7f8c8d);
    path.beginPath();
    path.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    for (let i = 1; i < this.pathPoints.length; i++) {
      path.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
    }
    path.strokePath();

    // title
    this.add.text(540, 30, 'Tower Defense', {
      fontSize: '32px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // UI panel background
    const uiPanel = this.add.rectangle(1180, 360, 200, 720, 0x2c3e50);

    // lives display (top left)
    this.livesText = this.add.text(20, 20, `Lives: ${this.lives}`, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });

    // gold display (bottom right)
    this.goldText = this.add.text(1260, 700, `Gold: ${this.gold}`, {
      fontSize: '24px',
      color: '#f39c12',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(1, 1);

    // wave counter (above wave button)
    this.waveCounterText = this.add.text(1180, 35, 'Round 0', {
      fontSize: '20px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // start wave button (top right)
    const waveButton = this.add.rectangle(1180, 80, 160, 50, 0x27ae60);
    waveButton.setInteractive({ useHandCursor: true });
    this.waveButtonText = this.add.text(1180, 80, 'Start Wave 1', {
      fontSize: '18px',
      color: '#fff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    waveButton.on('pointerdown', () => {
      if (!this.waveActive && this.gameStarted && !this.waitingForQuestion) {
        // Start new wave
        this.startWave();
      } else if (this.waveActive) {
        // Toggle game speed during active wave
        this.toggleGameSpeed();
      }
    });

    waveButton.on('pointerover', () => waveButton.setFillStyle(0x229954));
    waveButton.on('pointerout', () => waveButton.setFillStyle(0x27ae60));

    // tower selector title
    this.add.text(1180, 150, 'Select Tower:', {
      fontSize: '20px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    // basic tower button (50 gold) - now Ballista
    this.basicTowerBtn = this.add.rectangle(1180, 230, 160, 100, 0x3498db);
    this.basicTowerBtn.setInteractive({ useHandCursor: true });
    this.basicTowerBtn.setStrokeStyle(4, 0xffffff);

    this.add.text(1180, 188, 'Ballista', {
      fontSize: '16px',
      color: '#fff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(1180, 210, 'Fast Fire - 50g', {
      fontSize: '11px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    this.basicTowerBtn.on('pointerdown', () => {
      if (this.selectedTowerType === 'basic') {
        // Deselect if already selected
        this.selectedTowerType = null;
      } else {
        this.selectedTowerType = 'basic';
      }
      this.updateTowerSelection();
    });

    // sniper/long range tower button (75 gold) - now Trebuchet
    this.sniperTowerBtn = this.add.rectangle(1180, 360, 160, 100, 0xff9800);
    this.sniperTowerBtn.setInteractive({ useHandCursor: true });

    this.add.text(1180, 318, 'Trebuchet', {
      fontSize: '16px',
      color: '#fff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(1180, 340, 'Slow Fire - 75g', {
      fontSize: '11px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    this.sniperTowerBtn.on('pointerdown', () => {
      if (this.selectedTowerType === 'sniper') {
        // Deselect if already selected
        this.selectedTowerType = null;
      } else {
        this.selectedTowerType = 'sniper';
      }
      this.updateTowerSelection();
    });

    // melee tower button (25 gold)
    this.meleeTowerBtn = this.add.rectangle(1180, 490, 160, 100, 0xf44336);
    this.meleeTowerBtn.setInteractive({ useHandCursor: true });

    this.add.text(1180, 448, 'Melee Tower', {
      fontSize: '16px',
      color: '#fff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(1180, 470, 'Rapid Fire - 25g', {
      fontSize: '11px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    this.meleeTowerBtn.on('pointerdown', () => {
      if (this.selectedTowerType === 'melee') {
        // Deselect if already selected
        this.selectedTowerType = null;
      } else {
        this.selectedTowerType = 'melee';
      }
      this.updateTowerSelection();
    });

    this.updateTowerSelection();

    // Upgrade panel title (below tower buttons)
    this.add.text(1180, 560, 'Upgrades:', {
      fontSize: '18px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    this.add.text(1180, 585, 'Click a tower to upgrade', {
      fontSize: '11px',
      color: '#95a5a6',
      fontFamily: 'Quicksand, sans-serif',
      align: 'center'
    }).setOrigin(0.5);

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
    const buttonBg = this.add.rectangle(640, 360, 300, 80, 0x27ae60);
    buttonBg.setInteractive({ useHandCursor: true });

    const buttonText = this.add.text(640, 360, 'START GAME', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.startGameButton = this.add.container(0, 0, [buttonBg, buttonText]);

    buttonBg.on('pointerdown', () => {
      this.startGameButton?.destroy();
      this.showQuestion();
    });

    buttonBg.on('pointerover', () => buttonBg.setFillStyle(0x229954));
    buttonBg.on('pointerout', () => buttonBg.setFillStyle(0x27ae60));
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

    // popup background overlay
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);

    // popup panel
    const panel = this.add.rectangle(640, 360, 700, 500, 0x2c3e50);
    panel.setStrokeStyle(4, 0xecf0f1);

    // question text
    const questionText = this.add.text(640, 200, question.question, {
      fontSize: '20px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 650 }
    }).setOrigin(0.5);

    const answerButtons: Phaser.GameObjects.Container[] = [];

    // create answer buttons
    question.options.forEach((option, index) => {
      const yPos = 300 + (index * 60);
      const isCorrect = option === question.answer;

      const btnBg = this.add.rectangle(640, yPos, 650, 50, 0x34495e);
      btnBg.setInteractive({ useHandCursor: true });

      const btnText = this.add.text(640, yPos, option, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: 600 }
      }).setOrigin(0.5);

      const button = this.add.container(0, 0, [btnBg, btnText]);
      answerButtons.push(button);

      btnBg.on('pointerover', () => btnBg.setFillStyle(0x475569));
      btnBg.on('pointerout', () => btnBg.setFillStyle(0x34495e));

      btnBg.on('pointerdown', () => {
        this.handleAnswer(isCorrect, overlay, panel, questionText, answerButtons);
      });
    });

    this.questionPopup = this.add.container(0, 0, [overlay, panel, questionText, ...answerButtons]);
  }

  handleAnswer(isCorrect: boolean, overlay: Phaser.GameObjects.Rectangle, panel: Phaser.GameObjects.Rectangle, questionText: Phaser.GameObjects.Text, answerButtons: Phaser.GameObjects.Container[]) {
    // disable all buttons
    answerButtons.forEach(btn => {
      const bg = btn.list[0] as Phaser.GameObjects.Rectangle;
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

    const feedbackColor = isCorrect ? '#27ae60' : '#e74c3c';
    const feedbackText = isCorrect ? 'Correct!' : 'Incorrect';

    panel.setFillStyle(isCorrect ? 0x27ae60 : 0xe74c3c);

    const feedback = this.add.text(640, 520, `${feedbackText} +${goldEarned} Gold`, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // close popup after delay
    this.time.delayedCall(2000, () => {
      overlay.destroy();
      panel.destroy();
      questionText.destroy();
      answerButtons.forEach(btn => btn.destroy());
      feedback.destroy();
      this.questionPopup?.destroy();
      this.waitingForQuestion = false;
      this.gameStarted = true;
      this.currentQuestionIndex++;
    });
  }

  updateTowerSelection() {
    // reset all buttons
    this.basicTowerBtn.setStrokeStyle(0);
    this.sniperTowerBtn.setStrokeStyle(0);
    this.meleeTowerBtn.setStrokeStyle(0);

    // highlight selected
    if (this.selectedTowerType === 'basic') {
      this.basicTowerBtn.setStrokeStyle(4, 0xffffff);
    } else if (this.selectedTowerType === 'sniper') {
      this.sniperTowerBtn.setStrokeStyle(4, 0xffffff);
    } else if (this.selectedTowerType === 'melee') {
      this.meleeTowerBtn.setStrokeStyle(4, 0xffffff);
    }
    // If null, no button is highlighted
  }

  startWave() {
    if (this.waveActive) return;
    this.waveActive = true;
    this.waveNumber++;
    // formula: 5 + (1.25 * wave) rounded to integer
    this.enemiesToSpawn = Math.floor(5 + (1.25 * this.waveNumber));
    this.enemySpawnTimer = 0;
    this.updateWaveButton();
    this.waveCounterText.setText(`Round ${this.waveNumber}`);
  }

  toggleGameSpeed() {
    if (this.gameSpeed === 1) {
      this.gameSpeed = 2;
    } else {
      this.gameSpeed = 1;
    }
    this.updateWaveButton();
  }

  updateWaveButton() {
    if (this.waveActive) {
      // During wave, show speed control
      if (this.gameSpeed === 1) {
        this.waveButtonText.setText('Speed Up (2x)');
      } else {
        this.waveButtonText.setText('Slow Down (1x)');
      }
    } else {
      // Between waves, show start wave button
      this.waveButtonText.setText(`Start Wave ${this.waveNumber + 1}`);
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
    const enemiesSpawned = Math.floor(5 + (1.25 * this.waveNumber)) - this.enemiesToSpawn;
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
      // Regular enemy spawn - probability based on wave number
      const rand = Math.random();

      if (this.waveNumber < 3) {
        // Waves 1-2: Only red
        type = EnemyType.RED;
      } else if (this.waveNumber < 6) {
        // Waves 3-5: 70% red, 30% blue
        type = rand < 0.7 ? EnemyType.RED : EnemyType.BLUE;
      } else {
        // Wave 6+: 50% red, 30% blue, 20% yellow
        if (rand < 0.5) type = EnemyType.RED;
        else if (rand < 0.8) type = EnemyType.BLUE;
        else type = EnemyType.YELLOW;
      }

      // Set stats based on enemy type
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
      size: size
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
    if (!this.gameStarted) return;

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

    // Enemy spawning (one every 800ms while wave active)
    if (this.waveActive && this.enemiesToSpawn > 0) {
      this.enemySpawnTimer += scaledDelta;
      if (this.enemySpawnTimer > 800) {
        this.spawnEnemy();
        this.enemiesToSpawn--;
        this.enemySpawnTimer = 0;
      }
    }

    // Wave completion: all enemies spawned and killed
    if (this.waveActive && this.enemiesToSpawn === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      this.gameSpeed = 1; // Reset to 1x speed
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

    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
    const text = this.add.text(640, 360, 'GAME OVER!', {
      fontSize: '64px',
      color: '#ff0000',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const waveText = this.add.text(640, 440, `You survived ${this.waveNumber} waves!`, {
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

    // Add thick black border to newly selected tower (6px for better visibility)
    this.selectedTower.graphics.setStrokeStyle(6, 0x000000);

    this.showUpgradeUI();
  }

  showUpgradeUI() {
    // Destroy existing upgrade UI
    if (this.upgradeContainer) {
      this.upgradeContainer.destroy();
    }

    if (!this.selectedTower) return;

    const elements: Phaser.GameObjects.GameObject[] = [];
    this.upgradeButtons = [];
    const upgradeY = 610;
    const UPGRADE_COST = 15;

    // Ballista (basic) upgrades: DOT and Fire Rate
    if (this.selectedTower.type === 'basic') {
      // DOT upgrade box
      const dotPurchased = this.selectedTower.upgrades.dotArrows;
      const canAffordDot = this.gold >= UPGRADE_COST;
      const dotBox = this.add.rectangle(1150, upgradeY, 60, 50, dotPurchased ? 0x27ae60 : (canAffordDot ? 0x27ae60 : 0x555555));
      if (!dotPurchased) {
        dotBox.setInteractive({ useHandCursor: true });
        dotBox.on('pointerdown', () => this.purchaseUpgrade('dotArrows'));
      }
      const dotText = this.add.text(1150, upgradeY - 12, 'DOT', { fontSize: '10px', color: '#fff', fontFamily: 'Quicksand, sans-serif', fontStyle: 'bold' }).setOrigin(0.5);

      if (dotPurchased) {
        const checkmark = this.add.image(1150, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(dotBox, dotText, checkmark);
      } else {
        const dotCost = this.add.text(1150, upgradeY + 8, '15g', { fontSize: '9px', color: '#fff', fontFamily: 'Quicksand, sans-serif' }).setOrigin(0.5);
        elements.push(dotBox, dotText, dotCost);
        this.upgradeButtons.push(dotBox);
      }

      // Fire rate upgrade box
      const firePurchased = this.selectedTower.upgrades.fasterFireRate;
      const canAffordFire = this.gold >= UPGRADE_COST;
      const fireBox = this.add.rectangle(1210, upgradeY, 60, 50, firePurchased ? 0x27ae60 : (canAffordFire ? 0x27ae60 : 0x555555));
      if (!firePurchased) {
        fireBox.setInteractive({ useHandCursor: true });
        fireBox.on('pointerdown', () => this.purchaseUpgrade('fasterFireRate'));
      }
      const fireText = this.add.text(1210, upgradeY - 12, 'Fire+', { fontSize: '10px', color: '#fff', fontFamily: 'Quicksand, sans-serif', fontStyle: 'bold' }).setOrigin(0.5);

      if (firePurchased) {
        const checkmark = this.add.image(1210, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(fireBox, fireText, checkmark);
      } else {
        const fireCost = this.add.text(1210, upgradeY + 8, '15g', { fontSize: '9px', color: '#fff', fontFamily: 'Quicksand, sans-serif' }).setOrigin(0.5);
        elements.push(fireBox, fireText, fireCost);
        this.upgradeButtons.push(fireBox);
      }
    }

    // Trebuchet (sniper) upgrade: Explosive
    if (this.selectedTower.type === 'sniper') {
      const explosivePurchased = this.selectedTower.upgrades.explosive;
      const canAffordExplosive = this.gold >= UPGRADE_COST;
      const explosiveBox = this.add.rectangle(1180, upgradeY, 80, 50, explosivePurchased ? 0x27ae60 : (canAffordExplosive ? 0x27ae60 : 0x555555));
      if (!explosivePurchased) {
        explosiveBox.setInteractive({ useHandCursor: true });
        explosiveBox.on('pointerdown', () => this.purchaseUpgrade('explosive'));
      }
      const explosiveText = this.add.text(1180, upgradeY - 12, 'Explosive', { fontSize: '10px', color: '#fff', fontFamily: 'Quicksand, sans-serif', fontStyle: 'bold' }).setOrigin(0.5);

      if (explosivePurchased) {
        const checkmark = this.add.image(1180, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(explosiveBox, explosiveText, checkmark);
      } else {
        const explosiveCost = this.add.text(1180, upgradeY + 8, '15g', { fontSize: '9px', color: '#fff', fontFamily: 'Quicksand, sans-serif' }).setOrigin(0.5);
        elements.push(explosiveBox, explosiveText, explosiveCost);
        this.upgradeButtons.push(explosiveBox);
      }
    }

    // Melee upgrade: Damage
    if (this.selectedTower.type === 'melee') {
      const damagePurchased = this.selectedTower.upgrades.moreDamage;
      const canAffordDamage = this.gold >= UPGRADE_COST;
      const damageBox = this.add.rectangle(1180, upgradeY, 80, 50, damagePurchased ? 0x27ae60 : (canAffordDamage ? 0x27ae60 : 0x555555));
      if (!damagePurchased) {
        damageBox.setInteractive({ useHandCursor: true });
        damageBox.on('pointerdown', () => this.purchaseUpgrade('moreDamage'));
      }
      const damageText = this.add.text(1180, upgradeY - 12, 'Damage+', { fontSize: '10px', color: '#fff', fontFamily: 'Quicksand, sans-serif', fontStyle: 'bold' }).setOrigin(0.5);

      if (damagePurchased) {
        const checkmark = this.add.image(1180, upgradeY + 8, 'checkmark').setScale(0.8);
        elements.push(damageBox, damageText, checkmark);
      } else {
        const damageCost = this.add.text(1180, upgradeY + 8, '15g', { fontSize: '9px', color: '#fff', fontFamily: 'Quicksand, sans-serif' }).setOrigin(0.5);
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

    // Update all unpurchased upgrade button colors
    this.upgradeButtons.forEach(button => {
      button.setFillStyle(canAfford ? 0x27ae60 : 0x555555);
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
      if (this.bossAnsweredCorrectly[i] === false) {
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

    // Popup dimensions (15% smaller than regular quiz popup)
    const panelWidth = 680;
    const panelHeight = 238;
    const panelX = 640;
    const panelY = 600;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.3);

    // Panel background
    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x2c3e50);
    panel.setStrokeStyle(4, 0xff6600); // Orange border for warning

    // Warning label
    const warningText = this.add.text(panelX, panelY - 93, 'ANSWER BUT BEWARE!', {
      fontSize: '20px',
      color: '#ff6600',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Timer display
    const timerText = this.add.text(panelX, panelY - 68, 'Time: 30s', {
      fontSize: '15px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Question text
    const questionText = this.add.text(panelX, panelY - 43, question.question, {
      fontSize: '15px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - 40 }
    }).setOrigin(0.5);

    const answerButtons: Phaser.GameObjects.Container[] = [];

    // Create answer buttons (2x2 grid)
    question.options.forEach((option, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const xPos = panelX - 153 + (col * 306); // Adjusted for smaller panel
      const yPos = panelY + 17 + (row * 51); // Adjusted for smaller panel
      const isCorrect = option === question.answer;

      const btnBg = this.add.rectangle(xPos, yPos, 289, 43, 0x34495e); // 340 * 0.85, 50 * 0.85
      btnBg.setInteractive({ useHandCursor: true });

      const btnText = this.add.text(xPos, yPos, option, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: 272 } // 320 * 0.85
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
