import Phaser from 'phaser';
import { Quiz, QuizQuestion } from '@/lib/processors/ai-generator';

// enemy types with different health and speed
enum EnemyType {
  RED = 'RED',
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
}

interface Enemy {
  x: number;
  y: number;
  speed: number;
  health: number;
  maxHealth: number;
  type: EnemyType;
  pathIndex: number;
  graphics: Phaser.GameObjects.Graphics;
}

interface Tower {
  x: number;
  y: number;
  range: number;
  fireRate: number;
  damage: number;
  cost: number;
  lastFired: number;
  type: 'basic' | 'sniper' | 'melee';
  graphics: Phaser.GameObjects.Rectangle;
}

interface Projectile {
  x: number;
  y: number;
  target: Enemy;
  graphics: Phaser.GameObjects.Graphics;
}

interface PathPoint {
  x: number;
  y: number;
}

// tower defense scene with educational quiz integration
export default class TowerDefenseScene extends Phaser.Scene {
  private towers: Tower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private pathPoints: PathPoint[] = [];
  private enemySpawnTimer: number = 0;
  private selectedTowerType: 'basic' | 'sniper' | 'melee' = 'basic';
  private waveActive: boolean = false;
  private waveNumber: number = 0;
  private enemiesToSpawn: number = 0;
  private lives: number = 10;
  private gold: number = 0;
  private gameStarted: boolean = false;

  // Quiz data
  private quizData!: Quiz;
  private currentQuestionIndex: number = 0;
  private waitingForQuestion: boolean = false;

  // UI elements
  private waveButtonText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private basicTowerBtn!: Phaser.GameObjects.Rectangle;
  private sniperTowerBtn!: Phaser.GameObjects.Rectangle;
  private meleeTowerBtn!: Phaser.GameObjects.Rectangle;
  private startGameButton?: Phaser.GameObjects.Container;
  private questionPopup?: Phaser.GameObjects.Container;
  private errorMessage?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TowerDefenseScene' });
  }

  init(data: { quiz: Quiz }) {
    this.quizData = data.quiz;
  }

  preload() {
    // no assets needed
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
        this.startWave();
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

    // basic tower button (50 gold)
    this.basicTowerBtn = this.add.rectangle(1180, 220, 160, 80, 0x3498db);
    this.basicTowerBtn.setInteractive({ useHandCursor: true });
    this.basicTowerBtn.setStrokeStyle(4, 0xffffff);

    this.add.text(1180, 210, 'Basic Tower', {
      fontSize: '16px',
      color: '#fff',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);
    this.add.text(1180, 235, 'Fast Fire - 50g', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    this.basicTowerBtn.on('pointerdown', () => {
      this.selectedTowerType = 'basic';
      this.updateTowerSelection();
    });

    // sniper/long range tower button (75 gold)
    this.sniperTowerBtn = this.add.rectangle(1180, 330, 160, 80, 0xff9800);
    this.sniperTowerBtn.setInteractive({ useHandCursor: true });

    this.add.text(1180, 320, 'Long Range', {
      fontSize: '16px',
      color: '#fff',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);
    this.add.text(1180, 345, 'Slow Fire - 75g', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    this.sniperTowerBtn.on('pointerdown', () => {
      this.selectedTowerType = 'sniper';
      this.updateTowerSelection();
    });

    // melee tower button (25 gold)
    this.meleeTowerBtn = this.add.rectangle(1180, 440, 160, 80, 0xf44336);
    this.meleeTowerBtn.setInteractive({ useHandCursor: true });

    this.add.text(1180, 430, 'Melee Tower', {
      fontSize: '16px',
      color: '#fff',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);
    this.add.text(1180, 455, 'Rapid Fire - 25g', {
      fontSize: '12px',
      color: '#ecf0f1',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    this.meleeTowerBtn.on('pointerdown', () => {
      this.selectedTowerType = 'melee';
      this.updateTowerSelection();
    });

    this.updateTowerSelection();

    // enable click to place towers
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
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
    } else {
      this.meleeTowerBtn.setStrokeStyle(4, 0xffffff);
    }
  }

  startWave() {
    if (this.waveActive) return;
    this.waveActive = true;
    this.waveNumber++;
    // formula: 5 + (1.25 * wave) rounded to integer
    this.enemiesToSpawn = Math.floor(5 + (1.25 * this.waveNumber));
    this.enemySpawnTimer = 0;
    this.waveButtonText.setText(`Wave ${this.waveNumber}`);
  }

  placeTower(x: number, y: number) {
    if (!this.gameStarted) return;

    // don't place in UI area
    if (x > 1080) return;

    // don't place on path
    const tooClose = this.pathPoints.some((point, i) => {
      if (i === 0) return false;
      const prev = this.pathPoints[i - 1];
      const distToSegment = this.pointToSegmentDistance(x, y, prev.x, prev.y, point.x, point.y);
      return distToSegment < 40;
    });

    if (tooClose) return;

    // tower stats based on type
    let towerStats: { color: number; range: number; fireRate: number; damage: number; cost: number };
    if (this.selectedTowerType === 'basic') {
      towerStats = {
        color: 0x3498db,
        range: 150,
        fireRate: 500,
        damage: 12.5,
        cost: 50
      };
    } else if (this.selectedTowerType === 'sniper') {
      towerStats = {
        color: 0xff9800,
        range: 300,
        fireRate: 2000,
        damage: 50,
        cost: 75
      };
    } else { // melee
      towerStats = {
        color: 0xf44336,
        range: 60,
        fireRate: 100,
        damage: 8,
        cost: 25
      };
    }

    // check if player has enough gold
    if (this.gold < towerStats.cost) {
      this.showErrorMessage('Not enough gold!');
      return;
    }

    // deduct gold
    this.gold -= towerStats.cost;
    this.goldText.setText(`Gold: ${this.gold}`);

    const tower: Tower = {
      x: x,
      y: y,
      range: towerStats.range,
      fireRate: towerStats.fireRate,
      damage: towerStats.damage,
      cost: towerStats.cost,
      lastFired: 0,
      type: this.selectedTowerType,
      graphics: this.add.rectangle(x, y, 40, 40, towerStats.color)
    };

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

  spawnEnemy() {
    const startPoint = this.pathPoints[0];

    // determine enemy type based on wave
    let type: EnemyType;
    let health: number;
    let speed: number;
    let color: number;

    const rand = Math.random();

    if (this.waveNumber < 3) {
      type = EnemyType.RED;
    } else if (this.waveNumber < 6) {
      type = rand < 0.7 ? EnemyType.RED : EnemyType.BLUE;
    } else {
      if (rand < 0.5) type = EnemyType.RED;
      else if (rand < 0.8) type = EnemyType.BLUE;
      else type = EnemyType.YELLOW;
    }

    // set stats based on type
    if (type === EnemyType.RED) {
      health = 25;
      speed = 50;
      color = 0xff0000;
    } else if (type === EnemyType.BLUE) {
      health = 50;
      speed = 55; // 10% faster than red
      color = 0x0000ff;
    } else {
      health = 75;
      speed = 60.5; // 10% faster than blue
      color = 0xffff00;
    }

    // create triangle graphics (don't destroy, keep for rendering)
    const graphics = this.add.graphics();
    graphics.fillStyle(color);
    graphics.beginPath();
    // draw triangle centered at origin, pointing up
    graphics.moveTo(0, -15);
    graphics.lineTo(15, 10);
    graphics.lineTo(-15, 10);
    graphics.closePath();
    graphics.fillPath();
    graphics.setPosition(startPoint.x, startPoint.y);

    const enemy: Enemy = {
      x: startPoint.x,
      y: startPoint.y,
      speed: speed,
      health: health,
      maxHealth: health,
      type: type,
      pathIndex: 1,
      graphics: graphics
    };

    this.enemies.push(enemy);
  }

  update(time: number, delta: number) {
    if (!this.gameStarted) return;

    // spawn enemies if wave is active
    if (this.waveActive && this.enemiesToSpawn > 0) {
      this.enemySpawnTimer += delta;
      if (this.enemySpawnTimer > 800) {
        this.spawnEnemy();
        this.enemiesToSpawn--;
        this.enemySpawnTimer = 0;
      }
    }

    // check wave completion
    if (this.waveActive && this.enemiesToSpawn === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      this.waveButtonText.setText(`Start Wave ${this.waveNumber + 1}`);
      // show question after wave ends
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
        // move towards waypoint
        enemy.x += (dx / dist) * enemy.speed * delta / 1000;
        enemy.y += (dy / dist) * enemy.speed * delta / 1000;

        // rotate triangle to face direction
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        enemy.graphics.setRotation(angle);
      }

      enemy.graphics.setPosition(enemy.x, enemy.y);

      // remove if dead
      if (enemy.health <= 0) {
        enemy.graphics.destroy();
        this.enemies.splice(i, 1);
      }
    }

    // update towers (shooting)
    this.towers.forEach(tower => {
      if (time - tower.lastFired > tower.fireRate) {
        const target = this.findClosestEnemy(tower);
        if (target) {
          if (tower.type === 'melee') {
            // melee is hitscan (instant damage)
            target.health -= tower.damage;
          } else {
            // create projectile
            this.shootProjectile(tower, target);
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
        // hit target
        proj.target.health -= this.towers.find(t => t.graphics.x === proj.graphics.getData('sourceX'))?.damage || 0;
        proj.graphics.destroy();
        this.projectiles.splice(i, 1);
      } else {
        // move towards target
        const speed = 400;
        proj.x += (dx / dist) * speed * delta / 1000;
        proj.y += (dy / dist) * speed * delta / 1000;
        proj.graphics.setPosition(proj.x, proj.y);
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

  shootProjectile(tower: Tower, target: Enemy) {
    const projGraphics = this.add.graphics();
    projGraphics.fillStyle(0xf39c12);
    projGraphics.fillCircle(0, 0, 6);
    projGraphics.setPosition(tower.x, tower.y);
    projGraphics.setData('sourceX', tower.graphics.x);
    projGraphics.setData('damage', tower.damage);

    const proj: Projectile = {
      x: tower.x,
      y: tower.y,
      target: target,
      graphics: projGraphics
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
}
