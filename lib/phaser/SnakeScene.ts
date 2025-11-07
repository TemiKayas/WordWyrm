import * as Phaser from 'phaser';
import { Quiz, QuizQuestion } from '@/lib/processors/ai-generator';

// Grid position
interface GridPosition {
  x: number;
  y: number;
}

// Direction enum
enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

// Apple with color
interface Apple {
  position: GridPosition;
  color: number;
  answerIndex: number; // Which answer this apple corresponds to (0-3)
  graphics: Phaser.GameObjects.Rectangle;
}

// Answer colors (red, green, yellow, blue)
const ANSWER_COLORS = [
  0xff0000, // Red (A)
  0x00ff00, // Green (B)
  0xffff00, // Yellow (C)
  0x0000ff  // Blue (D)
];

export default class SnakeScene extends Phaser.Scene {
  // Grid settings
  private GRID_SIZE!: number; // Size of each cell in pixels (dynamic)
  private gridWidth!: number;
  private gridHeight!: number;
  private baseGridSize = 10; // Base grid size for calculation
  private gameOffsetX = 0; // X offset for centered game area
  private gameOffsetY = 0; // Y offset for centered game area

  // Snake state
  private snake: GridPosition[] = [];
  private direction: Direction = Direction.RIGHT;
  private nextDirection: Direction = Direction.RIGHT;

  // Apples
  private apples: Apple[] = [];

  // Game state
  private gameStarted = false;
  private gamePaused = false;
  private gameOver = false;
  private isPausedForQuestion = false;

  // Quiz data
  private quizData!: Quiz;
  private currentQuestionIndex = 0;
  private currentQuestion?: QuizQuestion;

  // Timing
  private lastMoveTime = 0;
  private moveDelay = 150; // ms between moves

  // Graphics
  private snakeGraphics: Phaser.GameObjects.Rectangle[] = [];

  // UI Elements
  private questionPanel?: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({ key: 'SnakeScene' });
  }

  init(data: { quiz: Quiz }) {
    this.quizData = data.quiz;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Calculate playable area (left side, excluding question panel)
    const panelWidth = 400;
    const availableWidth = width - panelWidth;

    // Make game area square
    const gameSize = Math.min(availableWidth, height);
    const gameWidth = gameSize;
    const gameHeight = gameSize;

    // Calculate grid dimensions based on number of questions
    // More questions = larger grid (more cells) for more challenge
    const numQuestions = this.quizData.questions.length;
    const gridMultiplier = Math.max(1, Math.min(numQuestions / 3, 2)); // Scale between 1x and 2x
    this.gridWidth = Math.floor(this.baseGridSize * gridMultiplier);
    this.gridHeight = Math.floor(this.baseGridSize * gridMultiplier);

    // Ensure minimum grid size
    this.gridWidth = Math.max(12, this.gridWidth);
    this.gridHeight = Math.max(12, this.gridHeight);

    // Calculate cell size to fill the square game area
    this.GRID_SIZE = Math.floor(gameSize / Math.max(this.gridWidth, this.gridHeight));

    // Setup background - full left area
    this.add.rectangle(0, 0, availableWidth, height, 0x1a1a1a).setOrigin(0, 0);

    // Game area background (square, centered)
    this.gameOffsetX = (availableWidth - gameWidth) / 2;
    this.gameOffsetY = (height - gameHeight) / 2;
    this.add.rectangle(this.gameOffsetX, this.gameOffsetY, gameWidth, gameHeight, 0x2d3436).setOrigin(0, 0);

    // Draw grid
    this.drawGrid(this.gameOffsetX, this.gameOffsetY);

    // Setup question panel
    this.createQuestionPanel(availableWidth, panelWidth, height);

    // Initialize snake in center
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    this.snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY }
    ];

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    // Exit button (top left)
    const exitButton = this.add.rectangle(70, 30, 120, 40, 0xff4444);
    exitButton.setInteractive({ useHandCursor: true });
    const exitText = this.add.text(70, 30, 'Exit', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    exitButton.on('pointerdown', () => {
      // Navigate back
      if (typeof window !== 'undefined') {
        window.history.back();
      }
    });

    exitButton.on('pointerover', () => {
      exitButton.setFillStyle(0xcc3333);
    });

    exitButton.on('pointerout', () => {
      exitButton.setFillStyle(0xff4444);
    });

    // Score display (top right of left panel area)
    this.scoreText = this.add.text(availableWidth - 20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // Draw initial snake
    this.drawSnake();

    // Start first question
    this.showQuestion();
  }

  drawGrid(offsetX: number, offsetY: number) {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x636e72, 0.2);

    // Calculate actual playable grid size
    const actualGridWidth = this.gridWidth * this.GRID_SIZE;
    const actualGridHeight = this.gridHeight * this.GRID_SIZE;

    // Vertical lines
    for (let x = 0; x <= actualGridWidth; x += this.GRID_SIZE) {
      grid.lineBetween(offsetX + x, offsetY, offsetX + x, offsetY + actualGridHeight);
    }

    // Horizontal lines
    for (let y = 0; y <= actualGridHeight; y += this.GRID_SIZE) {
      grid.lineBetween(offsetX, offsetY + y, offsetX + actualGridWidth, offsetY + y);
    }
  }

  createQuestionPanel(leftAreaWidth: number, panelWidth: number, height: number) {
    // Panel starts after the left area
    const panelStartX = leftAreaWidth;

    // Panel background
    const panel = this.add.rectangle(
      panelStartX + panelWidth / 2,
      height / 2,
      panelWidth,
      height,
      0xfffaf2
    );

    // Title
    this.add.text(panelStartX + panelWidth / 2, 40, 'SNAKE QUIZ', {
      fontSize: '28px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(
      panelStartX + 20,
      100,
      'Eat the apple matching\nthe correct answer!',
      {
        fontSize: '16px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: panelWidth - 40 }
      }
    );
    instructions.x = panelStartX + panelWidth / 2 - instructions.width / 2;
  }

  showQuestion() {
    if (this.currentQuestionIndex >= this.quizData.questions.length) {
      this.winGame();
      return;
    }

    this.isPausedForQuestion = true;
    this.currentQuestion = this.quizData.questions[this.currentQuestionIndex];

    // Clear existing question UI
    if (this.questionPanel) {
      this.questionPanel.destroy();
    }

    // Clear existing apples
    this.apples.forEach(apple => apple.graphics.destroy());
    this.apples = [];

    const width = this.scale.width;
    const height = this.scale.height;
    const panelWidth = 400;
    const leftAreaWidth = width - panelWidth;
    const panelStartX = leftAreaWidth;

    const elements: Phaser.GameObjects.GameObject[] = [];

    // Question number
    const questionNum = this.add.text(
      panelStartX + panelWidth / 2,
      160,
      `Question ${this.currentQuestionIndex + 1}/${this.quizData.questions.length}`,
      {
        fontSize: '14px',
        color: '#95b607',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    elements.push(questionNum);

    // Question text
    const questionText = this.add.text(
      panelStartX + panelWidth / 2,
      200,
      this.currentQuestion.question,
      {
        fontSize: '18px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'left',
        wordWrap: { width: panelWidth - 40 }
      }
    ).setOrigin(0.5, 0);
    elements.push(questionText);

    // Answer options with colored squares
    const startY = 280;
    const optionHeight = 60;

    this.currentQuestion.options.forEach((option, index) => {
      const yPos = startY + (index * optionHeight);

      // Color indicator square
      const colorBox = this.add.rectangle(
        panelStartX + 30,
        yPos,
        30,
        30,
        ANSWER_COLORS[index]
      );

      // Answer letter
      const letter = this.add.text(
        panelStartX + 70,
        yPos,
        String.fromCharCode(65 + index) + ')',
        {
          fontSize: '16px',
          color: '#473025',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0, 0.5);

      // Answer text
      const answerText = this.add.text(
        panelStartX + 100,
        yPos,
        option,
        {
          fontSize: '14px',
          color: '#473025',
          fontFamily: 'Quicksand, sans-serif',
          wordWrap: { width: panelWidth - 120 }
        }
      ).setOrigin(0, 0.5);

      elements.push(colorBox, letter, answerText);
    });

    // 5-second countdown
    const countdownText = this.add.text(
      panelStartX + panelWidth / 2,
      520,
      'Game starts in: 5',
      {
        fontSize: '20px',
        color: '#95b607',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    elements.push(countdownText);

    this.questionPanel = this.add.container(0, 0, elements);

    // Add pause overlay
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const panel = 400;
    const available = screenWidth - panel;
    const size = Math.min(available, screenHeight);

    const pauseOverlay = this.add.rectangle(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      size,
      size,
      0x000000,
      0.6
    ).setDepth(1000); // High depth to always be on top

    const pauseText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      'PAUSED\nRead the question!',
      {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(1001); // Even higher depth than overlay

    // Countdown timer
    let countdown = 5;
    const timer = this.time.addEvent({
      delay: 1000,
      repeat: 4,
      callback: () => {
        countdown--;
        if (countdown > 0) {
          countdownText.setText(`Game starts in: ${countdown}`);
        } else {
          countdownText.setText('GO!');
          // Remove pause overlay
          pauseOverlay.destroy();
          pauseText.destroy();
          this.time.delayedCall(500, () => {
            this.startRound();
          });
        }
      }
    });
  }

  startRound() {
    this.isPausedForQuestion = false;
    this.gameStarted = true;

    // Spawn colored apples
    this.spawnApples();
  }

  spawnApples() {
    // Spawn one apple for each answer option
    this.currentQuestion!.options.forEach((_, index) => {
      let position: GridPosition;
      let attempts = 0;

      // Find valid position (not on snake, other apples, or too close to snake head)
      do {
        position = {
          x: Math.floor(Math.random() * this.gridWidth),
          y: Math.floor(Math.random() * this.gridHeight)
        };
        attempts++;
      } while (
        (this.isPositionOnSnake(position) ||
         this.isPositionOnApple(position) ||
         this.isTooCloseToSnakeHead(position)) &&
        attempts < 100
      );

      // Create apple graphics
      const graphics = this.add.rectangle(
        this.gameOffsetX + position.x * this.GRID_SIZE + this.GRID_SIZE / 2,
        this.gameOffsetY + position.y * this.GRID_SIZE + this.GRID_SIZE / 2,
        this.GRID_SIZE - 4,
        this.GRID_SIZE - 4,
        ANSWER_COLORS[index]
      );

      this.apples.push({
        position,
        color: ANSWER_COLORS[index],
        answerIndex: index,
        graphics
      });
    });
  }

  drawSnake() {
    // Clear previous snake graphics
    this.snakeGraphics.forEach(g => g.destroy());
    this.snakeGraphics = [];

    // Draw each segment in dark green
    this.snake.forEach((segment) => {
      const rect = this.add.rectangle(
        this.gameOffsetX + segment.x * this.GRID_SIZE + this.GRID_SIZE / 2,
        this.gameOffsetY + segment.y * this.GRID_SIZE + this.GRID_SIZE / 2,
        this.GRID_SIZE - 2,
        this.GRID_SIZE - 2,
        0x006400 // Dark green
      );
      this.snakeGraphics.push(rect);
    });
  }

  update(time: number, delta: number) {
    if (!this.gameStarted || this.gamePaused || this.gameOver || this.isPausedForQuestion) {
      return;
    }

    // Handle input
    this.handleInput();

    // Move snake at intervals
    if (time - this.lastMoveTime > this.moveDelay) {
      this.moveSnake();
      this.lastMoveTime = time;
    }
  }

  handleInput() {
    // Update direction based on input (prevent 180-degree turns)
    if ((this.cursors.up.isDown || this.wasdKeys.W.isDown) && this.direction !== Direction.DOWN) {
      this.nextDirection = Direction.UP;
    } else if ((this.cursors.down.isDown || this.wasdKeys.S.isDown) && this.direction !== Direction.UP) {
      this.nextDirection = Direction.DOWN;
    } else if ((this.cursors.left.isDown || this.wasdKeys.A.isDown) && this.direction !== Direction.RIGHT) {
      this.nextDirection = Direction.LEFT;
    } else if ((this.cursors.right.isDown || this.wasdKeys.D.isDown) && this.direction !== Direction.LEFT) {
      this.nextDirection = Direction.RIGHT;
    }
  }

  moveSnake() {
    // Apply direction change
    this.direction = this.nextDirection;

    // Calculate new head position
    const head = this.snake[0];
    let newHead: GridPosition;

    switch (this.direction) {
      case Direction.UP:
        newHead = { x: head.x, y: head.y - 1 };
        break;
      case Direction.DOWN:
        newHead = { x: head.x, y: head.y + 1 };
        break;
      case Direction.LEFT:
        newHead = { x: head.x - 1, y: head.y };
        break;
      case Direction.RIGHT:
        newHead = { x: head.x + 1, y: head.y };
        break;
    }

    // Check wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= this.gridWidth ||
      newHead.y < 0 ||
      newHead.y >= this.gridHeight
    ) {
      this.endGame('Hit the wall!');
      return;
    }

    // Check self collision
    if (this.isPositionOnSnake(newHead)) {
      this.endGame('Hit yourself!');
      return;
    }

    // Check apple collision
    const eatenApple = this.apples.find(apple =>
      apple.position.x === newHead.x && apple.position.y === newHead.y
    );

    if (eatenApple) {
      // Check if correct answer
      const correctAnswerIndex = this.currentQuestion!.options.indexOf(
        this.currentQuestion!.answer
      );

      if (eatenApple.answerIndex === correctAnswerIndex) {
        // Correct answer!
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);

        // Add new head (snake grows)
        this.snake.unshift(newHead);

        // Remove eaten apple
        eatenApple.graphics.destroy();
        this.apples = this.apples.filter(a => a !== eatenApple);

        // Next question
        this.currentQuestionIndex++;
        this.gameStarted = false;
        this.showQuestion();
      } else {
        // Wrong answer!
        this.endGame(`Wrong answer! Correct: ${this.currentQuestion!.answer}`);
      }
    } else {
      // Normal movement (no apple eaten)
      this.snake.unshift(newHead);
      this.snake.pop(); // Remove tail
    }

    // Redraw snake
    this.drawSnake();
  }

  isPositionOnSnake(pos: GridPosition): boolean {
    return this.snake.some(segment => segment.x === pos.x && segment.y === pos.y);
  }

  isPositionOnApple(pos: GridPosition): boolean {
    return this.apples.some(apple => apple.position.x === pos.x && apple.position.y === pos.y);
  }

  isTooCloseToSnakeHead(pos: GridPosition): boolean {
    // Don't spawn apples within 3 cells of the snake's head
    const head = this.snake[0];
    const distance = Math.abs(pos.x - head.x) + Math.abs(pos.y - head.y); // Manhattan distance
    return distance < 3;
  }

  endGame(reason: string) {
    this.gameOver = true;

    const width = this.scale.width;
    const height = this.scale.height;

    // Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Game Over text
    this.add.text(width / 2, height / 2 - 80, 'GAME OVER!', {
      fontSize: '64px',
      color: '#ff6b6b',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Reason
    this.add.text(width / 2, height / 2, reason, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    // Final score
    this.add.text(width / 2, height / 2 + 60, `Final Score: ${this.score}`, {
      fontSize: '32px',
      color: '#95b607',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  winGame() {
    this.gameOver = true;

    const width = this.scale.width;
    const height = this.scale.height;

    // Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Victory text
    this.add.text(width / 2, height / 2 - 80, 'YOU WIN!', {
      fontSize: '64px',
      color: '#00b894',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Completion message
    this.add.text(width / 2, height / 2, 'All questions answered correctly!', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif'
    }).setOrigin(0.5);

    // Final score
    this.add.text(width / 2, height / 2 + 60, `Final Score: ${this.score}`, {
      fontSize: '32px',
      color: '#95b607',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }
}
