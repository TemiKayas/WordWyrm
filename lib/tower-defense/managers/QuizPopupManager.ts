import * as Phaser from 'phaser';

export interface QuizConfig {
  question: string;
  options: string[];
  correctAnswer: string;
  headerText?: string; // Default: "Quiz Question"
  headerColor?: number; // Default: Green (0x96b902)
  explanation?: string; // Optional pre-loaded explanation text
  onCorrect: () => void;
  onIncorrect: () => void;
  timer?: number; // Optional timer in seconds (e.g. for Boss)
  onTimeout?: () => void; // Optional callback for timer expiry
}

type LayoutMode = 'vertical' | 'horizontal';

// Constants for button sizing
const MAX_BUTTON_WIDTH = 300; // Prevent "long bar" buttons
const CONTENT_PADDING = 20;   // Standard content padding

export class QuizPopupManager {
  private scene: Phaser.Scene;
  private activePopupContainer?: Phaser.GameObjects.Container;
  private activeOverlay?: Phaser.GameObjects.Rectangle;
  private activeTimerEvent?: Phaser.Time.TimerEvent;
  private lastConfig?: QuizConfig; // Store config for rebuild on resize
  private buttons: Phaser.GameObjects.Container[] = [];
  private panelWidth: number = 0;
  private panelHeight: number = 0;
  private studentAnswer: string = ''; // Track what student selected
  private explanationOverlay?: Phaser.GameObjects.Container; // Explanation popup container

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Determine layout mode based on screen dimensions
   */
  private getLayoutMode(): LayoutMode {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    if (width > height && width < 800) {
      return 'horizontal';
    }
    return 'vertical';
  }

  /**
   * Calculate font size that fits text within a given height
   */
  private fitTextToHeight(
    text: string,
    maxWidth: number,
    maxHeight: number,
    startSize: number,
    minSize: number
  ): number {
    let fontSize = startSize;

    const tempText = this.scene.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Quicksand, sans-serif',
      wordWrap: { width: maxWidth },
      resolution: 2
    });

    while (tempText.height > maxHeight && fontSize > minSize) {
      fontSize -= 1;
      tempText.setFontSize(fontSize);
    }

    tempText.destroy();
    return fontSize;
  }

  /**
   * Generate AI explanation via API call
   */
  private async generateExplanation(
    question: string,
    options: string[],
    correctAnswer: string,
    studentAnswer: string,
    wasCorrect: boolean
  ): Promise<string> {
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          options,
          correctAnswer,
          studentAnswer,
          wasCorrect
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      return data.explanation || `The correct answer is "${correctAnswer}".`;
    } catch (error) {
      console.error('Failed to generate explanation:', error);
      return `The correct answer is "${correctAnswer}". Unable to load detailed explanation at this time.`;
    }
  }

  /**
   * Show a quiz popup with the given configuration
   */
  show(config: QuizConfig) {
    this.lastConfig = config;
    this.buttons = [];
    this.studentAnswer = '';

    this.close();

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background Overlay
    const overlay = this.scene.add.rectangle(centerX, centerY, width, height, 0x000000, 0);
    overlay.setDepth(10000);
    this.activeOverlay = overlay;

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.85,
      duration: 200,
      ease: 'Power1'
    });

    // Safe Zone Constraint
    const maxPanelWidth = Math.min(width * 0.85, 1200);
    const maxPanelHeight = height * 0.90;

    const layoutMode = this.getLayoutMode();

    let contentElements: Phaser.GameObjects.GameObject[];

    if (layoutMode === 'horizontal') {
      contentElements = this.buildHorizontalLayout(config, maxPanelWidth, maxPanelHeight);
    } else {
      contentElements = this.buildVerticalLayout(config, maxPanelWidth, maxPanelHeight);
    }

    const panel = this.scene.add.rectangle(0, 0, this.panelWidth, this.panelHeight, 0xfffaf2);
    panel.setStrokeStyle(4, 0xc4a46f);

    const shadow = this.scene.add.rectangle(4, 4, this.panelWidth, this.panelHeight, 0x000000, 0.3);

    const finalChildren = [shadow, panel, ...contentElements];

    this.activePopupContainer = this.scene.add.container(centerX, centerY, finalChildren);
    this.activePopupContainer.setDepth(10001);

    this.activePopupContainer.setScale(0.9);
    this.scene.tweens.add({
      targets: this.activePopupContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Timer Event
    if (config.timer && config.onTimeout) {
      let timeLeft = config.timer;
      const timerTextObj = contentElements.find(el =>
        el instanceof Phaser.GameObjects.Text &&
        (el as Phaser.GameObjects.Text).text.startsWith('Time:')
      ) as Phaser.GameObjects.Text | undefined;

      this.activeTimerEvent = this.scene.time.addEvent({
        delay: 1000,
        callback: () => {
          timeLeft--;
          if (timerTextObj) timerTextObj.setText(`Time: ${timeLeft}s`);
          if (timeLeft <= 0) {
            this.activeTimerEvent?.remove();
            config.onTimeout?.();
            this.close();
          }
        },
        repeat: config.timer
      });
    }
  }

  /**
   * Build vertical stack layout (Portrait / Desktop)
   */
  private buildVerticalLayout(
    config: QuizConfig,
    maxWidth: number,
    maxHeight: number
  ): Phaser.GameObjects.GameObject[] {
    const contentElements: Phaser.GameObjects.GameObject[] = [];
    const padding = Math.max(8, maxHeight * 0.015);

    const headerHeight = maxHeight * 0.12;
    const questionHeight = maxHeight * 0.38;
    const answerHeight = maxHeight * 0.42;
    const spacing = maxHeight * 0.02;

    this.panelWidth = Math.max(280, maxWidth);
    this.panelHeight = maxHeight;

    const halfHeight = this.panelHeight / 2;

    // Header
    const headerY = -halfHeight + headerHeight / 2;
    const headerColor = config.headerColor ?? 0x96b902;
    const headerBg = this.scene.add.rectangle(0, headerY, this.panelWidth, headerHeight, headerColor);

    const headerFontSize = Math.max(16, Math.min(24, headerHeight * 0.4));
    const headerTextStr = config.headerText ?? 'Quiz Question';
    const headerText = this.scene.add.text(0, headerY, headerTextStr, {
      fontSize: `${headerFontSize}px`,
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    contentElements.push(headerBg, headerText);

    if (config.timer) {
      const timerFontSize = Math.max(12, headerFontSize * 0.7);
      const timerText = this.scene.add.text(0, headerY + headerHeight * 0.3, `Time: ${config.timer}s`, {
        fontSize: `${timerFontSize}px`,
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        resolution: 2
      }).setOrigin(0.5);
      contentElements.push(timerText);
    }

    // Question
    const questionAreaTop = -halfHeight + headerHeight + spacing;
    const questionAreaCenter = questionAreaTop + questionHeight / 2;

    const questionMaxWidth = this.panelWidth - padding * 4;
    const questionFontSize = this.fitTextToHeight(
      config.question,
      questionMaxWidth,
      questionHeight - padding * 2,
      Math.min(22, questionHeight * 0.15),
      12
    );

    const questionText = this.scene.add.text(0, questionAreaCenter, config.question, {
      fontSize: `${questionFontSize}px`,
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: questionMaxWidth },
      resolution: 2
    }).setOrigin(0.5);
    contentElements.push(questionText);

    // Answers - 2x2 Grid
    const answerAreaTop = questionAreaTop + questionHeight + spacing;

    const gridPadding = Math.max(6, padding * 0.8);
    const numRows = Math.ceil(config.options.length / 2);
    
    // Constrain button width to prevent "long bars"
    const rawButtonWidth = (this.panelWidth - gridPadding * 3) / 2;
    const buttonWidth = Math.min(rawButtonWidth, 300);
    
    const buttonHeight = Math.min(
      (answerHeight - gridPadding * (numRows + 1)) / numRows,
      60
    );

    const buttonFontSize = Math.max(12, Math.min(16, buttonHeight * 0.35));

    config.options.forEach((option, index) => {
      const isCorrect = option === config.correctAnswer;
      const col = index % 2;
      const row = Math.floor(index / 2);

      // Recalculate X position based on constrained width to ensure centering
      // If buttons are 300px wide but panel is 800px, we need to center the grid
      const totalRowWidth = buttonWidth * 2 + gridPadding;
      const rowStartX = -totalRowWidth / 2 + buttonWidth / 2;
      
      const btnX = rowStartX + col * (buttonWidth + gridPadding);
      const btnY = answerAreaTop + gridPadding + buttonHeight / 2 + row * (buttonHeight + gridPadding);

      const btnContainer = this.createButton(
        btnX, btnY, buttonWidth, buttonHeight, option, buttonFontSize,
        () => {
          this.studentAnswer = option;
          this.handleAnswer(isCorrect, config);
        }
      );

      this.buttons.push(btnContainer);
      contentElements.push(btnContainer);
    });

    return contentElements;
  }

  /**
   * Build horizontal split layout (Landscape Mobile)
   */
  private buildHorizontalLayout(
    config: QuizConfig,
    maxWidth: number,
    maxHeight: number
  ): Phaser.GameObjects.GameObject[] {
    const contentElements: Phaser.GameObjects.GameObject[] = [];
    const padding = Math.max(6, maxHeight * 0.02);

    const headerHeight = maxHeight * 0.15;
    const contentHeight = maxHeight * 0.82;
    const columnWidth = (maxWidth - padding * 3) / 2;

    this.panelWidth = maxWidth;
    this.panelHeight = maxHeight;

    const halfHeight = this.panelHeight / 2;
    const halfWidth = this.panelWidth / 2;

    // Header
    const headerY = -halfHeight + headerHeight / 2;
    const headerColor = config.headerColor ?? 0x96b902;
    const headerBg = this.scene.add.rectangle(0, headerY, this.panelWidth, headerHeight, headerColor);

    const headerFontSize = Math.max(14, Math.min(20, headerHeight * 0.45));
    const headerTextStr = config.headerText ?? 'Quiz Question';
    const headerText = this.scene.add.text(0, headerY, headerTextStr, {
      fontSize: `${headerFontSize}px`,
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    contentElements.push(headerBg, headerText);

    if (config.timer) {
      const timerFontSize = Math.max(10, headerFontSize * 0.65);
      const timerText = this.scene.add.text(halfWidth - padding * 2, headerY, `Time: ${config.timer}s`, {
        fontSize: `${timerFontSize}px`,
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        resolution: 2
      }).setOrigin(1, 0.5);
      contentElements.push(timerText);
    }

    const contentTop = -halfHeight + headerHeight + padding;
    const contentCenterY = contentTop + contentHeight / 2;

    // Left Column: Question
    const leftColumnX = -halfWidth + padding + columnWidth / 2;

    const questionMaxWidth = columnWidth - padding * 2;
    const questionFontSize = this.fitTextToHeight(
      config.question,
      questionMaxWidth,
      contentHeight - padding * 2,
      Math.min(18, contentHeight * 0.1),
      11
    );

    const questionText = this.scene.add.text(leftColumnX, contentCenterY, config.question, {
      fontSize: `${questionFontSize}px`,
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: questionMaxWidth },
      resolution: 2
    }).setOrigin(0.5);
    contentElements.push(questionText);

    // Right Column: Answer Grid
    const rightColumnX = halfWidth - padding - columnWidth / 2;
    const gridPadding = Math.max(4, padding * 0.6);

    const numOptions = config.options.length;
    const useGrid = numOptions === 4;

    let buttonWidth: number;
    let buttonHeight: number;

    if (useGrid) {
      // Cap button width to prevent "long bar" buttons
      const calcWidth = (columnWidth - gridPadding * 3) / 2;
      buttonWidth = Math.min(calcWidth, MAX_BUTTON_WIDTH / 2);
      buttonHeight = Math.min((contentHeight - gridPadding * 3) / 2, 55);
    } else {
      // Cap button width for single column
      const calcWidth = columnWidth - gridPadding * 2;
      buttonWidth = Math.min(calcWidth, MAX_BUTTON_WIDTH);
      buttonHeight = Math.min((contentHeight - gridPadding * (numOptions + 1)) / numOptions, 50);
    }

    const buttonFontSize = Math.max(10, Math.min(14, buttonHeight * 0.35));
    const gridStartX = rightColumnX - (useGrid ? buttonWidth / 2 + gridPadding / 2 : 0);
    const gridStartY = contentTop + gridPadding;

    config.options.forEach((option, index) => {
      const isCorrect = option === config.correctAnswer;

      let btnX: number;
      let btnY: number;

      if (useGrid) {
        const col = index % 2;
        const row = Math.floor(index / 2);
        btnX = gridStartX + col * (buttonWidth + gridPadding);
        btnY = gridStartY + buttonHeight / 2 + row * (buttonHeight + gridPadding);
      } else {
        btnX = rightColumnX;
        btnY = gridStartY + buttonHeight / 2 + index * (buttonHeight + gridPadding);
      }

      const btnContainer = this.createButton(
        btnX, btnY, buttonWidth, buttonHeight, option, buttonFontSize,
        () => {
          this.studentAnswer = option;
          this.handleAnswer(isCorrect, config);
        }
      );

      this.buttons.push(btnContainer);
      contentElements.push(btnContainer);
    });

    return contentElements;
  }

  /**
   * Create a standardized answer button
   */
  private createButton(
    x: number, y: number, width: number, height: number, text: string, fontSize: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const shadow = this.scene.add.rectangle(x + 2, y + 2, width, height, 0x000000, 0.15);
    const bg = this.scene.add.rectangle(x, y, width, height, 0xfff6e8);
    bg.setStrokeStyle(2, 0xc4a46f);
    bg.setInteractive({ useHandCursor: true });

    const label = this.scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: width - 10 },
      resolution: 2
    }).setOrigin(0.5);

    const container = this.scene.add.container(0, 0, [shadow, bg, label]);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x96b902);
      bg.setStrokeStyle(3, 0x7a9700);
      label.setColor('#ffffff');
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0xfff6e8);
      bg.setStrokeStyle(2, 0xc4a46f);
      label.setColor('#473025');
    });

    bg.on('pointerdown', () => {
      onClick();
    });

    return container;
  }

  /**
   * Handle answer selection - show feedback with Continue/Explanation buttons
   */
  private handleAnswer(isCorrect: boolean, config: QuizConfig) {
    // Stop timer
    if (this.activeTimerEvent) {
      this.activeTimerEvent.remove();
      this.activeTimerEvent = undefined;
    }

    // Disable and fade out all answer buttons
    this.buttons.forEach(btn => {
      const bg = btn.list[1] as Phaser.GameObjects.Rectangle;
      bg.disableInteractive();
    });

    // Fade out answer buttons to make room for feedback
    this.scene.tweens.add({
      targets: this.buttons,
      alpha: 0.15,
      duration: 200,
      ease: 'Power2'
    });

    // Show feedback text - centered in panel
    const feedbackText = isCorrect ? 'Correct!' : 'Incorrect';
    const color = isCorrect ? '#96b902' : '#ef4444';
    const feedbackFontSize = Math.max(18, Math.min(32, this.panelHeight * 0.07));

    const feedback = this.scene.add.text(0, -50, feedbackText, {
      fontSize: `${feedbackFontSize}px`,
      color: color,
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5).setAlpha(0);

    this.activePopupContainer?.add(feedback);

    this.scene.tweens.add({
      targets: feedback,
      alpha: 1,
      duration: 150,
      ease: 'Power2'
    });

    // Create Continue and Explanation buttons - positioned below feedback text
    const buttonWidth = Math.min(130, this.panelWidth * 0.30);
    const buttonHeight = Math.max(38, this.panelHeight * 0.08);
    const buttonFontSize = Math.max(12, Math.min(15, buttonHeight * 0.4));
    const buttonY = 20; // Position below feedback
    const buttonSpacing = 12;

    // Continue button
    const continueBtn = this.createFeedbackButton(
      -buttonWidth / 2 - buttonSpacing / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      'Continue',
      buttonFontSize,
      0x96b902, // Green
      () => {
        if (isCorrect) config.onCorrect();
        else config.onIncorrect();
        this.close();
      }
    );
    this.activePopupContainer?.add(continueBtn);

    // Explanation button
    const explainBtn = this.createFeedbackButton(
      buttonWidth / 2 + buttonSpacing / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      'Explanation',
      buttonFontSize,
      0x3b82f6, // Blue
      () => {
        this.showExplanationOverlay(config, isCorrect);
      }
    );
    this.activePopupContainer?.add(explainBtn);

    // Animate buttons in
    continueBtn.setAlpha(0);
    explainBtn.setAlpha(0);
    this.scene.tweens.add({
      targets: [continueBtn, explainBtn],
      alpha: 1,
      duration: 200,
      delay: 150,
      ease: 'Power2'
    });
  }

  /**
   * Create a feedback action button (Continue/Explanation)
   */
  private createFeedbackButton(
    x: number, y: number, width: number, height: number,
    text: string, fontSize: number, bgColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const shadow = this.scene.add.rectangle(x + 2, y + 2, width, height, 0x000000, 0.2);
    const bg = this.scene.add.rectangle(x, y, width, height, bgColor);
    bg.setStrokeStyle(2, 0xffffff);
    bg.setInteractive({ useHandCursor: true });

    const label = this.scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    const container = this.scene.add.container(0, 0, [shadow, bg, label]);

    bg.on('pointerover', () => {
      bg.setScale(1.05);
      label.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setScale(1);
      label.setScale(1);
    });

    bg.on('pointerdown', () => {
      bg.setScale(0.95);
      label.setScale(0.95);
      onClick();
    });

    return container;
  }

  /**
   * Show explanation overlay with AI-generated content
   */
  private async showExplanationOverlay(config: QuizConfig, wasCorrect: boolean) {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create explanation overlay container
    const overlayWidth = Math.min(width * 0.80, 600);
    const overlayHeight = Math.min(height * 0.85, 500);

    // Background panel
    const panel = this.scene.add.rectangle(0, 0, overlayWidth, overlayHeight, 0xfffaf2);
    panel.setStrokeStyle(4, 0x3b82f6); // Blue border

    const shadow = this.scene.add.rectangle(4, 4, overlayWidth, overlayHeight, 0x000000, 0.3);

    // Header
    const headerHeight = overlayHeight * 0.12;
    const headerY = -overlayHeight / 2 + headerHeight / 2;
    const headerBg = this.scene.add.rectangle(0, headerY, overlayWidth, headerHeight, 0x3b82f6);

    const headerFontSize = Math.max(14, Math.min(20, headerHeight * 0.5));
    const headerText = this.scene.add.text(0, headerY, 'Explanation', {
      fontSize: `${headerFontSize}px`,
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // Loading text
    const contentY = headerY + headerHeight / 2 + 20;
    const contentFontSize = Math.max(12, Math.min(16, overlayHeight * 0.035));
    const loadingText = this.scene.add.text(0, 0, 'Loading explanation...', {
      fontSize: `${contentFontSize}px`,
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'italic',
      align: 'center',
      resolution: 2
    }).setOrigin(0.5);

    // Back button
    const backBtnWidth = Math.min(100, overlayWidth * 0.3);
    const backBtnHeight = Math.max(30, overlayHeight * 0.08);
    const backBtnY = overlayHeight / 2 - backBtnHeight - 15;
    const backBtnFontSize = Math.max(11, Math.min(14, backBtnHeight * 0.45));

    const backBtn = this.createFeedbackButton(
      0, backBtnY, backBtnWidth, backBtnHeight,
      'Back', backBtnFontSize, 0x6b7280,
      () => {
        this.explanationOverlay?.destroy();
        this.explanationOverlay = undefined;
      }
    );

    // Create container
    this.explanationOverlay = this.scene.add.container(centerX, centerY, [
      shadow, panel, headerBg, headerText, loadingText, backBtn
    ]);
    this.explanationOverlay.setDepth(10002);

    // Animate in
    this.explanationOverlay.setScale(0.9);
    this.explanationOverlay.setAlpha(0);
    this.scene.tweens.add({
      targets: this.explanationOverlay,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Fetch explanation from API
    const explanation = await this.generateExplanation(
      config.question,
      config.options,
      config.correctAnswer,
      this.studentAnswer,
      wasCorrect
    );

    // Remove loading text and show actual explanation
    if (this.explanationOverlay) {
      loadingText.destroy();

      // Use strict margins to prevent text bleeding
      const contentMaxWidth = overlayWidth - (CONTENT_PADDING * 3);
      const answerTextMaxWidth = overlayWidth * 0.80; // 80% width for answer labels
      const contentAreaTop = contentY;
      const contentAreaHeight = backBtnY - contentAreaTop - (CONTENT_PADDING * 2);

      // Your answer - with word wrap to prevent bleeding
      const yourAnswerY = contentAreaTop;
      const answerFontSize = Math.max(11, contentFontSize * 0.9);
      const yourAnswerText = this.scene.add.text(0, yourAnswerY, `Your answer: ${this.studentAnswer}`, {
        fontSize: `${answerFontSize}px`,
        color: wasCorrect ? '#16a34a' : '#dc2626',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        wordWrap: { width: answerTextMaxWidth },
        align: 'center',
        resolution: 2
      }).setOrigin(0.5);

      // Correct answer (if different) - with word wrap to prevent bleeding
      let correctAnswerText: Phaser.GameObjects.Text | null = null;
      let nextY = yourAnswerY + yourAnswerText.height + 8;

      if (!wasCorrect) {
        correctAnswerText = this.scene.add.text(0, nextY, `Correct answer: ${config.correctAnswer}`, {
          fontSize: `${answerFontSize}px`,
          color: '#16a34a',
          fontFamily: 'Quicksand, sans-serif',
          fontStyle: 'bold',
          wordWrap: { width: answerTextMaxWidth },
          align: 'center',
          resolution: 2
        }).setOrigin(0.5);
        nextY += correctAnswerText.height + 10;
      }

      // Explanation text
      const explanationFontSize = this.fitTextToHeight(
        explanation,
        contentMaxWidth,
        contentAreaHeight - (wasCorrect ? 40 : 70),
        contentFontSize,
        10
      );

      const explanationTextObj = this.scene.add.text(0, nextY + 10, explanation, {
        fontSize: `${explanationFontSize}px`,
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        align: 'center',
        wordWrap: { width: contentMaxWidth },
        lineSpacing: 4,
        resolution: 2
      }).setOrigin(0.5, 0);

      // Add to container
      this.explanationOverlay.add(yourAnswerText);
      if (correctAnswerText) this.explanationOverlay.add(correctAnswerText);
      this.explanationOverlay.add(explanationTextObj);

      // Fade in content
      yourAnswerText.setAlpha(0);
      explanationTextObj.setAlpha(0);
      if (correctAnswerText) correctAnswerText.setAlpha(0);

      this.scene.tweens.add({
        targets: [yourAnswerText, correctAnswerText, explanationTextObj].filter(Boolean),
        alpha: 1,
        duration: 200,
        ease: 'Power2'
      });
    }
  }

  /**
   * Close and destroy the active popup
   */
  close() {
    if (this.activeTimerEvent) {
      this.activeTimerEvent.remove();
      this.activeTimerEvent = undefined;
    }

    if (this.explanationOverlay) {
      this.explanationOverlay.destroy();
      this.explanationOverlay = undefined;
    }

    if (this.activePopupContainer) {
      this.activePopupContainer.destroy();
      this.activePopupContainer = undefined;
    }

    if (this.activeOverlay) {
      this.activeOverlay.destroy();
      this.activeOverlay = undefined;
    }

    this.buttons = [];
    this.studentAnswer = '';
  }

  /**
   * Handle screen resize
   */
  resize(width: number, height: number) {
    if (this.activePopupContainer && this.lastConfig) {
      this.show(this.lastConfig);
    } else if (this.activeOverlay) {
      const centerX = width / 2;
      const centerY = height / 2;
      this.activeOverlay.setSize(width, height);
      this.activeOverlay.setPosition(centerX, centerY);
    }
  }

  /**
   * Clear stored config
   */
  clearConfig() {
    this.lastConfig = undefined;
  }
}
