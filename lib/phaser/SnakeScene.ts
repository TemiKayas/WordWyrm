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
  private originalQuizData!: Quiz; // Store original for reshuffling
  private currentQuestionIndex = 0;
  private currentQuestion?: QuizQuestion;
  private shuffledOptions: Array<{ option: string; originalIndex: number; color: number }> = [];

  // Timing
  private lastMoveTime = 0;
  private moveDelay = 150; // ms between moves

  // Graphics
  private snakeGraphics: Phaser.GameObjects.Rectangle[] = [];

  // UI Elements
  private questionPanel?: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private score = 0;
  private displayedScore = 0; // For smooth score animation
  private streak = 0; // Consecutive correct answers

  // ANALYTICS SYSTEM - Tracks longest streak for dashboard display
  private longestStreak = 0; // Highest streak achieved during this session

  private correctAnswers = 0; // Total correct answers

  // ANALYTICS SYSTEM - Session tracking variables
  private gameId?: string; // Game ID for saving session (undefined in demo mode)
  private startTime = 0; // Timestamp when game started (for calculating time spent)

  // QUESTION ANALYTICS - Track each individual question response
  private questionResponses: Record<string, {
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    correct: boolean;
  }> = {};

  private exitButton!: Phaser.GameObjects.Rectangle;

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
  private isLandscape = true;
  private orientationOverlay?: Phaser.GameObjects.Container;
  private countdownOverlay?: Phaser.GameObjects.Container;
  private swipeStartX = 0;
  private swipeStartY = 0;
  private isPausedForOrientation = false;
  private isPausedForVisibility = false;
  private visibilityHandler?: () => void;

  // Notification popup
  private notificationPopup?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'SnakeScene' });
  }

  init(data: { quiz: Quiz; gameId?: string }) {
    // ANALYTICS SYSTEM - Store game ID for session saving
    // gameId is passed from the play page through the SnakeGame component
    // If undefined, the game is in demo mode and won't save statistics
    this.gameId = data.gameId;

    // Store original quiz data for reshuffling on retry
    this.originalQuizData = JSON.parse(JSON.stringify(data.quiz));

    // Shuffle questions immediately for first playthrough
    const shuffledQuestions = this.shuffleArray([...this.originalQuizData.questions]);
    this.quizData = {
      questions: shuffledQuestions
    };
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Detect mobile for responsive panel sizing
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Calculate playable area (left side, excluding question panel)
    // Use narrower panel on mobile devices for more game space
    // Panel takes 35% of width on mobile, between 240px-320px, or 400px on desktop
    let panelWidth = 400; // Desktop default
    if (this.isMobile && width < 1024) {
      panelWidth = Math.max(240, Math.min(320, width * 0.35));
    }
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

    // Setup mobile support
    this.setupMobileSupport();

    // Exit button (top left) - always on top
    this.exitButton = this.add.rectangle(70, 30, 120, 40, 0xff4444).setDepth(3000);
    this.exitButton.setInteractive({ useHandCursor: true });
    const exitText = this.add.text(70, 30, 'Exit', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3001);

    this.exitButton.on('pointerdown', () => {
      // Navigate to student dashboard
      if (typeof window !== 'undefined') {
        window.location.href = '/student/dashboard';
      }
    });

    this.exitButton.on('pointerover', () => {
      this.exitButton.setFillStyle(0xcc3333);
    });

    this.exitButton.on('pointerout', () => {
      this.exitButton.setFillStyle(0xff4444);
    });

    // Score display (top right of left panel area)
    this.scoreText = this.add.text(availableWidth - 20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // Streak display (bottom left)
    this.streakText = this.add.text(20, height - 20, 'Streak: 0', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0, 1);

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
      'Eat the apple matching\nthe correct answer!',
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
    if (this.currentQuestionIndex >= this.quizData.questions.length) {
      this.winGame();
      return;
    }

    this.isPausedForQuestion = true;
    this.currentQuestion = this.quizData.questions[this.currentQuestionIndex];

    // Shuffle answer options AND colors
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
    // Use same responsive panel width logic as create()
    let panelWidth = 400; // Desktop default
    if (this.isMobile && width < 1024) {
      panelWidth = Math.max(240, Math.min(320, width * 0.35));
    }
    const leftAreaWidth = width - panelWidth;
    const panelStartX = leftAreaWidth;

    const elements: Phaser.GameObjects.GameObject[] = [];

    // Responsive font sizes
    const questionNumFontSize = panelWidth < 320 ? '12px' : '14px';
    const questionTextFontSize = panelWidth < 320 ? '14px' : '18px';

    // Question number
    const questionNum = this.add.text(
      panelStartX + panelWidth / 2,
      160,
      `Question ${this.currentQuestionIndex + 1}/${this.quizData.questions.length}`,
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
      200,
      this.currentQuestion.question,
      {
        fontSize: questionTextFontSize,
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'left',
        wordWrap: { width: panelWidth - 40 },
        lineSpacing: 3
      }
    ).setOrigin(0.5, 0);
    elements.push(questionText);

    // Answer options with colored squares (using shuffled options)
    // Start after question text with dynamic spacing
    const startY = 200 + questionText.height + 30;
    let currentY = startY;

    // Responsive answer font sizes
    const answerLetterFontSize = panelWidth < 320 ? '13px' : '15px';
    const answerTextFontSize = panelWidth < 320 ? '11px' : '13px';
    const colorBoxSize = panelWidth < 320 ? 24 : 30;
    const answerStartX = panelWidth < 320 ? 60 : 70;
    const answerTextStartX = panelWidth < 320 ? 85 : 100;

    this.shuffledOptions.forEach((shuffledOption, displayIndex) => {
      // Color indicator square (use shuffled color)
      const colorBox = this.add.rectangle(
        panelStartX + 30,
        currentY + 15,
        colorBoxSize,
        colorBoxSize,
        shuffledOption.color
      );

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
          wordWrap: { width: panelWidth - 120 },
          lineSpacing: 2
        }
      ).setOrigin(0, 0);

      elements.push(colorBox, letter, answerText);

      // Calculate dynamic spacing based on text height
      const textHeight = answerText.height;
      const spacing = Math.max(textHeight + 20, 50); // At least 50px, or text height + 20px padding
      currentY += spacing;
    });

    // Position instructions below the last answer option with some spacing
    const instructionsY = currentY + 30;

    // 5-second countdown
    const countdownText = this.add.text(
      panelStartX + panelWidth / 2,
      instructionsY,
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

    // Slide in animation from right
    this.questionPanel.setAlpha(0);
    this.questionPanel.x = 100; // Start 100px to the right
    this.tweens.add({
      targets: this.questionPanel,
      alpha: 1,
      x: 0,
      duration: 500,
      ease: 'Power3.easeOut'
    });

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
    ).setDepth(1000).setAlpha(0); // High depth to always be on top

    // Fade in overlay
    this.tweens.add({
      targets: pauseOverlay,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Elements to clean up later
    const overlayElements: Phaser.GameObjects.GameObject[] = [pauseOverlay];

    if (wasCorrect !== undefined) {
      // Show correct/incorrect feedback with Continue and Explanation buttons
      if (wasCorrect) {
        // "Correct!" text in green
        const correctText = this.add.text(
          this.gameOffsetX + (size / 2),
          this.gameOffsetY + (size / 2) - 120,
          'CORRECT!',
          {
            fontSize: '64px',
            color: '#00b894',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            align: 'center'
          }
        ).setOrigin(0.5).setDepth(1001).setAlpha(0);
        overlayElements.push(correctText);

        // Fade in and scale animation
        this.tweens.add({
          targets: correctText,
          alpha: 1,
          scale: { from: 0.8, to: 1 },
          duration: 400,
          ease: 'Back.easeOut'
        });

        // Points earned
        const pointsText = this.add.text(
          this.gameOffsetX + (size / 2),
          this.gameOffsetY + (size / 2) - 60,
          `+${pointsEarned} points`,
          {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5).setDepth(1001).setAlpha(0);
        overlayElements.push(pointsText);

        // Fade in with delay
        this.tweens.add({
          targets: pointsText,
          alpha: 1,
          duration: 300,
          delay: 200,
          ease: 'Power2'
        });

        // Streak
        const streakDisplayText = this.add.text(
          this.gameOffsetX + (size / 2),
          this.gameOffsetY + (size / 2) - 30,
          `Streak: ${currentStreak}`,
          {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5).setDepth(1001).setAlpha(0);
        overlayElements.push(streakDisplayText);

        // Fade in with delay
        this.tweens.add({
          targets: streakDisplayText,
          alpha: 1,
          duration: 300,
          delay: 300,
          ease: 'Power2'
        });
      }

      // Read the question prompt
      const readPromptText = this.add.text(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) + 20,
        'Read the next question!',
        {
          fontSize: '32px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold',
          align: 'center'
        }
      ).setOrigin(0.5).setDepth(1001).setAlpha(0);
      overlayElements.push(readPromptText);

      // Fade in prompt
      this.tweens.add({
        targets: readPromptText,
        alpha: 1,
        duration: 300,
        delay: 400,
        ease: 'Power2'
      });

      // Continue button
      const continueButton = this.add.rectangle(
        this.gameOffsetX + (size / 2) - 110,
        this.gameOffsetY + (size / 2) + 90,
        200,
        50,
        0x95b607
      ).setDepth(1001).setAlpha(0).setScale(0.9);
      continueButton.setInteractive({ useHandCursor: true });
      overlayElements.push(continueButton);

      const continueText = this.add.text(
        this.gameOffsetX + (size / 2) - 110,
        this.gameOffsetY + (size / 2) + 90,
        'Continue',
        {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(1002).setAlpha(0).setScale(0.9);
      overlayElements.push(continueText);

      // Animate buttons in
      this.tweens.add({
        targets: [continueButton, continueText],
        alpha: 1,
        scale: 1,
        duration: 300,
        delay: 500,
        ease: 'Back.easeOut'
      });

      // Explanation button
      const explainButton = this.add.rectangle(
        this.gameOffsetX + (size / 2) + 110,
        this.gameOffsetY + (size / 2) + 90,
        200,
        50,
        0x3498db
      ).setDepth(1001).setAlpha(0).setScale(0.9);
      explainButton.setInteractive({ useHandCursor: true });
      overlayElements.push(explainButton);

      const explainText = this.add.text(
        this.gameOffsetX + (size / 2) + 110,
        this.gameOffsetY + (size / 2) + 90,
        'Explanation',
        {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(1002).setAlpha(0).setScale(0.9);
      overlayElements.push(explainText);

      // Animate buttons in
      this.tweens.add({
        targets: [explainButton, explainText],
        alpha: 1,
        scale: 1,
        duration: 300,
        delay: 550,
        ease: 'Back.easeOut'
      });

      // Button hover effects
      continueButton.on('pointerover', () => continueButton.setFillStyle(0x7a9405));
      continueButton.on('pointerout', () => continueButton.setFillStyle(0x95b607));
      explainButton.on('pointerover', () => explainButton.setFillStyle(0x2980b9));
      explainButton.on('pointerout', () => explainButton.setFillStyle(0x3498db));

      // Continue button click
      continueButton.on('pointerdown', () => {
        overlayElements.forEach(el => el.destroy());
        this.startRound();
      });

      // Explanation button click
      // Use answeredQuestion if provided (for correct answers), otherwise use currentQuestion (for wrong answers)
      const questionForExplanation = answeredQuestion || this.currentQuestion!;
      explainButton.on('pointerdown', () => {
        this.showExplanation(overlayElements, questionForExplanation, true, questionForExplanation.answer);
      });

    } else {
      // First question - show pause with Continue button (no countdown)
      const pauseText = this.add.text(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) - 40,
        'Read the question!',
        {
          fontSize: '48px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold',
          align: 'center'
        }
      ).setOrigin(0.5).setDepth(1001).setAlpha(0);
      overlayElements.push(pauseText);

      // Fade in with scale
      this.tweens.add({
        targets: pauseText,
        alpha: 1,
        scale: { from: 0.9, to: 1 },
        duration: 400,
        ease: 'Back.easeOut'
      });

      // Continue button
      const continueButton = this.add.rectangle(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) + 60,
        200,
        50,
        0x95b607
      ).setDepth(1001).setAlpha(0).setScale(0.9);
      continueButton.setInteractive({ useHandCursor: true });
      overlayElements.push(continueButton);

      const continueText = this.add.text(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) + 60,
        'Start',
        {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(1002).setAlpha(0).setScale(0.9);
      overlayElements.push(continueText);

      // Animate button in
      this.tweens.add({
        targets: [continueButton, continueText],
        alpha: 1,
        scale: 1,
        duration: 300,
        delay: 300,
        ease: 'Back.easeOut'
      });

      // Button hover
      continueButton.on('pointerover', () => continueButton.setFillStyle(0x7a9405));
      continueButton.on('pointerout', () => continueButton.setFillStyle(0x95b607));

      // Continue click
      continueButton.on('pointerdown', () => {
        overlayElements.forEach(el => el.destroy());
        this.startRound();
      });
    }
  }

  showCorrectFeedback(pointsEarned: number, currentStreak: number) {
    // Save the question we just answered BEFORE incrementing
    const answeredQuestion = this.currentQuestion!;

    // Check if this was the last question
    const isLastQuestion = this.currentQuestionIndex >= this.quizData.questions.length - 1;

    // Increment to next question
    this.currentQuestionIndex++;

    // Show feedback overlay for all correct answers (last or not)
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
    ).setDepth(1000).setAlpha(0);

    // Fade in overlay
    this.tweens.add({
      targets: pauseOverlay,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    const overlayElements: Phaser.GameObjects.GameObject[] = [pauseOverlay];

    // "Correct!" text in green
    const correctText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) - 120,
      'CORRECT!',
      {
        fontSize: '64px',
        color: '#00b894',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1001).setAlpha(0);
    overlayElements.push(correctText);

    // Fade in and scale animation
    this.tweens.add({
      targets: correctText,
      alpha: 1,
      scale: { from: 0.8, to: 1 },
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Points earned
    const pointsText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) - 60,
      `+${pointsEarned} points`,
      {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1001).setAlpha(0);
    overlayElements.push(pointsText);

    // Fade in with delay
    this.tweens.add({
      targets: pointsText,
      alpha: 1,
      duration: 300,
      delay: 200,
      ease: 'Power2'
    });

    // Streak
    const streakDisplayText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) - 30,
      `Streak: ${currentStreak}`,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1001).setAlpha(0);
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
      this.gameOffsetY + (size / 2) + 20,
      isLastQuestion ? 'Quiz Complete!' : 'Read the next question!',
      {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(1001).setAlpha(0);
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
      // Not last question - show Continue and Explanation buttons
      // Continue button
      const continueButton = this.add.rectangle(
        this.gameOffsetX + (size / 2) - 110,
        this.gameOffsetY + (size / 2) + 90,
        200,
        50,
        0x95b607
      ).setDepth(1001).setAlpha(0).setScale(0.9);
      continueButton.setInteractive({ useHandCursor: true });
      overlayElements.push(continueButton);

      const continueText = this.add.text(
        this.gameOffsetX + (size / 2) - 110,
        this.gameOffsetY + (size / 2) + 90,
        'Continue',
        {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(1002).setAlpha(0).setScale(0.9);
      overlayElements.push(continueText);

      // Explanation button
      const explainButton = this.add.rectangle(
        this.gameOffsetX + (size / 2) + 110,
        this.gameOffsetY + (size / 2) + 90,
        200,
        50,
        0x3498db
      ).setDepth(1001).setAlpha(0).setScale(0.9);
      explainButton.setInteractive({ useHandCursor: true });
      overlayElements.push(explainButton);

      const explainText = this.add.text(
        this.gameOffsetX + (size / 2) + 110,
        this.gameOffsetY + (size / 2) + 90,
        'Explanation',
        {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(1002).setAlpha(0).setScale(0.9);
      overlayElements.push(explainText);

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
      continueButton.on('pointerover', () => continueButton.setFillStyle(0x7a9405));
      continueButton.on('pointerout', () => continueButton.setFillStyle(0x95b607));
      explainButton.on('pointerover', () => explainButton.setFillStyle(0x2980b9));
      explainButton.on('pointerout', () => explainButton.setFillStyle(0x3498db));

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
      const viewResultsButton = this.add.rectangle(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) + 90,
        200,
        50,
        0x95b607
      ).setDepth(1001).setAlpha(0).setScale(0.9);
      viewResultsButton.setInteractive({ useHandCursor: true });
      overlayElements.push(viewResultsButton);

      const viewResultsText = this.add.text(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + (size / 2) + 90,
        'View Results',
        {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(1002).setAlpha(0).setScale(0.9);
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
      viewResultsButton.on('pointerover', () => viewResultsButton.setFillStyle(0x7a9405));
      viewResultsButton.on('pointerout', () => viewResultsButton.setFillStyle(0x95b607));

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
    this.shuffledOptions.forEach((shuffledOption, index) => {
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

      // Create apple graphics (use shuffled color)
      const graphics = this.add.rectangle(
        this.gameOffsetX + position.x * this.GRID_SIZE + this.GRID_SIZE / 2,
        this.gameOffsetY + position.y * this.GRID_SIZE + this.GRID_SIZE / 2,
        this.GRID_SIZE - 4,
        this.GRID_SIZE - 4,
        shuffledOption.color
      ).setScale(0);

      // Animate apple spawning with staggered delay
      this.tweens.add({
        targets: graphics,
        scale: 1,
        duration: 300,
        delay: index * 100,
        ease: 'Back.easeOut'
      });

      this.apples.push({
        position,
        color: shuffledOption.color,
        answerIndex: shuffledOption.originalIndex,
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
    if (!this.gameStarted || this.gamePaused || this.gameOver || this.isPausedForQuestion || this.isPausedForOrientation || this.isPausedForVisibility) {
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

    // Wrap around walls (instead of collision)
    if (newHead.x < 0) {
      newHead.x = this.gridWidth - 1; // Left wall → Right side
    } else if (newHead.x >= this.gridWidth) {
      newHead.x = 0; // Right wall → Left side
    }

    if (newHead.y < 0) {
      newHead.y = this.gridHeight - 1; // Top wall → Bottom side
    } else if (newHead.y >= this.gridHeight) {
      newHead.y = 0; // Bottom wall → Top side
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

        // QUESTION ANALYTICS - Record this correct answer
        const selectedAnswer = this.currentQuestion!.options[eatenApple.answerIndex];
        this.questionResponses[`q${this.currentQuestionIndex}`] = {
          questionText: this.currentQuestion!.question,
          selectedAnswer: selectedAnswer,
          correctAnswer: this.currentQuestion!.answer,
          correct: true
        };

        // ANALYTICS SYSTEM - Track longest streak achieved
        // This is saved to the database for analytics dashboard display
        // Updates whenever the current streak surpasses the previous record
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

        // QUESTION ANALYTICS - Record this wrong answer
        this.questionResponses[`q${this.currentQuestionIndex}`] = {
          questionText: this.currentQuestion!.question,
          selectedAnswer: studentAnswer,
          correctAnswer: this.currentQuestion!.answer,
          correct: false
        };

        this.streak = 0; // Reset streak
        this.streakText.setText(`Streak: ${this.streak}`);
        this.wrongAnswer(`Wrong answer! Correct: ${this.currentQuestion!.answer}`, studentAnswer);
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

  handleSelfCollision() {
    // Calculate penalty (20% of current score, don't go negative)
    const penalty = Math.floor(this.score * 0.2);
    this.score = Math.max(0, this.score - penalty);
    this.displayedScore = this.score; // Update displayed score immediately

    // Reset streak
    this.streak = 0;

    // Update UI
    this.scoreText.setText(`Score: ${this.score}`);
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
        x: safePosition.x - i,
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

    const warningText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      penalty > 0 ? `Watch out!\n-${penalty} points` : 'Watch out!',
      {
        fontSize: '32px',
        color: '#ff6b6b',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(3000).setAlpha(0);

    // Fade in and out
    this.tweens.add({
      targets: warningText,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 800,
      onComplete: () => {
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

    // Dark pause-style overlay (matching correct answer style - game area only)
    const wrongOverlay = this.add.rectangle(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      size,
      size,
      0x000000,
      0.6
    ).setDepth(1000).setAlpha(0);

    // Fade in overlay
    this.tweens.add({
      targets: wrongOverlay,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Track elements for cleanup
    const overlayElements: Phaser.GameObjects.GameObject[] = [wrongOverlay];

    // Wrong text (red)
    const wrongText = this.add.text(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2) - 120,
      'INCORRECT!',
      {
        fontSize: '64px',
        color: '#ff6b6b',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1001).setAlpha(0);
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
    const reasonStartY = this.gameOffsetY + (size / 2) - 60;
    const reasonText = this.add.text(
      this.gameOffsetX + (size / 2),
      reasonStartY,
      reason,
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: size - 100 },
        lineSpacing: 4
      }
    ).setOrigin(0.5, 0).setDepth(1001).setAlpha(0);
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
    const buttonsY = promptY + 60;

    // Current score
    const scoreDisplay = this.add.text(
      this.gameOffsetX + (size / 2),
      scoreY,
      `Score: ${this.score}`,
      {
        fontSize: '22px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1001).setAlpha(0);
    overlayElements.push(scoreDisplay);

    // Fade in
    this.tweens.add({
      targets: scoreDisplay,
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
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(1001).setAlpha(0);
    overlayElements.push(readPromptText);

    // Fade in
    this.tweens.add({
      targets: readPromptText,
      alpha: 1,
      duration: 300,
      delay: 400,
      ease: 'Power2'
    });

    // Continue button (left side)
    const continueButton = this.add.rectangle(
      this.gameOffsetX + (size / 2) - 110,
      buttonsY,
      200,
      50,
      0x95b607
    ).setDepth(1001).setAlpha(0).setScale(0.9);
    continueButton.setInteractive({ useHandCursor: true });
    overlayElements.push(continueButton);

    const continueText = this.add.text(
      this.gameOffsetX + (size / 2) - 110,
      buttonsY,
      'Continue',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1002).setAlpha(0).setScale(0.9);
    overlayElements.push(continueText);

    // Animate buttons in
    this.tweens.add({
      targets: [continueButton, continueText],
      alpha: 1,
      scale: 1,
      duration: 300,
      delay: 500,
      ease: 'Back.easeOut'
    });

    // Explanation button (right side)
    const explainButton = this.add.rectangle(
      this.gameOffsetX + (size / 2) + 110,
      buttonsY,
      200,
      50,
      0x3498db
    ).setDepth(1001).setAlpha(0).setScale(0.9);
    explainButton.setInteractive({ useHandCursor: true });
    overlayElements.push(explainButton);

    const explainText = this.add.text(
      this.gameOffsetX + (size / 2) + 110,
      buttonsY,
      'Explanation',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1002).setAlpha(0).setScale(0.9);
    overlayElements.push(explainText);

    // Animate buttons in
    this.tweens.add({
      targets: [explainButton, explainText],
      alpha: 1,
      scale: 1,
      duration: 300,
      delay: 550,
      ease: 'Back.easeOut'
    });

    // Button hover effects
    continueButton.on('pointerover', () => continueButton.setFillStyle(0x7a9405));
    continueButton.on('pointerout', () => continueButton.setFillStyle(0x95b607));
    explainButton.on('pointerover', () => explainButton.setFillStyle(0x2980b9));
    explainButton.on('pointerout', () => explainButton.setFillStyle(0x3498db));

    // Continue button click
    continueButton.on('pointerdown', () => {
      // Remove overlay and buttons
      overlayElements.forEach(el => el.destroy());

      // Move to next question
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex >= this.quizData.questions.length) {
        // If no more questions, end game
        this.winGame();
      } else {
        // Show next question
        this.showQuestion();
      }
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

    // Create explanation overlay (match pause overlay style)
    const explainOverlay = this.add.rectangle(
      this.gameOffsetX + (size / 2),
      this.gameOffsetY + (size / 2),
      size,
      size,
      0x000000,
      0.6
    ).setDepth(2000).setAlpha(0);

    // Fade in overlay
    this.tweens.add({
      targets: explainOverlay,
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
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(2001).setAlpha(0);

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

      // Title (white, not blue)
      const titleY = this.gameOffsetY + 80;
      const titleText = this.add.text(
        this.gameOffsetX + (size / 2),
        titleY,
        'Explanation',
        {
          fontSize: '40px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(2001).setAlpha(0);

      // Fade in title
      this.tweens.add({
        targets: titleText,
        alpha: 1,
        scale: { from: 0.9, to: 1 },
        duration: 400,
        delay: 200,
        ease: 'Back.easeOut'
      });

      // Correct Answer label
      let currentY = titleY + 60;
      const correctAnswerLabel = this.add.text(
        this.gameOffsetX + (size / 2),
        currentY,
        'Correct Answer:',
        {
          fontSize: '16px',
          color: '#00b894',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5, 0).setDepth(2001).setAlpha(0);

      currentY += 25;
      const correctAnswerText = this.add.text(
        this.gameOffsetX + (size / 2),
        currentY,
        questionData.answer,
        {
          fontSize: '15px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          align: 'center',
          wordWrap: { width: size - 120 }
        }
      ).setOrigin(0.5, 0).setDepth(2001).setAlpha(0);

      // Fade in correct answer
      this.tweens.add({
        targets: [correctAnswerLabel, correctAnswerText],
        alpha: 1,
        duration: 300,
        delay: 300,
        ease: 'Power2'
      });

      // Your answer label
      currentY += correctAnswerText.height + 20;
      const yourAnswerLabel = this.add.text(
        this.gameOffsetX + (size / 2),
        currentY,
        'You Chose:',
        {
          fontSize: '16px',
          color: wasCorrect ? '#00b894' : '#ff6b6b',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5, 0).setDepth(2001).setAlpha(0);

      currentY += 25;
      const yourAnswerText = this.add.text(
        this.gameOffsetX + (size / 2),
        currentY,
        studentAnswer || questionData.answer,
        {
          fontSize: '15px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          align: 'center',
          wordWrap: { width: size - 120 }
        }
      ).setOrigin(0.5, 0).setDepth(2001).setAlpha(0);

      // Fade in your answer
      this.tweens.add({
        targets: [yourAnswerLabel, yourAnswerText],
        alpha: 1,
        duration: 300,
        delay: 350,
        ease: 'Power2'
      });

      // Explanation text (positioned after answer labels)
      currentY += yourAnswerText.height + 25;
      const explanationText = this.add.text(
        this.gameOffsetX + (size / 2),
        currentY,
        explanation,
        {
          fontSize: '15px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          align: 'left',
          wordWrap: { width: size - 120 },
          lineSpacing: 3
        }
      ).setOrigin(0.5, 0).setDepth(2001).setAlpha(0);

      // Fade in explanation
      this.tweens.add({
        targets: explanationText,
        alpha: 1,
        duration: 400,
        delay: 400,
        ease: 'Power2'
      });

      // Back button
      const backButton = this.add.rectangle(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + size - 80,
        200,
        50,
        0x95b607
      ).setDepth(2001).setAlpha(0).setScale(0.9);
      backButton.setInteractive({ useHandCursor: true });

      const backText = this.add.text(
        this.gameOffsetX + (size / 2),
        this.gameOffsetY + size - 80,
        'Back',
        {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setDepth(2002).setAlpha(0).setScale(0.9);

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
      backButton.on('pointerover', () => backButton.setFillStyle(0x7a9405));
      backButton.on('pointerout', () => backButton.setFillStyle(0x95b607));

      // Back button click
      backButton.on('pointerdown', () => {
        // Destroy explanation overlay and all elements
        explainOverlay.destroy();
        titleText.destroy();
        correctAnswerLabel.destroy();
        correctAnswerText.destroy();
        yourAnswerLabel.destroy();
        yourAnswerText.destroy();
        explanationText.destroy();
        backButton.destroy();
        backText.destroy();

        // Restore previous overlay
        previousOverlayElements.forEach(el => {
          if ('setVisible' in el && typeof el.setVisible === 'function') {
            el.setVisible(true);
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
        explainOverlay.destroy();
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

      // Prepare metadata with Snake-specific statistics
      // These keys must match the metrics defined in lib/game-types.ts for SNAKE
      const metadata = {
        longestStreak: this.longestStreak,      // Tracked in correct answer handler
        finalLength: this.snake.length,         // Current snake length at game end
        totalQuestions: this.quizData.questions.length
      };

      // Dynamically import the server action to avoid bundling issues
      // This prevents the server action from being bundled into the client code
      const { saveGameSession } = await import('@/app/actions/game');

      // Call the server action to save the session
      // The server action handles authentication and database writes
      // Only class members will have their analytics tracked
      const result = await saveGameSession({
        gameId: this.gameId,
        score: this.score,
        correctAnswers: this.correctAnswers,
        totalQuestions: this.quizData.questions.length,
        timeSpent,
        metadata,  // Snake-specific stats go here
        questionResponses: this.questionResponses  // QUESTION ANALYTICS - Individual question data
      });

      if (!result.success) {
        console.error('Failed to save game session:', result.error);
        this.showNotification('Failed to save your score. Please try again.', 'error');
      } else if (result.data.sessionId === 'not-tracked') {
        console.log('Game completed (analytics not tracked - not a class member)');
        this.showNotification('Game completed! Your score was not saved because you are not a member of this class.', 'info');
      } else {
        console.log('Game session saved successfully!');
        this.showNotification('Game completed! Your score has been saved.', 'success');
      }
    } catch (error) {
      console.error('Error saving game session:', error);
    }
  }

  endGame(reason: string) {
    this.gameOver = true;

    // ANALYTICS SYSTEM - Save game session to database
    // This records the student's performance for the analytics dashboard
    this.saveSession();

    // Disable exit button
    this.exitButton.disableInteractive();

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
    const totalQuestions = this.quizData.questions.length;
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
    this.add.text(width / 2, height / 2 - 20, `${this.correctAnswers}/${this.quizData.questions.length} Questions Correct`, {
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
   * Shuffle array using Fisher-Yates algorithm
   */
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
    this.quizData = {
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
    this.streakText.setText('Streak: 0');

    // Redraw snake
    this.drawSnake();

    // Restart scene (clean slate)
    this.scene.restart({ quiz: this.quizData });
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

    // Setup orientation detection
    this.setupOrientationDetection();

    // Setup visibility change detection (tab/app switch)
    this.setupVisibilityDetection();

    // Check initial orientation
    this.checkOrientation();
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

  private setupOrientationDetection() {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      // Small delay to let the browser update dimensions
      setTimeout(() => this.checkOrientation(), 100);
    });

    // Also listen for resize as fallback
    window.addEventListener('resize', () => {
      setTimeout(() => this.checkOrientation(), 100);
    });
  }

  private checkOrientation() {
    if (!this.isMobile) return;

    const wasLandscape = this.isLandscape;
    this.isLandscape = window.innerWidth > window.innerHeight;

    if (!this.isLandscape) {
      // Portrait mode - show rotate prompt
      this.showOrientationOverlay();
    } else if (wasLandscape === false && this.isLandscape) {
      // Just rotated to landscape - show countdown
      this.hideOrientationOverlay();
      this.showCountdownOverlay();
    }
  }

  private showOrientationOverlay() {
    if (this.orientationOverlay) return; // Already showing

    this.isPausedForOrientation = true;

    const width = this.scale.width;
    const height = this.scale.height;

    const elements: Phaser.GameObjects.GameObject[] = [];

    // Dark overlay
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.9
    ).setDepth(5000);
    elements.push(overlay);

    // Rotate icon (using text as placeholder)
    const rotateIcon = this.add.text(
      width / 2,
      height / 2 - 60,
      '📱↔️',
      {
        fontSize: '64px'
      }
    ).setOrigin(0.5).setDepth(5001);
    elements.push(rotateIcon);

    // Message
    const message = this.add.text(
      width / 2,
      height / 2 + 20,
      'Please rotate your device\nto landscape mode to play',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(5001);
    elements.push(message);

    this.orientationOverlay = this.add.container(0, 0, elements);
  }

  private hideOrientationOverlay() {
    if (this.orientationOverlay) {
      this.orientationOverlay.destroy();
      this.orientationOverlay = undefined;
    }
    this.isPausedForOrientation = false;
  }

  private showCountdownOverlay() {
    if (this.countdownOverlay) return;

    const width = this.scale.width;
    const height = this.scale.height;

    const elements: Phaser.GameObjects.GameObject[] = [];

    // Semi-transparent overlay
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.7
    ).setDepth(4000);
    elements.push(overlay);

    // Countdown text
    const countdownText = this.add.text(
      width / 2,
      height / 2,
      '3',
      {
        fontSize: '120px',
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(4001);
    elements.push(countdownText);

    this.countdownOverlay = this.add.container(0, 0, elements);

    // Countdown sequence
    let count = 3;

    const countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        count--;
        if (count > 0) {
          countdownText.setText(count.toString());
          // Pulse animation
          this.tweens.add({
            targets: countdownText,
            scale: { from: 1.2, to: 1 },
            duration: 300,
            ease: 'Power2'
          });
        } else {
          // Countdown finished
          this.hideCountdownOverlay();
        }
      },
      repeat: 2
    });
  }

  private hideCountdownOverlay() {
    if (this.countdownOverlay) {
      this.countdownOverlay.destroy();
      this.countdownOverlay = undefined;
    }
    this.isPausedForVisibility = false;
  }

  private setupVisibilityDetection() {
    this.visibilityHandler = () => {
      if (document.hidden) {
        // Tab/app switched away - pause game (only if game has started)
        if (this.gameStarted && !this.gameOver) {
          this.isPausedForVisibility = true;
        }
      } else {
        // Tab/app returned
        if (this.isPausedForVisibility) {
          if (this.gameStarted && !this.gameOver) {
            // Game is running - show countdown before resuming
            this.showCountdownOverlay();
          } else {
            // Game hasn't started or already ended - just reset the flag
            this.isPausedForVisibility = false;
          }
        }
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
