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
  graphics: Phaser.GameObjects.Image;
}

// Answer colors (red, green, yellow, blue) - kept for compatibility
const ANSWER_COLORS = [
  0xff0000, // Red (A)
  0x00ff00, // Green (B)
  0xffff00, // Yellow (C)
  0x0000ff  // Blue (D)
];

// Fruit sprites mapping to answer colors
const FRUIT_SPRITES = [
  'fruit-apple',   // A - Red
  'fruit-grape',   // B - Green (using grape for green)
  'fruit-banana',  // C - Yellow
  'fruit-orange'   // D - Blue (using orange)
];

// Game phases
enum GamePhase {
  MASTERY = 'MASTERY',   // Learning phase: recycle wrong answers until all correct
  ENDLESS = 'ENDLESS'    // Practice phase: infinite random questions
}

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
  private inputBuffer: Direction[] = []; // Buffer for queued inputs
  private lastTailPosition: GridPosition | null = null;

  // Apples
  private apples: Apple[] = [];

  // Game state
  private gameStarted = false;
  private gameOver = false;
  private isPausedForQuestion = false;

  // Quiz data
  private quizData!: Quiz;
  private originalQuizData!: Quiz; // Store original for reshuffling
  private currentQuestionIndex = 0;
  private currentQuestion?: QuizQuestion;
  private shuffledOptions: Array<{ option: string; originalIndex: number; color: number }> = [];

  // Timing
  private lastMoveTime = 0;
  private moveDelay = 130; // ms between moves

  // Graphics
  private snakeGraphics: Phaser.GameObjects.Image[] = [];

  // UI Elements
  private questionPanel?: Phaser.GameObjects.Container;
  private preQuestionModalContainer?: Phaser.GameObjects.Container;
  private readonly ANSWER_FRUITS_MAP: string[] = ['fruit-apple', 'fruit-banana', 'fruit-grape', 'fruit-orange'];
  private currentFruitMap: string[] = []; // Shuffled map for current question
  private scoreText!: Phaser.GameObjects.Text;
  private activeWarnings: Phaser.GameObjects.Text[] = []; // Track active collision warnings for stacking
  private streakText!: Phaser.GameObjects.Text;
  private scoreCoin!: Phaser.GameObjects.Image;
  private scoreBoxCenterX!: number; // Store the center position of score box
  private score = 0;
  private displayedScore = 0; // For smooth score animation
  private streak = 0; // Consecutive correct answers

  // ANALYTICS SYSTEM - Tracks longest streak for dashboard display
  private longestStreak = 0; // Highest streak achieved during this session

  private correctAnswers = 0; // Total correct answers
  private firstTryCorrectCount = 0; // Unique questions answered correctly on FIRST attempt only
  private scoreSaved: boolean = false; // Tracks if the current game session's score was successfully saved

  // ANALYTICS SYSTEM - Session tracking variables
  private gameId?: string; // Game ID for saving session (undefined in demo mode)
  private startTime = 0; // Timestamp when game started (for calculating time spent)

  // PHASE MANAGEMENT - Two-phase game system
  private gamePhase: GamePhase = GamePhase.MASTERY;
  private finalMasteryScore = 0; // Score captured at end of mastery phase (for leaderboard)
  private questionsAnsweredCorrectly = new Set<number>(); // Question indices answered correctly (at least once)
  private incorrectQuestionPool: number[] = []; // Questions answered wrong (need recycling)
  private endlessHighScore = 0; // Highest score reached in endless mode
  private masteryAttempts = 0; // Total answer attempts made during mastery phase (for accuracy calculation)

  // QUESTION ANALYTICS - Track ALL attempts at each question (not just final)
  private questionAttempts: Array<{
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    wasCorrect: boolean;
    attemptNumber: number; // Per-question attempt counter
  }> = [];

  // Per-question attempt counters (tracks how many times each question has been attempted)
  private attemptCounters: Record<number, number> = {};

  private exitButton!: Phaser.GameObjects.Image;
  private exitText!: Phaser.GameObjects.Text;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // Mobile support
  private isMobile = false;
  private swipeStartX = 0;
  private swipeStartY = 0;
  private isPausedForVisibility = false;
  private visibilityHandler?: () => void;

  // Notification popup
  private notificationPopup?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'SnakeScene' });
  }

  preload() {
    // Load grid tile sprites for checkerboard pattern
    this.load.image('grid-light', '/assets/snake/backgrounds/grid-light.png');
    this.load.image('grid-dark', '/assets/snake/backgrounds/grid-dark.png');
    // Load exit button background
    this.load.image('exit-bg', '/assets/snake/backgrounds/vector.png');
    // Load UI backgrounds
    this.load.image('score-box', '/assets/snake/backgrounds/ScoreBox.png');
    this.load.image('streak-box', '/assets/snake/backgrounds/Streakbox.png');
    // Load question panel background
    this.load.image('question-panel', '/assets/snake/ui/QuestionPanel.png');
    this.load.image('question-count', '/assets/snake/ui/QuestionCount.png');
    // Load popup UI
    this.load.image('popup', '/assets/snake/ui/popup.png');
    this.load.image('header', '/assets/snake/ui/Header.png');
    this.load.image('popup-button', '/assets/snake/ui/PopupButton.png');
    this.load.image('popup-button-orange', '/assets/snake/ui/PopupButtonOrange.png');
    this.load.image('popup-button-green-big', '/assets/snake/ui/BiggerPopupGreen.png');
    this.load.image('popup-button-orange-big', '/assets/snake/ui/BiggerPopupOrange.png');
    // Load control diagrams
    this.load.image('key', '/assets/snake/ui/Key.png');
    this.load.image('arrow-key', '/assets/snake/ui/ArrowKey.png');
    // Load snake sprites
    this.load.image('snake-head', '/assets/snake/sprites/Head.png');
    this.load.image('snake-body', '/assets/snake/sprites/Body.png');
    this.load.image('snake-corner', '/assets/snake/sprites/Corner Body.png');
    this.load.image('snake-tail', '/assets/snake/sprites/Tail.png');
    
    // UI Assets for Pre-Question Modal
    this.load.image('popup-bg', '/assets/snake/ui/popup.png');
    this.load.image('header-bg', '/assets/snake/ui/header.png');
    this.load.image('question-circle', '/assets/snake/ui/Question Circle.png');
    this.load.image('question-box', '/assets/snake/ui/QuestionBox.png');
    this.load.image('button-orange', '/assets/snake/ui/biggerpopupOrange.png');
    this.load.image('popup-button-base', '/assets/snake/ui/PopupButton.png'); // Load new button asset
    
    // Fruit Sprites
    this.load.image('fruit-apple', '/assets/snake/sprites/Apple.png');
    this.load.image('fruit-banana', '/assets/snake/sprites/Banana.png');
    this.load.image('fruit-grape', '/assets/snake/sprites/Grape.png');
    this.load.image('fruit-orange', '/assets/snake/sprites/Orange.png');
    
    // Coin Sprite (Bonus)
    this.load.image('coin', '/assets/snake/sprites/Coin.png');
  }

  init(data: { quiz: Quiz; gameId?: string }) {
    // ANALYTICS SYSTEM - Store game ID for session saving
    // gameId is passed from the play page through the SnakeGame component
    // If undefined, the game is in demo mode and won't save statistics
    this.gameId = data.gameId;

    // Store original quiz data with shuffled questions for variety
    const quizCopy = JSON.parse(JSON.stringify(data.quiz));
    quizCopy.questions = this.shuffleArray(quizCopy.questions);
    this.originalQuizData = quizCopy;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Detect mobile for responsive panel sizing
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Calculate playable area (left side, excluding question panel)
    // Use narrower panel on mobile devices for more game space
    // Panel takes 30% of width on mobile (min 240px, max 320px), or 400px on desktop
    let panelWidth = 400; // Desktop default
    if (this.isMobile && width < 1024) {
      panelWidth = Math.max(240, Math.min(320, width * 0.30));
    }
    const availableWidth = width - panelWidth;

    // Use full height instead of making it square
    const gameWidth = availableWidth;
    const gameHeight = height;

    // Calculate grid dimensions based on number of questions
    // More questions = larger grid (more cells) for more challenge
        const numQuestions = this.originalQuizData.questions.length;
    const gridMultiplier = Math.max(1, Math.min(numQuestions / 3, 2)); // Scale between 1x and 2x
    this.gridWidth = Math.floor(this.baseGridSize * gridMultiplier);
    this.gridHeight = Math.floor(this.baseGridSize * gridMultiplier);

    // Ensure minimum grid size
    this.gridWidth = Math.max(12, this.gridWidth);
    this.gridHeight = Math.max(12, this.gridHeight);

    // Calculate cell size to exactly fill height (no rounding gaps)
    this.GRID_SIZE = height / this.gridHeight;

    // Calculate actual grid dimensions
    const actualGridWidth = this.gridWidth * this.GRID_SIZE;
    const actualGridHeight = height; // Exactly full height

    // Setup background - full left area (cream color)
    this.add.rectangle(0, 0, availableWidth, height, 0xFFFAF2).setOrigin(0, 0);

    // Setup background - right panel area (cream color)
    this.add.rectangle(availableWidth, 0, panelWidth, height, 0xFFFAF2).setOrigin(0, 0);

    // Game area - horizontally centered, fills exact height
    this.gameOffsetX = (availableWidth - actualGridWidth) / 2;
    this.gameOffsetY = 0; // Start at top

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

    // Setup key press listeners for instant input buffering
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (!this.gameStarted || this.gameOver || this.isPausedForQuestion) return;

      const lastBufferedDirection = this.inputBuffer.length > 0
        ? this.inputBuffer[this.inputBuffer.length - 1]
        : this.direction;

      let newDirection: Direction | null = null;

      switch(event.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (lastBufferedDirection !== Direction.DOWN && lastBufferedDirection !== Direction.UP) {
            newDirection = Direction.UP;
          }
          break;
        case 'arrowdown':
        case 's':
          if (lastBufferedDirection !== Direction.UP && lastBufferedDirection !== Direction.DOWN) {
            newDirection = Direction.DOWN;
          }
          break;
        case 'arrowleft':
        case 'a':
          if (lastBufferedDirection !== Direction.RIGHT && lastBufferedDirection !== Direction.LEFT) {
            newDirection = Direction.LEFT;
          }
          break;
        case 'arrowright':
        case 'd':
          if (lastBufferedDirection !== Direction.LEFT && lastBufferedDirection !== Direction.RIGHT) {
            newDirection = Direction.RIGHT;
          }
          break;
      }

      if (newDirection !== null && this.inputBuffer.length < 2) {
        this.inputBuffer.push(newDirection);
      }
    });

    // Setup mobile support
    this.setupMobileSupport();

    // Listen for window resize to reposition elements
    this.scale.on('resize', this.handleResize, this);

    // Exit button (top left) - always on top
    this.exitButton = this.add.image(40, 30, 'exit-bg').setDepth(3000);
    this.exitButton.setScale(1.5); // Make the vector bigger
    // Larger hit area for the button
    this.exitButton.setInteractive(new Phaser.Geom.Rectangle(-10, -10, 50, 50), Phaser.Geom.Rectangle.Contains);
    this.exitButton.input!.cursor = 'pointer';

    this.exitText = this.add.text(45, 30, 'Exit Game', {
      fontSize: '16px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(3001); // Origin left-center so text starts to the right

    // Make text clickable with a larger hit area (wider padding)
    this.exitText.setInteractive({ useHandCursor: true });
    this.exitText.setPadding(15, 15, 15, 15); // Left, top, right, bottom padding

    // Exit button event handlers
    const exitHandler = () => {
      this.endGame('manual_exit');
    };

    const hoverHandler = () => {
      this.exitButton.setAlpha(0.8);
      this.exitText.setAlpha(0.8);
    };

    const outHandler = () => {
      this.exitButton.setAlpha(1);
      this.exitText.setAlpha(1);
    };

    this.exitButton.on('pointerdown', exitHandler);
    this.exitButton.on('pointerover', hoverHandler);
    this.exitButton.on('pointerout', outHandler);

    this.exitText.on('pointerdown', exitHandler);
    this.exitText.on('pointerover', hoverHandler);
    this.exitText.on('pointerout', outHandler);

    // Score display (top right of left panel area)
    // Score Box (shifted more to the left)
    const scoreBox = this.add.image(availableWidth - 180, 40, 'score-box').setDepth(3000);
    scoreBox.setOrigin(0, 0.5); // Set origin to left-center for alignment

    // Store the center position for the score box
    this.scoreBoxCenterX = scoreBox.x + scoreBox.width / 2;

    this.scoreText = this.add.text(0, scoreBox.y, 'Score: 0', {
      fontSize: '15px',
      color: '#FFF',
      fontFamily: 'Quicksand',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(3001);

    // Coin sprite (positioned to the right of score text)
    this.scoreCoin = this.add.image(0, scoreBox.y, 'coin').setDepth(3001);
    this.updateCoinPosition();

    // Streak Box (aligned under score box, left edges aligned)
    const streakBox = this.add.image(scoreBox.x, scoreBox.y + 45, 'streak-box').setDepth(3000);
    streakBox.setOrigin(0, 0.5); // Set origin to left-center for alignment
    this.streakText = this.add.text(streakBox.x + streakBox.width / 2, streakBox.y, 'Streak: 0', {
      fontSize: '15px',
      color: '#FFF',
      fontFamily: 'Quicksand',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(3001);

    // Draw initial snake
    this.drawSnake();

    // Show start overlay on top
    this.showStartOverlay();
  }

  drawGrid(offsetX: number, offsetY: number) {
    // Create checkerboard pattern using sprite tiles
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        // Calculate position (top-left corner of each cell)
        const posX = offsetX + (x * this.GRID_SIZE);
        const posY = offsetY + (y * this.GRID_SIZE);

        // Determine texture (checkerboard pattern)
        const texture = (x + y) % 2 === 0 ? 'grid-light' : 'grid-dark';

        // Add sprite with origin at top-left and scale to fit the cell
        const tile = this.add.image(posX, posY, texture);
        tile.setOrigin(0, 0);
        tile.setDisplaySize(this.GRID_SIZE, this.GRID_SIZE);
      }
    }

    // Draw border around the grid
    const border = this.add.graphics();
    border.lineStyle(4, 0x473025, 1); // 4px thick, Dark Brown

    // Calculate grid dimensions
    const width = this.gridWidth * this.GRID_SIZE;
    const height = this.gridHeight * this.GRID_SIZE;

    // Draw rectangle around the grid area
    border.strokeRect(offsetX, offsetY, width, height);
  }

  updateCoinPosition() {
    // Calculate total width of score text + gap + coin
    const gap = 5;
    const totalWidth = this.scoreText.width + gap + this.scoreCoin.width;

    // Position text to the left of center so the whole unit is centered
    this.scoreText.setPosition(
      this.scoreBoxCenterX - totalWidth / 2 + this.scoreText.width / 2,
      this.scoreText.y
    );

    // Position coin to the right of text
    this.scoreCoin.setPosition(
      this.scoreText.x + this.scoreText.width / 2 + gap + this.scoreCoin.width / 2,
      this.scoreText.y
    );
  }

  showStartOverlay() {
    const width = this.scale.width;
    const height = this.scale.height;
    const size = Math.min(width, height);

    // Dark background overlay
    const backgroundOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.6
    ).setDepth(5000).setInteractive();

    // Popup frame (wider)
    const popupFrame = this.add.image(
      width / 2,
      height / 2,
      'popup'
    ).setDepth(5001);
    popupFrame.setDisplaySize(size * 0.75, size * 0.7);

    // Header image at top of popup (inside, not on top) - fills horizontally, slightly taller
    const headerImage = this.add.image(
      width / 2,
      height / 2 - (size * 0.7 / 2) + 35,
      'header'
    ).setDepth(5002);
    headerImage.setDisplaySize(size * 0.75, 70);

    // "How To Play" text inside the header - larger and bold
    const headerText = this.add.text(
      width / 2,
      height / 2 - (size * 0.7 / 2) + 35,
      'How To Play',
      {
        fontSize: '28px',
        color: '#FDF0DC',
        fontFamily: 'Quicksand',
        fontStyle: 'bold',
          align: 'center'
      }
    ).setOrigin(0.5).setDepth(5003);

    // Instruction text above diagrams
    const instructionTopY = height / 2 - 120;
    const instructionTop = this.add.text(
      width / 2,
      instructionTopY,
      'Read the question, then guide your snake to the correct fruit to answer it!',
      {
        fontSize: '17px',
        color: '#473025',
        fontFamily: 'Quicksand',
        fontStyle: 'bold',
          align: 'center',
        wordWrap: { width: size * 0.65 }
      }
    ).setOrigin(0.5).setDepth(5002);

    // Control diagrams - side by side, bottom-aligned
    const diagramsY = height / 2 + 10; // Moved down from -20
    const diagramGap = 120; // Gap between the two diagrams (reduced from 150)
    const keySize = 60; // Spacing between keys (increased from 50)

    // Arrow Keys (left side) - using Key.png for each
    // ArrowKey.png points left by default, so we need to adjust rotations
    const arrowKeyPositions = [
      { x: 0, y: -keySize, rotation: 90 },      // Up arrow - top (rotate 90 from left)
      { x: -keySize, y: 0, rotation: 0 },       // Left arrow - left (default)
      { x: 0, y: 0, rotation: -90 },            // Down arrow - center (rotate -90 from left)
      { x: keySize, y: 0, rotation: 180 }       // Right arrow - right (flip from left)
    ];

    const controlElements: Phaser.GameObjects.GameObject[] = [];

    // Create arrow keys
    arrowKeyPositions.forEach((pos) => {
      const keyImage = this.add.image(
        width / 2 - diagramGap + pos.x,
        diagramsY + pos.y,
        'key'
      ).setDepth(5002).setScale(1.5);

      // Arrow symbol using ArrowKey.png, rotated
      const arrowSymbol = this.add.image(
        width / 2 - diagramGap + pos.x,
        diagramsY + pos.y,
        'arrow-key'
      ).setDepth(5003).setScale(1.5).setAngle(pos.rotation);

      controlElements.push(keyImage, arrowSymbol);
    });

    // WASD Keys (right side)
    const wasdKeys = ['W', 'A', 'S', 'D'];
    const wasdPositions = [
      { x: 0, y: -keySize },    // W - top
      { x: -keySize, y: 0 },    // A - left
      { x: 0, y: 0 },           // S - center
      { x: keySize, y: 0 }      // D - right
    ];

    wasdKeys.forEach((letter, index) => {
      const keyImage = this.add.image(
        width / 2 + diagramGap + wasdPositions[index].x,
        diagramsY + wasdPositions[index].y,
        'key'
      ).setDepth(5002).setScale(1.5);

      const keyText = this.add.text(
        width / 2 + diagramGap + wasdPositions[index].x,
        diagramsY + wasdPositions[index].y,
        letter,
        {
          fontSize: '28px',
          color: '#473025',
          fontFamily: 'Quicksand',
          fontStyle: 'bold',
              align: 'center'
        }
      ).setOrigin(0.5).setDepth(5003);

      controlElements.push(keyImage, keyText);
    });

    // Instruction text below diagrams with word wrap to keep inside popup
    // Using multiple lines to fit inside and maintain colored keywords
    const instructionBottomY = height / 2 + 70; // Reduced gap for better spacing

    const line1Text = 'Use ';
    const wasdText = 'WASD';
    const line1Middle = ' or ';
    const arrowKeysText = 'Arrow Keys';
    const line2Text = ' on your keyboard to';
    const line3Text = 'control the snake\'s movement.';

    // First line
    const line1Part1 = this.add.text(0, 0, line1Text, {
      fontSize: '17px', color: '#473025', fontFamily: 'Quicksand',
      fontStyle: 'bold'    }).setDepth(5002);

    const line1Part2 = this.add.text(0, 0, wasdText, {
      fontSize: '17px', color: '#EA1644', fontFamily: 'Quicksand',
      fontStyle: 'bold'    }).setDepth(5002);

    const line1Part3 = this.add.text(0, 0, line1Middle, {
      fontSize: '17px', color: '#473025', fontFamily: 'Quicksand',
      fontStyle: 'bold'    }).setDepth(5002);

    const line1Part4 = this.add.text(0, 0, arrowKeysText, {
      fontSize: '17px', color: '#EA1644', fontFamily: 'Quicksand',
      fontStyle: 'bold'    }).setDepth(5002);

    const line1Part5 = this.add.text(0, 0, line2Text, {
      fontSize: '17px', color: '#473025', fontFamily: 'Quicksand',
      fontStyle: 'bold'    }).setDepth(5002);

    // Second line
    const line2Part1 = this.add.text(
      width / 2,
      instructionBottomY + 25,
      line3Text,
      {
        fontSize: '17px', color: '#473025', fontFamily: 'Quicksand',
        fontStyle: 'bold', align: 'center'
      }
    ).setOrigin(0.5, 0).setDepth(5002);

    // Position first line centered
    const line1TotalWidth = line1Part1.width + line1Part2.width + line1Part3.width + line1Part4.width + line1Part5.width;
    let currentX = width / 2 - line1TotalWidth / 2;

    line1Part1.setPosition(currentX, instructionBottomY);
    currentX += line1Part1.width;
    line1Part2.setPosition(currentX, instructionBottomY);
    currentX += line1Part2.width;
    line1Part3.setPosition(currentX, instructionBottomY);
    currentX += line1Part3.width;
    line1Part4.setPosition(currentX, instructionBottomY);
    currentX += line1Part4.width;
    line1Part5.setPosition(currentX, instructionBottomY);

    controlElements.push(line1Part1, line1Part2, line1Part3, line1Part4, line1Part5, line2Part1);

    // Start button (bigger for start screen) - positioned after instruction text
    // Account for 2 lines of text (25px each) + spacing
    const startButtonY = instructionBottomY + 100; // Position below both lines of text
    const startButton = this.add.image(
      width / 2,
      startButtonY,
      'popup-button-green-big'
    ).setDepth(5002).setScale(1.3);
    startButton.setInteractive({ useHandCursor: true });

    const startText = this.add.text(
      width / 2,
      startButtonY,
      'Start Game',
      {
        fontSize: '27px',
        color: '#FFF',
        fontFamily: 'Quicksand',
        fontStyle: 'bold',
          align: 'center'
      }
    ).setOrigin(0.5).setDepth(5003).setScale(1.1);

    // Hover effect
    startButton.on('pointerover', () => startButton.setAlpha(0.8));
    startButton.on('pointerout', () => startButton.setAlpha(1));

    // Start button click
          startButton.on('pointerdown', () => {
            backgroundOverlay.destroy();
            popupFrame.destroy();
            headerImage.destroy();
            headerText.destroy();
            instructionTop.destroy();
            controlElements.forEach(el => el.destroy());
            startButton.destroy();
            startText.destroy();
    
            // Now show the Pre-Question Modal
            this.showQuestion();
          });  }

  createQuestionPanel(leftAreaWidth: number, panelWidth: number, height: number) {
    // Panel starts after the left area
    const panelStartX = leftAreaWidth;

    // Panel background
    // If 'question-panel' asset exists, use it, otherwise fallback to rectangle
    if (this.textures.exists('question-panel')) {
        this.add.image(panelStartX + panelWidth / 2, height / 2, 'question-panel').setDisplaySize(panelWidth, height);
    } else {
        this.add.rectangle(
          panelStartX + panelWidth / 2,
          height / 2,
          panelWidth,
          height,
          0xfffaf2
        );
    }

    // Responsive font sizes based on panel width
    const titleFontSize = panelWidth < 320 ? '20px' : '28px';
    const instructionFontSize = panelWidth < 320 ? '13px' : '16px';

    // Title
    this.add.text(panelStartX + panelWidth / 2, 40, 'SNAKE QUIZ', {
      fontSize: titleFontSize,
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(
      panelStartX + 20,
      100,
      'Eat the fruit matching\nthe correct answer!',
      {
        fontSize: instructionFontSize,
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: panelWidth - 40 }
      }
    );
    instructions.x = panelStartX + panelWidth / 2 - instructions.width / 2;
  }

  showQuestion(wasCorrect?: boolean, pointsEarned?: number, currentStreak?: number, answeredQuestion?: QuizQuestion) {
    // Select next question based on phase (mastery recycling or endless random)
    const nextIndex = this.selectNextQuestion();

    // If null, we are transitioning phases (Endless Modal is showing). Stop here.
    if (nextIndex === null) {
      return;
    }

    this.currentQuestionIndex = nextIndex;

    this.isPausedForQuestion = true;
    this.currentQuestion = this.originalQuizData.questions[this.currentQuestionIndex];

    // Randomize fruit mapping for this question
    this.currentFruitMap = this.shuffleArray([...this.ANSWER_FRUITS_MAP]);

    // Shuffle answer options
    const shuffledColors = this.shuffleArray([...ANSWER_COLORS]);
    const optionsWithIndex = this.currentQuestion.options.map((option, index) => ({
      option,
      originalIndex: index,
      color: shuffledColors[index]
    }));
    this.shuffledOptions = this.shuffleArray(optionsWithIndex);

    // Clear existing question UI
    if (this.questionPanel) {
      this.questionPanel.destroy();
    }

    // Clear existing apples
    this.apples.forEach(apple => apple.graphics.destroy());
    this.apples = [];

    const width = this.scale.width;
    const height = this.scale.height;
    
    // Calculate panel width again (same logic as create)
    let panelWidth = 400;
    if (this.isMobile && width < 1024) {
      panelWidth = Math.max(220, Math.min(280, width * 0.25));
    }
    const leftAreaWidth = width - panelWidth;
    const panelStartX = leftAreaWidth;

    const elements: Phaser.GameObjects.GameObject[] = [];

    // Responsive font sizes
    const isMobileLayout = panelWidth < 350;
    const questionNumFontSize = isMobileLayout ? '12px' : '14px';
    const questionTextFontSize = isMobileLayout ? '14px' : '18px';
    const topMargin = isMobileLayout ? 20 : 160;
    const questionTextMargin = isMobileLayout ? 50 : 200;

    // Question number
    const questionNum = this.add.text(
      panelStartX + panelWidth / 2,
      topMargin,
      `Question ${this.currentQuestionIndex + 1}/${this.originalQuizData.questions.length}`,
      {
        fontSize: questionNumFontSize,
        color: '#95b607',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    elements.push(questionNum);

    // Question text
    const questionText = this.add.text(
      panelStartX + panelWidth / 2,
      questionTextMargin,
      this.currentQuestion.question,
      {
        fontSize: questionTextFontSize,
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'left',
        wordWrap: { width: panelWidth - 30 },
        lineSpacing: 2
      }
    ).setOrigin(0.5, 0);
    elements.push(questionText);

    // Answer options with FRUIT ICONS
    const startY = questionTextMargin + questionText.height + (isMobileLayout ? 15 : 30);
    let currentY = startY;

    const answerLetterFontSize = isMobileLayout ? '12px' : '15px';
    const answerTextFontSize = isMobileLayout ? '11px' : '13px';
    const iconSize = isMobileLayout ? 20 : 30;
    const iconMargin = isMobileLayout ? 22 : 30;
    const answerStartX = isMobileLayout ? 50 : 70;
    const answerTextStartX = isMobileLayout ? 75 : 100;

    this.shuffledOptions.forEach((shuffledOption, displayIndex) => {
      // Fruit Icon (using currentFruitMap)
      const fruitTexture = this.currentFruitMap[shuffledOption.originalIndex];
      const fruitIcon = this.add.image(
        panelStartX + iconMargin,
        currentY + 12,
        fruitTexture
      ).setDisplaySize(iconSize, iconSize);

      // Answer letter
      const letter = this.add.text(
        panelStartX + answerStartX,
        currentY,
        String.fromCharCode(65 + displayIndex) + ')',
        {
          fontSize: answerLetterFontSize,
          color: '#473025',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0, 0);

      // Answer text
      const answerText = this.add.text(
        panelStartX + answerTextStartX,
        currentY,
        shuffledOption.option,
        {
          fontSize: answerTextFontSize,
          color: '#473025',
          fontFamily: 'Quicksand, sans-serif',
          wordWrap: { width: panelWidth - (isMobileLayout ? 85 : 120) },
          lineSpacing: 1
        }
      ).setOrigin(0, 0);

      elements.push(fruitIcon, letter, answerText);

      const textHeight = answerText.height;
      const spacing = isMobileLayout ? Math.max(textHeight + 8, 32) : Math.max(textHeight + 20, 50);
      currentY += spacing;
    });

    this.questionPanel = this.add.container(0, 0, elements);

    // Slide in animation
    this.questionPanel.setAlpha(0);
    this.questionPanel.x = 100;
    this.tweens.add({
      targets: this.questionPanel,
      alpha: 1,
      x: 0,
      duration: 500,
      ease: 'Power3.easeOut'
    });

    // Show the Pre-Question Modal (replaces the old simple overlay)
    this.showPreQuestionModal();
  }

  showCorrectFeedback(pointsEarned: number, currentStreak: number) {
    // Save the question we just answered
    const answeredQuestion = this.currentQuestion!;

    // In endless mode, there is no "last question"
    const isLastQuestion = false; // Always show Continue + Explanation buttons

    // Show feedback overlay for all correct answers
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const panel = 400;
    const available = screenWidth - panel;
    const size = Math.min(available, screenHeight);

    // Dark background overlay
    const backgroundOverlay = this.add.rectangle(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      size,
      size,
      0x000000,
      0.6
    ).setDepth(1000).setAlpha(0);

    // Popup frame
    const popupFrame = this.add.image(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) + 20,
      'popup'
    ).setDepth(1001).setAlpha(0);
    popupFrame.setDisplaySize(size * 0.8, size * 0.55);

    // Fade in overlay and popup
    this.tweens.add({
      targets: [backgroundOverlay, popupFrame],
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    const overlayElements: Phaser.GameObjects.GameObject[] = [backgroundOverlay, popupFrame];

    // "Correct!" text in green
    const correctText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) - 90,
      'CORRECT!',
      {
        fontSize: '64px',
        color: '#03C3A3',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1002).setAlpha(0);
    overlayElements.push(correctText);

    // Fade in and scale animation
    this.tweens.add({
      targets: correctText,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Points earned with coin
    const pointsText = this.add.text(
      0,
      this.gameOffsetY + (size / 2) - 30,
      `+${pointsEarned} points`,
      {
        fontSize: '28px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1002).setAlpha(0);
    overlayElements.push(pointsText);

    const pointsCoin = this.add.image(0, this.gameOffsetY + (size / 2) - 30, 'coin').setDepth(1002).setAlpha(0);
    pointsCoin.setDisplaySize(28, 28);
    overlayElements.push(pointsCoin);

    // Center points text and coin together
    const pointsGap = 5;
    const pointsTotalWidth = pointsText.width + pointsGap + pointsCoin.width;
    pointsText.setPosition(
      this.gameOffsetX + (size / 2) - pointsTotalWidth / 2 + pointsText.width / 2,
      this.gameOffsetY + (size / 2) - 30
    );
    pointsCoin.setPosition(
      pointsText.x + pointsText.width / 2 + pointsGap + pointsCoin.width / 2,
      this.gameOffsetY + (size / 2) - 30
    );

    // Fade in with delay
    this.tweens.add({
      targets: [pointsText, pointsCoin],
      alpha: 1,
      duration: 300,
      delay: 200,
      ease: 'Power2'
    });

    // Streak
    const streakDisplayText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      `Streak: ${currentStreak}`,
      {
        fontSize: '24px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1002).setAlpha(0);
    overlayElements.push(streakDisplayText);

    // Fade in with delay
    this.tweens.add({
      targets: streakDisplayText,
      alpha: 1,
      duration: 300,
      delay: 300,
      ease: 'Power2'
    });

    // Read the question prompt
    const readPromptText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) + 40,
      isLastQuestion ? 'Quiz Complete!' : 'Read the next question!',
      {
        fontSize: '32px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(1002).setAlpha(0);
    overlayElements.push(readPromptText);

    // Fade in prompt
    this.tweens.add({
      targets: readPromptText,
      alpha: 1,
      duration: 300,
      delay: 400,
      ease: 'Power2'
    });

    if (!isLastQuestion) {
      // Not last question - show Explanation and Continue buttons
      // Explanation button (orange) - LEFT
      const explainButton = this.add.image(
        this.gameOffsetX + (size / 2) - 110,
        this.gameOffsetY + (size / 2) + 115,
        'popup-button-orange-big'
      ).setDepth(1002).setAlpha(0).setScale(0.9);
      explainButton.setInteractive({ useHandCursor: true });
      overlayElements.push(explainButton);

      const explainText = this.add.text(
        this.gameOffsetX + (size / 2) - 110,
        this.gameOffsetY + (size / 2) + 115,
        'Explanation',
        {
          fontSize: '24px',
          color: '#FFF',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(1003).setAlpha(0).setScale(0.9);
      overlayElements.push(explainText);

      // Continue button (green) - RIGHT
      const continueButton = this.add.image(
        this.gameOffsetX + (size / 2) + 110,
        this.gameOffsetY + (size / 2) + 115,
        'popup-button-green-big'
      ).setDepth(1002).setAlpha(0).setScale(0.9);
      continueButton.setInteractive({ useHandCursor: true });
      overlayElements.push(continueButton);

      const continueText = this.add.text(
        this.gameOffsetX + (size / 2) + 110,
        this.gameOffsetY + (size / 2) + 115,
        'Continue',
        {
          fontSize: '24px',
          color: '#FFF',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(1003).setAlpha(0).setScale(0.9);
      overlayElements.push(continueText);

      // Animate buttons in
      this.tweens.add({
        targets: [continueButton, continueText, explainButton, explainText],
        alpha: 1,
        scale: 1,
        duration: 300,
        delay: 500,
        ease: 'Back.easeOut'
      });

      // Button hover effects
      continueButton.on('pointerover', () => {
        continueButton.setAlpha(0.8);
      });
      continueButton.on('pointerout', () => {
        continueButton.setAlpha(1);
      });
      explainButton.on('pointerover', () => {
        explainButton.setAlpha(0.8);
      });
      explainButton.on('pointerout', () => {
        explainButton.setAlpha(1);
      });

      // Continue button click - show next question
      continueButton.on('pointerdown', () => {
        overlayElements.forEach(el => el.destroy());
        this.showQuestion();  // Show next question panel
      });

      // Explanation button click
      explainButton.on('pointerdown', () => {
        this.showExplanation(overlayElements, answeredQuestion, true, answeredQuestion.answer);
      });

    } else {
      // Last question - show "View Results" button instead of Continue
      const viewResultsButton = this.add.image(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) + 115,
        'popup-button-green-big'
      ).setDepth(1002).setAlpha(0).setScale(0.9);
      viewResultsButton.setInteractive({ useHandCursor: true });
      overlayElements.push(viewResultsButton);

      const viewResultsText = this.add.text(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) + 115,
        'View Results',
        {
          fontSize: '24px',
          color: '#FFF',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(1003).setAlpha(0).setScale(0.9);
      overlayElements.push(viewResultsText);

      // Animate button in
      this.tweens.add({
        targets: [viewResultsButton, viewResultsText],
        alpha: 1,
        scale: 1,
        duration: 300,
        delay: 500,
        ease: 'Back.easeOut'
      });

      // Button hover
      viewResultsButton.on('pointerover', () => {
        viewResultsButton.setAlpha(0.8);
      });
      viewResultsButton.on('pointerout', () => {
        viewResultsButton.setAlpha(1);
      });

      // Click - go to win screen
      viewResultsButton.on('pointerdown', () => {
        overlayElements.forEach(el => el.destroy());
        this.winGame();
      });
    }
  }

  showCorrectOverlay(pointsEarned: number, currentStreak: number) {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const panel = 400;
    const available = screenWidth - panel;
    const size = Math.min(available, screenHeight);

    // Green overlay
    const correctOverlay = this.add.rectangle(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      size,
      size,
      0x00b894,
      0.7
    ).setDepth(1000);

    // "Correct!" text
    const correctText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) - 40,
      'CORRECT!',
      {
        fontSize: '72px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(1001);

    // Points earned text
    const pointsText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) + 40,
      `+${pointsEarned} points`,
      {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(1001);

    // Streak text
    const streakDisplayText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) + 80,
      `Streak: ${currentStreak}`,
      {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(1001);

    // Remove overlay after 1.5 seconds
    this.time.delayedCall(1500, () => {
      correctOverlay.destroy();
      correctText.destroy();
      pointsText.destroy();
      streakDisplayText.destroy();
    });
  }

  startRound() {
    this.isPausedForQuestion = false;
    this.gameStarted = true;

    // ANALYTICS SYSTEM - Track start time for time spent calculation
    // Only set on first round, not on subsequent rounds after answering questions
    if (this.startTime === 0) {
      this.startTime = Date.now();
    }

    // Re-enable exit button
    this.exitButton.setInteractive({ useHandCursor: true });

    // Spawn colored apples
    this.spawnApples();
  }

  spawnApples() {
    // Spawn one apple for each shuffled answer option
    const appleGraphics: Phaser.GameObjects.Image[] = [];

    this.shuffledOptions.forEach((shuffledOption, index) => {
      let position: GridPosition;
      let attempts = 0;
      let minDistanceOverride = -1; // Track if we need to reduce distance requirement

      // Find valid position (not on snake, other apples, or too close to snake head)
      do {
        position = {
          x: Math.floor(Math.random() * this.gridWidth),
          y: Math.floor(Math.random() * this.gridHeight)
        };
        attempts++;

        // If we've tried 100 times and still can't find a spot, reduce minimum distance
        if (attempts === 100 && minDistanceOverride === -1) {
          minDistanceOverride = 3; // Try with minimum distance of 3
          attempts = 0; // Reset attempts
        }
        // If still can't find after another 100 attempts, reduce to 2
        else if (attempts === 100 && minDistanceOverride === 3) {
          minDistanceOverride = 2;
          attempts = 0;
        }
        // If still can't find, give up and use 1 (just avoid snake body and other apples)
        else if (attempts === 100 && minDistanceOverride === 2) {
          minDistanceOverride = 1;
          attempts = 0;
        }
      } while (
        (this.isPositionOnSnake(position) ||
         this.isPositionOnApple(position) ||
         this.isTooCloseToSnakeHead(position, minDistanceOverride)) &&
        attempts < 100
      );

      // Create apple graphics using fruit sprite
      const fruitSprite = this.currentFruitMap[shuffledOption.originalIndex];
      const graphics = this.add.image(
        this.gameOffsetX + position.x * this.GRID_SIZE + this.GRID_SIZE / 2,
        this.gameOffsetY + position.y * this.GRID_SIZE + this.GRID_SIZE / 2,
        fruitSprite
      );
      graphics.setDisplaySize(this.GRID_SIZE * 0.8, this.GRID_SIZE * 0.8);
      graphics.setScale(0);

      appleGraphics.push(graphics);

      this.apples.push({
        position,
        color: shuffledOption.color,
        answerIndex: shuffledOption.originalIndex,
        graphics
      });
    });

    // Animate all apples spawning at the same time with faster animation
    this.tweens.add({
      targets: appleGraphics,
      scale: 1,
      duration: 200, // Faster: reduced from 300
      ease: 'Back.easeOut'
    });
  }

  drawSnake() {
    // Only recreate sprites if snake length changed
    if (this.snakeGraphics.length !== this.snake.length) {
      this.snakeGraphics.forEach(g => g.destroy());
      this.snakeGraphics = [];

      // Create sprites for each segment
      this.snake.forEach(() => {
        const sprite = this.add.image(0, 0, 'snake-head');
        this.snakeGraphics.push(sprite);
      });
    }

    // Update each sprite
    this.snake.forEach((segment, index) => {
      const sprite = this.snakeGraphics[index];
      const targetX = this.gameOffsetX + segment.x * this.GRID_SIZE + this.GRID_SIZE / 2;
      const targetY = this.gameOffsetY + segment.y * this.GRID_SIZE + this.GRID_SIZE / 2;

      let angle = 0;
      let textureName = '';

      // Determine texture and angle
      if (index === 0) {
        // HEAD
        textureName = 'snake-head';
        switch (this.direction) {
          case Direction.UP: angle = -90; break;
          case Direction.DOWN: angle = 90; break;
          case Direction.LEFT: angle = 180; break;
          case Direction.RIGHT: angle = 0; break;
        }
      } else if (index === this.snake.length - 1) {
        // TAIL
        textureName = 'snake-tail';
        const prev = this.snake[index - 1];
        if (prev.x < segment.x) angle = -90;
        else if (prev.x > segment.x) angle = 90;
        else if (prev.y < segment.y) angle = 0;
        else if (prev.y > segment.y) angle = 180;
      } else {
        // BODY
        const prev = this.snake[index - 1];
        const next = this.snake[index + 1];
        const isStraight = (prev.x === next.x) || (prev.y === next.y);

        if (isStraight) {
          textureName = 'snake-body';
          angle = (prev.x === next.x) ? 90 : 0;
        } else {
          textureName = 'snake-corner';
          const fromLeft = prev.x < segment.x;
          const fromRight = prev.x > segment.x;
          const fromTop = prev.y < segment.y;
          const fromBottom = prev.y > segment.y;
          const toLeft = next.x < segment.x;
          const toRight = next.x > segment.x;
          const toTop = next.y < segment.y;
          const toBottom = next.y > segment.y;

          if ((fromLeft && toBottom) || (fromBottom && toLeft)) angle = 90;
          else if ((fromTop && toLeft) || (fromLeft && toTop)) angle = 180;
          else if ((fromRight && toTop) || (fromTop && toRight)) angle = -90;
          else if ((fromBottom && toRight) || (fromRight && toBottom)) angle = 0;
        }
      }

      // Update texture if changed
      if (sprite.texture.key !== textureName) {
        sprite.setTexture(textureName);
      }

      // Update angle
      sprite.setAngle(angle);

      // Update size - full width to connect, thinner height for spacing
      const displayWidth = this.GRID_SIZE; // Full width
      const displayHeight = this.GRID_SIZE * 0.7;

      if (textureName === 'snake-tail') {
        // Tail: narrower width, full height (since PNG points up)
        sprite.setDisplaySize(displayWidth * 0.7, this.GRID_SIZE);
      } else {
        sprite.setDisplaySize(displayWidth, displayHeight);
      }

      // Smooth movement - each segment animates FROM where the NEXT segment currently is
      // (the segment behind it in the array, which is where this segment was before)
      let startX = targetX;
      let startY = targetY;

      if (index === 0 && this.snake.length > 1) {
        // HEAD - animate from where segment 1 currently is (where head was before)
        const nextSegment = this.snake[1];
        startX = this.gameOffsetX + nextSegment.x * this.GRID_SIZE + this.GRID_SIZE / 2;
        startY = this.gameOffsetY + nextSegment.y * this.GRID_SIZE + this.GRID_SIZE / 2;
      } else if (index > 0) {
        // BODY/TAIL/CORNER - animate from where the next segment currently is
        const nextSegment = this.snake[index + 1];
        if (nextSegment) {
          // Body segments - animate from the next segment position
          startX = this.gameOffsetX + nextSegment.x * this.GRID_SIZE + this.GRID_SIZE / 2;
          startY = this.gameOffsetY + nextSegment.y * this.GRID_SIZE + this.GRID_SIZE / 2;
        } else if (index === this.snake.length - 1 && this.lastTailPosition) {
          // TAIL (last segment) - animate from the saved tail position
          startX = this.gameOffsetX + this.lastTailPosition.x * this.GRID_SIZE + this.GRID_SIZE / 2;
          startY = this.gameOffsetY + this.lastTailPosition.y * this.GRID_SIZE + this.GRID_SIZE / 2;
        }
      }

      // Animation logic - corners snap to grid, other segments slide smoothly
      if (textureName === 'snake-corner') {
        // Snap corners to grid (no animation drift)
        sprite.setPosition(targetX, targetY);
      } else {
        // Smooth animation for head, body, and tail
        const progress = Math.min((this.time.now - this.lastMoveTime) / this.moveDelay, 1);
        sprite.setPosition(
          startX + (targetX - startX) * progress,
          startY + (targetY - startY) * progress
        );
      }
    });
  }

  update(time: number, delta: number) {
    if (!this.gameStarted || this.gameOver || this.isPausedForQuestion || this.isPausedForVisibility) {
      return;
    }

    // Move snake at intervals
    if (time - this.lastMoveTime > this.moveDelay) {
      this.moveSnake();
      this.lastMoveTime = time;
    }

    // Continuously update snake positions for smooth animation
    this.drawSnake();
  }

  moveSnake() {
    // Apply buffered input if available
    if (this.inputBuffer.length > 0) {
      this.nextDirection = this.inputBuffer.shift()!;
    }

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

    // Check wall collision (solid walls now, no wrapping)
    if (newHead.x < 0 || newHead.x >= this.gridWidth || newHead.y < 0 || newHead.y >= this.gridHeight) {
      // Hit a wall!
      if (this.gamePhase === GamePhase.ENDLESS) {
        this.endGame('collision'); // Game over in endless mode
      } else {
        this.handleSelfCollision(); // Use existing penalty/respawn logic in mastery mode
      }
      return; // Stop moving
    }

    // Check self collision
    if (this.isPositionOnSnake(newHead)) {
      this.handleSelfCollision();
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
        this.streak++;
        this.correctAnswers++;

        // PHASE MANAGEMENT - Mark question as answered correctly
        const selectedAnswer = this.currentQuestion!.options[eatenApple.answerIndex];
        this.questionsAnsweredCorrectly.add(this.currentQuestionIndex);

        // Remove from incorrect pool if it was there
        const poolIndex = this.incorrectQuestionPool.indexOf(this.currentQuestionIndex);
        if (poolIndex > -1) {
          this.incorrectQuestionPool.splice(poolIndex, 1);
        }

        // QUESTION ANALYTICS - Track this attempt (MASTERY ONLY)
        if (this.gamePhase === GamePhase.MASTERY) {
          const attemptNum = (this.attemptCounters[this.currentQuestionIndex] || 0) + 1;
          this.attemptCounters[this.currentQuestionIndex] = attemptNum;

          // FIRST TRY TRACKING - Increment count if this was answered correctly on first attempt
          if (attemptNum === 1) {
            this.firstTryCorrectCount++;
          }

          this.questionAttempts.push({
            questionText: this.currentQuestion!.question,
            selectedAnswer: selectedAnswer,
            correctAnswer: this.currentQuestion!.answer,
            wasCorrect: true,
            attemptNumber: attemptNum
          });

          // MASTERY ACCURACY - Increment mastery attempt counter
          this.masteryAttempts++;
        }

        // ANALYTICS SYSTEM - Track longest streak achieved
        if (this.streak > this.longestStreak) {
          this.longestStreak = this.streak;
        }

        // Calculate score with streak bonus: base 10 + (streak - 1) * 5
        const baseScore = 10;
        const streakBonus = (this.streak - 1) * 5;
        const pointsEarned = baseScore + streakBonus;

        const oldScore = this.score;
        this.score += pointsEarned;

        // Animate score counting up
        this.tweens.add({
          targets: this,
          displayedScore: this.score,
          duration: 500,
          ease: 'Power2',
          onUpdate: () => {
            this.scoreText.setText(`Score: ${Math.floor(this.displayedScore)}`);
            this.updateCoinPosition();
          }
        });

        // Pulse animation on score text
        this.tweens.add({
          targets: this.scoreText,
          scale: { from: 1, to: 1.2 },
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        });

        this.streakText.setText(`Streak: ${this.streak}`);

        // Pulse animation on streak text
        this.tweens.add({
          targets: this.streakText,
          scale: { from: 1, to: 1.15 },
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        });

        // Add new head (snake grows)
        this.snake.unshift(newHead);
        // Tail doesn't move when growing, so clear lastTailPosition
        this.lastTailPosition = null;

        // Remove eaten apple
        eatenApple.graphics.destroy();
        this.apples = this.apples.filter(a => a !== eatenApple);

        // Remove all other apples
        this.apples.forEach(apple => apple.graphics.destroy());
        this.apples = [];

        // Show feedback (even for last question)
        this.gameStarted = false;
        this.showCorrectFeedback(pointsEarned, this.streak);
      } else {
        // Wrong answer!
        const studentAnswer = this.currentQuestion!.options[eatenApple.answerIndex];

        // ENDLESS MODE - Game over on wrong answer
        if (this.gamePhase === GamePhase.ENDLESS) {
          this.endGame('wrong_answer');
          return;
        }

        // PHASE MANAGEMENT - Add to incorrect pool (only in mastery phase)
        if (this.gamePhase === GamePhase.MASTERY) {
          // Only add if not already in pool and not already answered correctly
          if (!this.incorrectQuestionPool.includes(this.currentQuestionIndex) &&
              !this.questionsAnsweredCorrectly.has(this.currentQuestionIndex)) {
            this.incorrectQuestionPool.push(this.currentQuestionIndex);
          }
        }

        // QUESTION ANALYTICS - Track this attempt (MASTERY ONLY)
        if (this.gamePhase === GamePhase.MASTERY) {
          const attemptNum = (this.attemptCounters[this.currentQuestionIndex] || 0) + 1;
          this.attemptCounters[this.currentQuestionIndex] = attemptNum;

          this.questionAttempts.push({
            questionText: this.currentQuestion!.question,
            selectedAnswer: studentAnswer,
            correctAnswer: this.currentQuestion!.answer,
            wasCorrect: false,
            attemptNumber: attemptNum
          });

          // MASTERY ACCURACY - Increment mastery attempt counter
          this.masteryAttempts++;
        }

        this.streak = 0; // Reset streak
        this.streakText.setText(`Streak: ${this.streak}`);
        this.wrongAnswer(`That's not quite right. Review the explanation carefully!`, studentAnswer);
      }
    } else {
      // Normal movement (no apple eaten)
      this.snake.unshift(newHead);
      // Save tail position before removing it (for smooth animation)
      this.lastTailPosition = { ...this.snake[this.snake.length - 1] };
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

  isTooCloseToSnakeHead(pos: GridPosition, overrideDistance: number = -1): boolean {
    // Don't spawn apples too close to the snake's head
    // Use larger distance unless snake is very long and needs space
    const head = this.snake[0];
    const distance = Math.abs(pos.x - head.x) + Math.abs(pos.y - head.y); // Manhattan distance

    // If override is provided (from progressive fallback), use that
    if (overrideDistance > 0) {
      return distance < overrideDistance;
    }

    // If snake is long (takes up more than 30% of grid), allow closer spawning
    const gridSize = this.gridWidth * this.gridHeight;
    const snakeRatio = this.snake.length / gridSize;
    const minDistance = snakeRatio > 0.3 ? 3 : 5; // Increase from 3 to 5 for normal cases

    return distance < minDistance;
  }

  handleSelfCollision() {
    // ENDLESS MODE: Game over on collision (classic snake)
    if (this.gamePhase === GamePhase.ENDLESS) {
      // Update endless high score if current score is higher
      if (this.score > this.endlessHighScore) {
        this.endlessHighScore = this.score;
      }

      // End the game
      this.endGame('collision');
      return;
    }

    // MASTERY MODE: Respawn with penalty (forgiving, educational)
    // Calculate penalty (20% of current score, don't go negative)
    const penalty = Math.floor(this.score * 0.2);
    this.score = Math.max(0, this.score - penalty);
    this.displayedScore = this.score; // Update displayed score immediately

    // Reset streak
    this.streak = 0;

    // Update UI
    this.scoreText.setText(`Score: ${this.score}`);
    this.updateCoinPosition();
    this.streakText.setText(`Streak: ${this.streak}`);

    // Pulse score text red to show penalty
    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1, to: 1.3 },
      duration: 150,
      yoyo: true,
      ease: 'Power2'
    });

    // Find safe position for snake (not on apples, not near apples)
    let safePosition: GridPosition;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      safePosition = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight)
      };
      attempts++;

      // Check if position is safe (not on any apple and not too close to any apple)
      const tooCloseToApple = this.apples.some(apple => {
        const distance = Math.abs(apple.position.x - safePosition.x) +
                        Math.abs(apple.position.y - safePosition.y);
        return distance < 4; // At least 4 cells away from any apple
      });

      if (!this.isPositionOnApple(safePosition) && !tooCloseToApple) {
        break;
      }
    } while (attempts < maxAttempts);

    // Keep current snake length, just reposition it
    const currentLength = this.snake.length;
    this.snake = [];

    // Rebuild snake with same length starting from safe position
    for (let i = 0; i < currentLength; i++) {
      this.snake.push({
        x: (safePosition.x - i + this.gridWidth) % this.gridWidth,
        y: safePosition.y
      });
    }

    // Reset direction to right
    this.direction = Direction.RIGHT;
    this.nextDirection = Direction.RIGHT;

    // Redraw snake
    this.drawSnake();

    // Show brief warning message
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const panel = 400;
    const available = screenWidth - panel;
    const size = Math.min(available, screenHeight);

    // Shift existing warnings up
    this.activeWarnings.forEach(text => {
      this.tweens.add({
        targets: text,
        y: text.y - 80, // Move up by more to prevent overlap with 2-line warnings
        alpha: text.alpha * 0.7, // Dim slightly
        duration: 200,
        ease: 'Power2'
      });
    });

    const warningText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      penalty > 0 ? `Watch out!\n-${penalty} points` : 'Watch out!',
      {
        fontSize: '32px',
        color: '#ff6b6b',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(3000).setAlpha(0);

    this.activeWarnings.push(warningText);

    // Fade in and out
    this.tweens.add({
      targets: warningText,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 800,
      onComplete: () => {
        // Remove from array
        const index = this.activeWarnings.indexOf(warningText);
        if (index > -1) {
          this.activeWarnings.splice(index, 1);
        }
        warningText.destroy();
      }
    });
  }

  wrongAnswer(reason: string, studentAnswer: string) {
    this.gameStarted = false;
    this.isPausedForQuestion = true;

    // Remove all apples
    this.apples.forEach(apple => apple.graphics.destroy());
    this.apples = [];

    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const panel = 400;
    const available = screenWidth - panel;
    const size = Math.min(available, screenHeight);

    // Dark background overlay
    const backgroundOverlay = this.add.rectangle(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      size,
      size,
      0x000000,
      0.6
    ).setDepth(1000).setAlpha(0);

    // Popup frame
    const popupFrame = this.add.image(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) + 20,
      'popup'
    ).setDepth(1001).setAlpha(0);
    popupFrame.setDisplaySize(size * 0.8, size * 0.55);

    // Fade in overlay and popup
    this.tweens.add({
      targets: [backgroundOverlay, popupFrame],
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Track elements for cleanup
    const overlayElements: Phaser.GameObjects.GameObject[] = [backgroundOverlay, popupFrame];

    // Wrong text (red)
    const wrongText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) - 90,
      'INCORRECT!',
      {
        fontSize: '64px',
        color: '#EA1644',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1002).setAlpha(0);
    overlayElements.push(wrongText);

    // Fade in first
    this.tweens.add({
      targets: wrongText,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Then shake animation (separate from fade)
    this.tweens.add({
      targets: wrongText,
      x: wrongText.x + 10,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Power2',
      onComplete: () => {
        wrongText.x = this.gameOffsetX + (size / 2);
      }
    });

    // Reason (with word wrap to prevent overflow) - top aligned
    const reasonStartY = this.gameOffsetY + (size / 2) - 30;
    const reasonText = this.add.text(
      this.gameOffsetX + (size / 2),
      reasonStartY,
      reason,
      {
        fontSize: '16px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: size - 100 },
        lineSpacing: 4
      }
    ).setOrigin(0.5, 0).setDepth(1002).setAlpha(0);
    overlayElements.push(reasonText);

    // Fade in
    this.tweens.add({
      targets: reasonText,
      alpha: 1,
      duration: 300,
      delay: 200,
      ease: 'Power2'
    });

    // Calculate dynamic Y positions based on reason text height
    const scoreY = reasonStartY + reasonText.height + 20;
    const promptY = scoreY + 50;
    const buttonsY = promptY + 65;

    // Current score with coin
    const scoreDisplay = this.add.text(
      0,
      scoreY,
      `Score: ${this.score}`,
      {
        fontSize: '22px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1002).setAlpha(0);
    overlayElements.push(scoreDisplay);

    const scoreCoin = this.add.image(0, scoreY, 'coin').setDepth(1002).setAlpha(0);
    scoreCoin.setDisplaySize(24, 24);
    overlayElements.push(scoreCoin);

    // Center score text and coin together
    const gap = 5;
    const totalWidth = scoreDisplay.width + gap + scoreCoin.width;
    scoreDisplay.setPosition(
      this.gameOffsetX + (size / 2) - totalWidth / 2 + scoreDisplay.width / 2,
      scoreY
    );
    scoreCoin.setPosition(
      scoreDisplay.x + scoreDisplay.width / 2 + gap + scoreCoin.width / 2,
      scoreY
    );

    // Fade in
    this.tweens.add({
      targets: [scoreDisplay, scoreCoin],
      alpha: 1,
      duration: 300,
      delay: 300,
      ease: 'Power2'
    });

    // Read the question prompt
    const readPromptText = this.add.text(
      this.gameOffsetX + (size / 2),
      promptY,
      'Read the next question!',
      {
        fontSize: '28px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(1002).setAlpha(0);
    overlayElements.push(readPromptText);

    // Fade in
    this.tweens.add({
      targets: readPromptText,
      alpha: 1,
      duration: 300,
      delay: 400,
      ease: 'Power2'
    });

    // Explanation button (left side) - orange
    const explainButton = this.add.image(
      this.gameOffsetX + (size / 2) - 110,
      buttonsY,
      'popup-button-orange-big'
    ).setDepth(1002).setAlpha(0).setScale(0.9);
    explainButton.setInteractive({ useHandCursor: true });
    overlayElements.push(explainButton);

    const explainText = this.add.text(
      this.gameOffsetX + (size / 2) - 110,
      buttonsY,
      'Explanation',
      {
        fontSize: '24px',
        color: '#FFF',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1003).setAlpha(0).setScale(0.9);
    overlayElements.push(explainText);

    // Continue button (right side) - green
    const continueButton = this.add.image(
      this.gameOffsetX + (size / 2) + 110,
      buttonsY,
      'popup-button-green-big'
    ).setDepth(1002).setAlpha(0).setScale(0.9);
    continueButton.setInteractive({ useHandCursor: true });
    overlayElements.push(continueButton);

    const continueText = this.add.text(
      this.gameOffsetX + (size / 2) + 110,
      buttonsY,
      'Continue',
      {
        fontSize: '24px',
        color: '#FFF',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1003).setAlpha(0).setScale(0.9);
    overlayElements.push(continueText);

    // Animate buttons in
    this.tweens.add({
      targets: [continueButton, continueText, explainButton, explainText],
      alpha: 1,
      scale: 1,
      duration: 300,
      delay: 500,
      ease: 'Back.easeOut'
    });

    // Button hover effects
    continueButton.on('pointerover', () => {
      continueButton.setAlpha(0.8);
    });
    continueButton.on('pointerout', () => {
      continueButton.setAlpha(1);
    });
    explainButton.on('pointerover', () => {
      explainButton.setAlpha(0.8);
    });
    explainButton.on('pointerout', () => {
      explainButton.setAlpha(1);
    });

    // Continue button click
    continueButton.on('pointerdown', () => {
      // Remove overlay and buttons
      overlayElements.forEach(el => el.destroy());

      // Show next question (selectNextQuestion will handle recycling wrong answers)
      this.showQuestion();
    });

    // Explanation button click
    explainButton.on('pointerdown', () => {
      this.showExplanation(overlayElements, this.currentQuestion!, false, studentAnswer);
    });
  }

  async showExplanation(previousOverlayElements: Phaser.GameObjects.GameObject[], questionData: QuizQuestion, wasCorrect: boolean = true, studentAnswer?: string) {
    // Hide previous overlay elements temporarily
    previousOverlayElements.forEach(el => {
      if ('setVisible' in el && typeof el.setVisible === 'function') {
        el.setVisible(false);
      }
    });

    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    const panel = 400;
    const available = screenWidth - panel;
    const size = Math.min(available, screenHeight);

    // Dark background overlay
    const backgroundOverlay = this.add.rectangle(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      size,
      size,
      0x000000,
      0.6
    ).setDepth(2000).setAlpha(0);

    // Popup frame (taller for explanation)
    const popupFrame = this.add.image(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) + 20,
      'popup'
    ).setDepth(2001).setAlpha(0);
    popupFrame.setDisplaySize(size * 0.8, size * 0.8);

    // Fade in overlay and popup
    this.tweens.add({
      targets: [backgroundOverlay, popupFrame],
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Loading text
    const loadingText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      'Loading explanation...',
      {
        fontSize: '24px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(2002).setAlpha(0);

    // Fade in loading text
    this.tweens.add({
      targets: loadingText,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    try {
      // Generate AI explanation for the specific question
      const explanation = await this.generateExplanation(questionData, wasCorrect, studentAnswer);

      // Fade out loading text
      this.tweens.add({
        targets: loadingText,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          loadingText.destroy();
        }
      });

      // Title
      const titleY = this.gameOffsetY + (size / 2) - 150;
      const titleText = this.add.text(
        this.gameOffsetX + (size / 2),
        titleY,
        'Explanation',
        {
          fontSize: '32px',
          color: '#473025',
          fontFamily: 'Quicksand',
          fontStyle: 'bold',
              align: 'center'
        }
      ).setOrigin(0.5).setDepth(2002).setAlpha(0);

      // Fade in title
      this.tweens.add({
        targets: titleText,
        alpha: 1,
        scale: { from: 0.9, to: 1 },
        duration: 400,
        delay: 200,
        ease: 'Back.easeOut'
      });

      // Answer section - only show for incorrect answers
      let currentY = titleY + 50;
      let correctAnswerLabel: Phaser.GameObjects.Text | undefined;
      let correctAnswerText: Phaser.GameObjects.Text | undefined;

      if (wasCorrect) { // Fixed: Only show if wasCorrect
        // Correct Answer label
        correctAnswerLabel = this.add.text(
          this.gameOffsetX + (size / 2),
          currentY,
          'Correct Answer:',
          {
            fontSize: '16px',
            color: '#03C3A3',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5, 0).setDepth(2002).setAlpha(0);

        currentY += 22;
        correctAnswerText = this.add.text(
          this.gameOffsetX + (size / 2),
          currentY,
          questionData.answer,
          {
            fontSize: '15px',
            color: '#473025',
            fontFamily: 'Quicksand, sans-serif',
            align: 'center',
            wordWrap: { width: size * 0.65, useAdvancedWrap: true }
          }
        ).setOrigin(0.5, 0).setDepth(2002).setAlpha(0);

        // Fade in correct answer
        this.tweens.add({
          targets: [correctAnswerLabel, correctAnswerText],
          alpha: 1,
          duration: 300,
          delay: 300,
          ease: 'Power2'
        });

        currentY += correctAnswerText.height + 15;
      }

      // Explanation text (positioned after answer labels or title if correct)
      if (!wasCorrect) {
        currentY += 10;
      }

      const explanationText = this.add.text(
        this.gameOffsetX + (size / 2),
        currentY,
        explanation,
        {
          fontSize: '16px',
          color: '#473025',
          fontFamily: 'Quicksand',
          fontStyle: 'bold',
              align: 'center',
          wordWrap: { width: size * 0.65, useAdvancedWrap: true },
          lineSpacing: Math.round(16 * 0.31075)
        }
      ).setOrigin(0.5, 0).setDepth(2002).setAlpha(0);

      // Fade in explanation
      this.tweens.add({
        targets: explanationText,
        alpha: 1,
        duration: 400,
        delay: 400,
        ease: 'Power2'
      });

      // Back button - positioned dynamically after explanation text to avoid overlap
      const backButtonY = currentY + explanationText.height + 50;
      const backButton = this.add.image(
        this.gameOffsetX + (size / 2),
        backButtonY,
        'popup-button-orange-big'
      ).setDepth(2002).setAlpha(0).setScale(0.9);
      backButton.setInteractive({ useHandCursor: true });

      const backText = this.add.text(
        this.gameOffsetX + (size / 2),
        backButtonY,
        'Back',
        {
          fontSize: '24px',
          color: '#FFF',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(2003).setAlpha(0).setScale(0.9);

      // Animate button in
      this.tweens.add({
        targets: [backButton, backText],
        alpha: 1,
        scale: 1,
        duration: 300,
        delay: 600,
        ease: 'Back.easeOut'
      });

      // Hover effect
      backButton.on('pointerover', () => backButton.setAlpha(0.8));
      backButton.on('pointerout', () => backButton.setAlpha(1));

      // Back button click
      backButton.on('pointerdown', () => {
        // Collect all elements to fade out
        const elementsToFade = [
          backgroundOverlay,
          popupFrame,
          titleText,
          explanationText,
          backButton,
          backText
        ];

        if (correctAnswerLabel) elementsToFade.push(correctAnswerLabel);
        if (correctAnswerText) elementsToFade.push(correctAnswerText);

        // Fade out explanation overlay
        this.tweens.add({
          targets: elementsToFade,
          alpha: 0,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            // Destroy explanation overlay and all elements
            backgroundOverlay.destroy();
            popupFrame.destroy();
            titleText.destroy();
            correctAnswerLabel?.destroy();
            correctAnswerText?.destroy();
            explanationText.destroy();
            backButton.destroy();
            backText.destroy();

            // Restore previous overlay with fade in
            previousOverlayElements.forEach(el => {
              if ('setVisible' in el && typeof el.setVisible === 'function') {
                el.setVisible(true);
              }
            });

            // Fade in previous overlay elements
            this.tweens.add({
              targets: previousOverlayElements,
              alpha: 1,
              duration: 200,
              ease: 'Power2'
            });
          }
        });
      });

    } catch (error) {
      loadingText.setText('Failed to load explanation. Click Back to return.');
      console.error('Explanation error:', error);

      // Back button for error state
      const backButton = this.add.rectangle(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) + 60,
        200,
        50,
        0x95b607
      ).setDepth(2001);
      backButton.setInteractive({ useHandCursor: true });

      const backText = this.add.text(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) + 60,
        'Back',
        {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(2002);

      backButton.on('pointerdown', () => {
        backgroundOverlay.destroy();
        popupFrame.destroy();
        loadingText.destroy();
        backButton.destroy();
        backText.destroy();
        previousOverlayElements.forEach(el => {
          if ('setVisible' in el && typeof el.setVisible === 'function') {
            el.setVisible(true);
          }
        });
      });
    }
  }

  async generateExplanation(questionData: QuizQuestion, wasCorrect: boolean, studentAnswer?: string): Promise<string> {
    const question = questionData.question;
    const correctAnswer = questionData.answer;
    const options = questionData.options;

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          options,
          correctAnswer,
          wasCorrect,
          studentAnswer
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.explanation;
    } catch (error) {
      console.error('Failed to fetch explanation:', error);
      // Fallback explanation if API fails
      return `The correct answer is "${correctAnswer}".\n\nUnable to load detailed explanation at this time. Please try again later.`;
    }
  }

  /**
   * =============================================================================
   * ANALYTICS SYSTEM - SAVE GAME SESSION
   * =============================================================================
   *
   * This method saves the student's game performance to the database when the
   * game ends (either by winning or losing). It's called automatically from
   * both endGame() and winGame() methods.
   *
   * WHAT IT SAVES:
   * 1. Universal metrics (same for all game types):
   *    - score: Final score achieved
   *    - correctAnswers: Number of questions answered correctly
   *    - totalQuestions: Total number of questions in the quiz
   *    - timeSpent: Time in seconds from game start to game end
   *
   * 2. Snake-specific metrics (stored in metadata JSON):
   *    - longestStreak: Highest consecutive correct answers achieved
   *    - finalLength: Length of the snake when game ended
   *    - totalQuestions: Included in metadata for consistency
   *
   * HOW TO ADAPT FOR YOUR GAME:
   * If you're working on a different game type:
   * 1. Add your game's metrics to lib/game-types.ts
   * 2. Track those metrics as private variables in your scene class
   * 3. Create a similar saveSession() method with your metadata:
   *    const metadata = {
   *      yourMetric1: this.yourValue1,
   *      yourMetric2: this.yourValue2
   *    };
   * 4. Call it when your game ends
   *
   * The analytics dashboard will automatically display your metrics!
   */

  /**
   * Show a styled notification popup
   */
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Remove existing notification if any
    if (this.notificationPopup) {
      this.notificationPopup.destroy();
    }

    const width = this.scale.width;
    const height = this.scale.height;

    // Create container
    this.notificationPopup = this.add.container(width / 2, height / 2);

    // Semi-transparent background overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.5);
    overlay.setOrigin(0.5);

    // Card background
    const cardWidth = Math.min(400, width * 0.8);
    const cardHeight = 180;
    const card = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xfffcf8);
    card.setStrokeStyle(4, 0x473025);

    // Icon based on type
    let iconColor = 0x473025;
    if (type === 'success') iconColor = 0x96b902;
    else if (type === 'error') iconColor = 0xff4880;
    else iconColor = 0xff9f22;

    const icon = this.add.circle(0, -40, 20, iconColor);

    // Message text
    const text = this.add.text(0, 20, message, {
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '16px',
      color: '#473025',
      align: 'center',
      wordWrap: { width: cardWidth - 40 }
    });
    text.setOrigin(0.5);

    // OK button
    const buttonWidth = 100;
    const buttonHeight = 36;
    const button = this.add.rectangle(0, 70, buttonWidth, buttonHeight, 0x96b902);
    button.setStrokeStyle(2, 0x7a9700);
    button.setInteractive({ useHandCursor: true });

    const buttonText = this.add.text(0, 70, 'OK', {
      fontFamily: 'Quicksand, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);

    // Add all to container
    this.notificationPopup.add([overlay, card, icon, text, button, buttonText]);

    // Button click handler
    button.on('pointerdown', () => {
      if (this.notificationPopup) {
        this.notificationPopup.destroy();
        this.notificationPopup = undefined;
      }
    });

    // Button hover effect
    button.on('pointerover', () => {
      button.setFillStyle(0x7a9700);
    });
    button.on('pointerout', () => {
      button.setFillStyle(0x96b902);
    });
  }

  async saveSession() {
    // Only save if we have a gameId (not demo mode)
    // Demo mode doesn't have a gameId because it's not tied to a real game record
    if (!this.gameId) {
      return;
    }

    try {
      // Calculate time spent in seconds
      const timeSpent = this.startTime > 0
        ? Math.floor((Date.now() - this.startTime) / 1000)
        : 0;

      // Calculate mastery accuracy (unique questions / total attempts during mastery)
      const totalUniqueQuestions = this.originalQuizData.questions.length;
      const masteryAccuracy = this.masteryAttempts > 0
        ? (totalUniqueQuestions / this.masteryAttempts) * 100
        : 0;

      // Prepare metadata with Snake-specific statistics
      // These keys must match the metrics defined in lib/game-types.ts for SNAKE
      const metadata = {
        longestStreak: this.longestStreak,
        finalLength: this.snake.length,
        totalQuestions: this.originalQuizData.questions.length,
        gamePhase: this.gamePhase, // Track which phase the game ended in
        masteryCompleted: this.gamePhase === GamePhase.ENDLESS, // True if student completed mastery
        masteryAttempts: this.masteryAttempts, // Total attempts made during mastery phase
        masteryAccuracy: Math.round(masteryAccuracy * 100) / 100 // Accuracy percentage (rounded to 2 decimals)
      };

      // Determine which score to save for leaderboard
      // LEADERBOARD RULE: Only mastery score counts (finalMasteryScore)
      // If student never completed mastery, they won't appear on leaderboard
      const leaderboardScore = this.gamePhase === GamePhase.ENDLESS
        ? this.finalMasteryScore
        : null;

      // DEBUGGING: Log the values being sent to the backend
      console.log('--- DEBUG: Preparing to save session ---');
      console.log('Game Phase:', this.gamePhase);
      console.log('Final Mastery Score:', this.finalMasteryScore);
      console.log('Score being sent for leaderboard:', leaderboardScore);
      console.log('------------------------------------');

      // Dynamically import the server action
      const { saveGameSession } = await import('@/app/actions/game');

      // Call the server action to save the session
      const result = await saveGameSession({
        gameId: this.gameId,
        score: leaderboardScore, // LEADERBOARD: Only set if mastery completed
        endlessHighScore: this.endlessHighScore > 0 ? this.endlessHighScore : null,
        correctAnswers: this.firstTryCorrectCount, // FIRST TRY ONLY: Unique questions answered correctly on first attempt
        totalQuestions: this.originalQuizData.questions.length,
        timeSpent,
        metadata,
        questionAttempts: this.questionAttempts // NEW: All attempts for detailed analytics
      });

      if (!result.success) {
        console.error('Failed to save game session:', result.error);
        this.showNotification('Failed to save your score. Please try again.', 'error');
        this.scoreSaved = false; // Explicitly set to false on failure
      } else if (result.data.sessionId === 'not-tracked') {
        console.log('Game completed (analytics not tracked - not a class member)');
        this.showNotification('Game completed! Your score was not saved because you are not a member of this class.', 'info');
        this.scoreSaved = false; // Not tracked means not saved
      } else {
        console.log('Game session saved successfully!');
        this.showNotification('Game completed! Your score has been saved.', 'success');
        this.scoreSaved = true; // Successfully saved
      }
    } catch (error) {
      console.error('Error saving game session:', error);
    }
  }

  async endGame(reason: string) {
    this.gameOver = true;

    // ANALYTICS SYSTEM - Save game session to database
    // Only save if: (1) not a manual exit, OR (2) manual exit after completing mastery
    const shouldSave = reason !== 'manual_exit' || this.gamePhase === GamePhase.ENDLESS;
    if (shouldSave) {
      await this.saveSession();
    }

    // Handle manual exit: redirect immediately
    if (reason === 'manual_exit') {
      window.location.href = '/student/dashboard';
      return;
    }

    // Hide game elements before showing overlay for cleaner look
    this.snakeGraphics.forEach(g => g.setVisible(false));
    this.apples.forEach(apple => apple.graphics.setVisible(false));

    // Re-enable exit button with high depth so it's clickable over overlay
    this.exitButton.setDepth(9000);
    this.exitButton.setInteractive({ useHandCursor: true });
    if (this.exitText) {
      this.exitText.setDepth(9001);
    }
    this.exitText.setDepth(9001);

    const width = this.scale.width;
    const height = this.scale.height;

        // User-friendly message for collision
        const displayReason = reason === 'collision' ? 'You Crashed!' : (reason === 'wrong_answer' ? 'Wrong Answer!' : reason);
    
        // Show Game Over Modal
        this.showGameOverModal(displayReason);
      }
    
      /**
       * Show rich Game Over modal
       */
      private showGameOverModal(reason: string): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const modalWidth = Math.min(width * 0.9, 400); // Reduced width
    const modalHeight = Math.min(height * 0.8, 350); // Adjusted height
    const modalCenterX = width / 2;
    const modalCenterY = height / 2;

    // Container
    const container = this.add.container(modalCenterX, modalCenterY).setDepth(5000);
    container.setScale(0).setAlpha(0);

    // Shadow
    const shadow = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setInteractive();
    container.add(shadow);

    // Background
    const bg = this.add.image(0, 0, 'popup-bg').setDisplaySize(modalWidth, modalHeight);
    container.add(bg);

    // Header
    const headerHeight = 80;
    const headerY = -modalHeight / 2 + headerHeight / 2;
    const header = this.add.image(0, headerY, 'header-bg').setDisplaySize(modalWidth, headerHeight);
    container.add(header);

    const headerText = this.add.text(0, headerY, "GAME OVER!", {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(headerText);

    // Reason Text
    const reasonY = headerY + headerHeight / 2 + 50; // Increased gap
    const reasonText = this.add.text(0, reasonY, reason, {
      fontSize: '36px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(reasonText);

    // Final Score
    const scoreY = reasonY + 50; // Increased gap
    const scoreText = this.add.text(0, scoreY, `Final Score: ${this.score}`, {
      fontSize: '28px',
      color: '#96b902',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(scoreText);

    // Save Status
    const saveStatus = this.scoreSaved ? "Score Saved!" : "Score Not Saved";
    const statusY = scoreY + 40; // Increased gap
    const statusText = this.add.text(0, statusY, saveStatus, {
      fontSize: '16px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'italic'
    }).setOrigin(0.5).setAlpha(0.7);
    container.add(statusText);

    // Buttons
    const buttonY = modalHeight / 2 - 50;
    const buttonGap = 20;
    const btnWidth = (modalWidth - 100) / 2;

    // Play Again (Right) - Green Asset
    const retryBtn = this.add.image(btnWidth / 2 + buttonGap / 2, buttonY, 'popup-button-green-big')
      .setDisplaySize(btnWidth, 60)
      .setInteractive({ useHandCursor: true });
    container.add(retryBtn);

    const retryText = this.add.text(retryBtn.x, retryBtn.y, "Play Again", {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Quicksand', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(retryText);

    // Exit (Left) - Orange Asset
    const exitBtn = this.add.image(-(btnWidth / 2 + buttonGap / 2), buttonY, 'button-orange')
      .setDisplaySize(btnWidth, 60)
      .setInteractive({ useHandCursor: true });
    container.add(exitBtn);

    const exitBtnText = this.add.text(exitBtn.x, exitBtn.y, "Exit", {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Quicksand', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(exitBtnText);

    // Events
    retryBtn.on('pointerdown', () => {
      window.location.reload();
    });

    exitBtn.on('pointerdown', () => {
      window.location.href = '/student/dashboard';
    });

    // Hover
    retryBtn.on('pointerover', () => retryBtn.setAlpha(0.9));
    retryBtn.on('pointerout', () => retryBtn.setAlpha(1));
    exitBtn.on('pointerover', () => exitBtn.setAlpha(0.9));
    exitBtn.on('pointerout', () => exitBtn.setAlpha(1));

    // Animate In
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  winGame() {
    this.gameOver = true;

    // ANALYTICS SYSTEM - Save game session to database
    // This records the student's performance for the analytics dashboard
    this.saveSession();

    // Re-enable exit button so player can exit from win screen
    this.exitButton.setInteractive({ useHandCursor: true });

    const width = this.scale.width;
    const height = this.scale.height;

    // Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Determine completion message based on performance
    const totalQuestions = this.originalQuizData.questions.length;
    const percentage = (this.correctAnswers / totalQuestions) * 100;

    let completionText = 'QUIZ COMPLETE!';
    let completionColor = '#ffffff';

    if (percentage === 100) {
      completionText = 'PERFECT SCORE!';
      completionColor = '#00b894'; // Green
    } else if (percentage >= 80) {
      completionText = 'GREAT JOB!';
      completionColor = '#00b894'; // Green
    } else if (percentage >= 60) {
      completionText = 'GOOD EFFORT!';
      completionColor = '#3498db'; // Blue
    } else if (percentage >= 40) {
      completionText = 'KEEP TRYING!';
      completionColor = '#f39c12'; // Orange
    } else {
      completionText = 'NEED MORE PRACTICE';
      completionColor = '#ff6b6b'; // Red
    }

    // Completion text
    this.add.text(width / 2, height / 2 - 80, completionText, {
      fontSize: '56px',
      color: completionColor,
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Questions correct
    this.add.text(width / 2, height / 2 - 20, `${this.correctAnswers}/${this.originalQuizData.questions.length} Questions Correct`, {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Final score
    this.add.text(width / 2, height / 2 + 40, `Final Score: ${this.score}`, {
      fontSize: '32px',
      color: '#95b607',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Retry button
    const retryButton = this.add.rectangle(width / 2, height / 2 + 130, 200, 50, 0x95b607);
    retryButton.setInteractive({ useHandCursor: true });
    const retryText = this.add.text(width / 2, height / 2 + 130, 'Play Again', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    retryButton.on('pointerdown', () => {
      this.resetGame();
    });

    retryButton.on('pointerover', () => {
      retryButton.setFillStyle(0x7a9405);
    });

    retryButton.on('pointerout', () => {
      retryButton.setFillStyle(0x95b607);
    });
  }



  /**
   * Select the next question based on current game phase
   * MASTERY: Prioritize wrong answers, then new questions
   * ENDLESS: Random selection from all questions
   */
  private selectNextQuestion(): number | null {
    if (this.gamePhase === GamePhase.MASTERY) {
      // Priority 1: Recycle incorrect answers
      if (this.incorrectQuestionPool.length > 0) {
        // Remove and return first incorrect question
        return this.incorrectQuestionPool.shift()!;
      }

      // Priority 2: Find a new question not yet answered correctly
      for (let i = 0; i < this.originalQuizData.questions.length; i++) {
        if (!this.questionsAnsweredCorrectly.has(i)) {
          return i;
        }
      }

      // All questions answered correctly → Transition to endless mode
      this.transitionToEndlessMode();
      // Return null to pause flow while transition modal is shown
      return null;
    } else {
      // ENDLESS mode: Random selection from all questions
      return Math.floor(Math.random() * this.originalQuizData.questions.length);
    }
  }

  /**
   * Transition from Mastery phase to Endless phase
   * Captures final mastery score for leaderboard
   */
  private transitionToEndlessMode(): void {
    this.gamePhase = GamePhase.ENDLESS;
    this.finalMasteryScore = this.score; // Capture leaderboard score

    // Show seamless notification
    this.showEndlessTransitionModal();
  }

  /**
   * Show "Mastery Complete! Entering Endless Mode..." notification
   * Fades in and out without pausing gameplay
   */
  private showPreQuestionModal(): void {
    // Pause game logic
    this.isPausedForQuestion = true;

    // Calculate modal dimensions based on screen size
    const width = this.scale.width;
    const height = this.scale.height;
    const modalWidth = Math.min(width * 0.9, 800); // Wider
    const modalHeight = Math.min(height * 0.9, 600); // Taller
    const modalCenterX = width / 2;
    const modalCenterY = height / 2;

    // Create container
    this.preQuestionModalContainer = this.add.container(modalCenterX, modalCenterY).setDepth(4000);
    
    // Initial state for animation
    this.preQuestionModalContainer.setScale(0);
    this.preQuestionModalContainer.setAlpha(0);

    // Shadow Overlay (Full Screen)
    const shadow = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setInteractive();
    this.preQuestionModalContainer.add(shadow);

    // Modal Background
    const bg = this.add.image(0, 0, 'popup-bg').setDisplaySize(modalWidth, modalHeight);
    this.preQuestionModalContainer.add(bg);

    // Header
    const headerHeight = 80; // Increased height
    const headerY = -modalHeight / 2 + headerHeight / 2; 
    const header = this.add.image(0, headerY, 'header-bg').setDisplaySize(modalWidth, headerHeight); 
    this.preQuestionModalContainer.add(header);

    // Header Text (Just "Question")
    const questionNumText = this.add.text(-30, headerY, "Question", {
      fontSize: '32px', // Increased font size
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.preQuestionModalContainer.add(questionNumText);

    const circleIcon = this.add.image(questionNumText.x + questionNumText.width / 2 + 35, headerY, 'question-circle').setDisplaySize(50, 50); // Increased icon size
    this.preQuestionModalContainer.add(circleIcon);
    
    // Number inside circle
    const circleNum = this.add.text(circleIcon.x, circleIcon.y, `${this.currentQuestionIndex + 1}`, {
      fontSize: '24px', // Increased font size
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.preQuestionModalContainer.add(circleNum);

    // Question Text
    const questionY = headerY + headerHeight / 2 + 30; // Adjusted gap
    const questionText = this.add.text(0, questionY, this.currentQuestion!.question, {
      fontSize: '20px',
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: modalWidth - 60 }
    }).setOrigin(0.5, 0);
    this.preQuestionModalContainer.add(questionText);

    // Answer Legend (2x2 Grid)
    const optionWidth = (modalWidth - 60) / 2 - 10;
    const optionHeight = 150;
    const optionsStartY = questionY + questionText.height + 30 + (optionHeight / 2); // Reduced gap
    const colSpacing = optionWidth + 20;
    const rowSpacing = optionHeight + 20;
    
    this.shuffledOptions.forEach((option, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      
      const xPos = col === 0 ? -colSpacing / 2 : colSpacing / 2;
      const yPos = optionsStartY + (row * rowSpacing);
      
      // Option Box Background
      const box = this.add.image(xPos, yPos, 'question-box').setDisplaySize(optionWidth, optionHeight);
      this.preQuestionModalContainer!.add(box);

      // Fruit Icon (Left side of box)
      const fruitTexture = this.currentFruitMap[option.originalIndex];
      const fruit = this.add.image(xPos - optionWidth / 2 + 30, yPos, fruitTexture).setDisplaySize(30, 30);
      this.preQuestionModalContainer!.add(fruit);

      // Option Text
      const optionText = this.add.text(xPos - optionWidth / 2 + 60, yPos, option.option, {
        fontSize: '16px', // Increased font size
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        wordWrap: { width: optionWidth - 70 },
        align: 'left'
      }).setOrigin(0, 0.5);
      this.preQuestionModalContainer!.add(optionText);
    });

    // Start Button
    const buttonY = modalHeight / 2 - 50;
    const startBtn = this.add.image(0, buttonY, 'button-orange').setDisplaySize(200, 60).setInteractive({ useHandCursor: true });
    this.preQuestionModalContainer.add(startBtn);

    const startText = this.add.text(0, buttonY, "I'm Ready", {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.preQuestionModalContainer.add(startText);

    // Start Interactivity
    startBtn.on('pointerdown', () => {
      this.preQuestionModalContainer!.destroy();
      this.startRound();
    });
    
    // Add hover effect
    startBtn.on('pointerover', () => startBtn.setAlpha(0.9));
    startBtn.on('pointerout', () => startBtn.setAlpha(1));

    // Animate In
    this.tweens.add({
      targets: this.preQuestionModalContainer,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Show "Endless Mode" transition modal
   */
  private showEndlessTransitionModal(): void {
    // Pause game logic
    this.isPausedForQuestion = true;

    const width = this.scale.width;
    const height = this.scale.height;
    const modalWidth = Math.min(width * 0.9, 600);
    const modalHeight = Math.min(height * 0.8, 500);
    const modalCenterX = width / 2;
    const modalCenterY = height / 2;

    // Container
    const container = this.add.container(modalCenterX, modalCenterY).setDepth(5000); // Higher than PreQuestionModal (4000)
    container.setScale(0).setAlpha(0);

    // Shadow
    const shadow = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setInteractive();
    container.add(shadow);

    // Background
    const bg = this.add.image(0, 0, 'popup-bg').setDisplaySize(modalWidth, modalHeight);
    container.add(bg);

    // Header
    const headerHeight = 80;
    const headerY = -modalHeight / 2 + headerHeight / 2;
    const header = this.add.image(0, headerY, 'header-bg').setDisplaySize(modalWidth, headerHeight);
    container.add(header);

    const headerText = this.add.text(0, headerY, "Endless Mode Unlocked!", {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(headerText);

    // Body Text
    const bodyY = headerY + headerHeight / 2 + 40;
    const bodyText = this.add.text(0, bodyY, 
      "Congratulations! You've mastered all the questions.\n\n" +
      "Now enter Endless Mode to compete for the high score.\n\n" +
      "RULES:\n" +
      "• Questions are random\n" +
      "• One mistake = Game Over\n" +
      "• Wall collision = Game Over", 
      {
        fontSize: '20px',
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: modalWidth - 80 },
        lineSpacing: 10
      }
    ).setOrigin(0.5, 0);
    container.add(bodyText);

    // Buttons
    const buttonY = modalHeight / 2 - 60;
    const buttonGap = 20;
    const btnWidth = (modalWidth - 100) / 2;

    // Continue Button (Right)
    const continueBtn = this.add.image(btnWidth / 2 + buttonGap / 2, buttonY, 'button-orange')
      .setDisplaySize(btnWidth, 60)
      .setInteractive({ useHandCursor: true });
    container.add(continueBtn);

    const continueText = this.add.text(continueBtn.x, continueBtn.y, "Start Endless", {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Quicksand', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(continueText);

    // Exit Button (Left)
    const exitBtn = this.add.image(-(btnWidth / 2 + buttonGap / 2), buttonY, 'button-orange')
      .setDisplaySize(btnWidth, 60)
      .setInteractive({ useHandCursor: true })
      .setTint(0xff6b6b); // Tint red for exit
    container.add(exitBtn);

    const exitText = this.add.text(exitBtn.x, exitBtn.y, "Finish & Save", {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Quicksand', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(exitText);

    // Events
    continueBtn.on('pointerdown', () => {
      container.destroy();
      
      // Continue flow: Show next question (PreQuestionModal)
      // Since we are now in ENDLESS phase, showQuestion -> selectNextQuestion will return a valid index.
      this.showQuestion();
    });

    exitBtn.on('pointerdown', () => {
      this.endGame('manual_exit');
    });

    // Hover
    continueBtn.on('pointerover', () => continueBtn.setAlpha(0.9));
    continueBtn.on('pointerout', () => continueBtn.setAlpha(1));
    exitBtn.on('pointerover', () => exitBtn.setAlpha(0.9));
    exitBtn.on('pointerout', () => exitBtn.setAlpha(1));

    // Animate In
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Reset game state and shuffle questions for retry
   */
  private resetGame() {
    // Shuffle questions
    const shuffledQuestions = this.shuffleArray(this.originalQuizData.questions);
    this.originalQuizData = {
      questions: shuffledQuestions
    };

    // Reset game state
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.displayedScore = 0;
    this.streak = 0;
    this.correctAnswers = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.isPausedForQuestion = false;
    this.direction = Direction.RIGHT;
    this.nextDirection = Direction.RIGHT;

    // Clear existing graphics
    this.snakeGraphics.forEach(g => g.destroy());
    this.snakeGraphics = [];
    this.apples.forEach(apple => apple.graphics.destroy());
    this.apples = [];
    if (this.questionPanel) {
      this.questionPanel.destroy();
    }

    // Reset snake to center
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    this.snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY }
    ];

    // Update score and streak displays
    this.scoreText.setText('Score: 0');
    this.updateCoinPosition();
    this.streakText.setText('Streak: 0');

    // Redraw snake
    this.drawSnake();

    // Restart scene (clean slate)
    this.scene.restart({ quiz: this.originalQuizData });
  }

  // =============================================================================
  // MOBILE SUPPORT
  // =============================================================================

  private setupMobileSupport() {
    // Detect if device is mobile/touch
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!this.isMobile) {
      return; // Desktop - no mobile features needed
    }

    // Prevent default touch behaviors (pull-to-refresh, back-swipe)
    this.preventBrowserGestures();

    // Setup swipe controls
    this.setupSwipeControls();

    // Setup visibility change detection (tab/app switch)
    this.setupVisibilityDetection();
  }

  private preventBrowserGestures() {
    // Prevent pull-to-refresh and other touch gestures
    const gameCanvas = this.game.canvas;

    gameCanvas.style.touchAction = 'none';

    // Prevent default on touchmove to stop scrolling
    gameCanvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    // Prevent context menu on long press
    gameCanvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private setupSwipeControls() {
    // Track swipe start
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
    });

    // Detect swipe on pointer up
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const swipeEndX = pointer.x;
      const swipeEndY = pointer.y;

      const deltaX = swipeEndX - this.swipeStartX;
      const deltaY = swipeEndY - this.swipeStartY;

      // Minimum swipe distance threshold
      const minSwipeDistance = 30;

      // Calculate swipe distance
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < minSwipeDistance) {
        return; // Too short, not a swipe
      }

      // Determine swipe direction (use dominant axis)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && this.direction !== Direction.LEFT) {
          this.nextDirection = Direction.RIGHT;
        } else if (deltaX < 0 && this.direction !== Direction.RIGHT) {
          this.nextDirection = Direction.LEFT;
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && this.direction !== Direction.UP) {
          this.nextDirection = Direction.DOWN;
        } else if (deltaY < 0 && this.direction !== Direction.DOWN) {
          this.nextDirection = Direction.UP;
        }
      }
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;

    // Recalculate panel width for new screen size
    let panelWidth = 400;
    if (this.isMobile && width < 1024) {
      panelWidth = Math.max(220, Math.min(280, width * 0.25));
    }

    // Note: We DON'T call showQuestion() here because that would create duplicate overlays
    // The question panel will be recreated naturally when the next question is shown
  }

  private setupVisibilityDetection() {
    this.visibilityHandler = () => {
      if (document.hidden) {
        // Tab/app switched away - pause game (only if game has started)
        if (this.gameStarted && !this.gameOver) {
          this.isPausedForVisibility = true;
        }
      } else {
        // Tab/app returned - resume immediately
        this.isPausedForVisibility = false;
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  // Clean up event listeners when scene is destroyed
  shutdown() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }
}
