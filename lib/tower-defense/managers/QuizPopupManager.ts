import * as Phaser from 'phaser';
import { getResponsiveFontSize } from '@/lib/tower-defense/config/GameConfig';

export interface QuizConfig {
  question: string;
  options: string[];
  correctAnswer: string;
  headerText?: string; // Default: "Quiz Question"
  headerColor?: number; // Default: Green (0x96b902)
  explanation?: string; // Optional explanation text
  onCorrect: () => void;
  onIncorrect: () => void;
  timer?: number; // Optional timer in seconds (e.g. for Boss)
  onTimeout?: () => void; // Optional callback for timer expiry
}

export class QuizPopupManager {
  private scene: Phaser.Scene;
  private activePopupContainer?: Phaser.GameObjects.Container;
  private activeOverlay?: Phaser.GameObjects.Rectangle;
  private activeTimerEvent?: Phaser.Time.TimerEvent;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Show a quiz popup with the given configuration
   */
  show(config: QuizConfig) {
    // Close any existing popup first
    this.close();

    // Pause the game/UI underneath
    // (Note: The caller is responsible for pausing scene update logic if needed, 
    // e.g. setting this.questionPopupActive = true)

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Background Overlay
    const overlay = this.scene.add.rectangle(centerX, centerY, width, height, 0x000000, 0);
    overlay.setDepth(10000);
    this.activeOverlay = overlay;

    // Fade in overlay
    this.scene.tweens.add({
      targets: overlay,
      alpha: 0.85,
      duration: 200,
      ease: 'Power1'
    });

    // 2. Panel Configuration
    // Mobile-first responsive sizing
    const isMobile = width < 768; // Detect mobile/tablet
    const panelWidth = isMobile
      ? width * 0.95  // 95% width on mobile for maximum space
      : Math.min(700, width * 0.85); // Larger on desktop

    // 3. Vertical Stack Layout Calculation
    let currentY = 0; // Relative Y position inside the container
    const padding = isMobile ? 24 : 20; // Larger padding on mobile
    const contentElements: Phaser.GameObjects.GameObject[] = [];

    // --- Header ---
    const headerHeight = isMobile ? 100 : 80; // Taller header on mobile
    // Header background (temporarily positioned at 0,0, will be adjusted later)
    const headerColor = config.headerColor ?? 0x96b902; // Default green
    const headerBg = this.scene.add.rectangle(0, 0, panelWidth, headerHeight, headerColor);
    
    const headerLineY = headerHeight / 2;
    const headerLine = this.scene.add.rectangle(0, headerLineY, panelWidth - 40, 4, 0xc4a46f);

    // Header Text
    const headerTextStr = config.headerText ?? 'Quiz Question';
    const headerFontSize = isMobile ? getResponsiveFontSize(24, height) : getResponsiveFontSize(18, height);
    const headerText = this.scene.add.text(0, 0, headerTextStr, {
      fontSize: headerFontSize,
      color: '#ffffff',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);

    // Timer Text (if applicable)
    let timerText: Phaser.GameObjects.Text | undefined;
    if (config.timer) {
      const timerFontSize = isMobile ? getResponsiveFontSize(18, height) : getResponsiveFontSize(14, height);
      timerText = this.scene.add.text(0, -25, `Time: ${config.timer}s`, {
        fontSize: timerFontSize,
        color: '#ffffff',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: 'bold',
        resolution: 2
      }).setOrigin(0.5);
    }

    contentElements.push(headerBg, headerLine, headerText);
    if (timerText) contentElements.push(timerText);

    // Move cursor past header
    currentY += headerHeight / 2 + padding; 

    // --- Question Body ---
    const questionFontSize = isMobile ? getResponsiveFontSize(22, height) : getResponsiveFontSize(18, height);
    const questionText = this.scene.add.text(0, currentY, config.question, {
      fontSize: questionFontSize,
      color: '#473025', // Dark brown text for better contrast on cream background
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: panelWidth - (isMobile ? 40 : 60) },
      resolution: 2
    }).setOrigin(0.5, 0); // Top-center origin for dynamic text growth

    contentElements.push(questionText);

    // Update Y based on actual text height
    currentY += questionText.height + padding * 1.5;

    // --- Answer Buttons ---
    const buttonWidth = panelWidth - (isMobile ? 30 : 50);
    const buttonHeight = isMobile ? 80 : 60; // Larger touch targets on mobile (Apple recommends 44px minimum)
    const buttonSpacing = isMobile ? 18 : 15;
    const buttons: Phaser.GameObjects.Container[] = [];

    config.options.forEach((option, index) => {
      const isCorrect = option === config.correctAnswer;

      // Create button at (0, 0) first, will position later
      // Passing 0 as panelHeight initially, will update on click logic
      const btnContainer = this.createButton(
        0, 0, buttonWidth, buttonHeight, option, height, isMobile,
        () => {
            // We need the FINAL calculated panel height here for feedback positioning
            // Since we haven't finished calculating it, we'll access the background height later
            const finalPanelHeight = (this.activePopupContainer?.list[0] as Phaser.GameObjects.Rectangle)?.height || 500;
            this.handleAnswer(isCorrect, config, buttons, finalPanelHeight, isMobile);
        }
      );
      
      // Position button
      btnContainer.setPosition(0, currentY + buttonHeight/2);
      
      buttons.push(btnContainer);
      contentElements.push(btnContainer);
      
      currentY += buttonHeight + buttonSpacing;
    });

    // Remove last spacing
    currentY -= buttonSpacing;
    currentY += padding; // Add bottom padding

    // --- Panel Background Construction ---
    // Calculate total height required
    // Header starts at -headerHeight/2 relative to panel center in a traditional layout
    // But here we stacked downwards. Let's center the whole stack.
    const totalContentHeight = currentY + headerHeight/2; 
    
    // Background Panel
    const panel = this.scene.add.rectangle(0, 0, panelWidth, totalContentHeight, 0xfffaf2);
    panel.setStrokeStyle(4, 0xc4a46f);
    
    // Shadow
    const shadow = this.scene.add.rectangle(4, 4, panelWidth, totalContentHeight, 0x000000, 0.3);

    // Re-center content relative to the panel center
    // The stack `currentY` grew downwards from 0 (header center).
    // We need to shift everything up by half the total height to center it within the container
    const shiftY = -totalContentHeight / 2 + headerHeight / 2;

    headerBg.setPosition(0, shiftY);
    headerLine.setPosition(0, shiftY + 45);
    headerText.setPosition(0, shiftY - 10);
    if (timerText) timerText.setPosition(0, shiftY - 35);
    
    // Question was top-aligned
    questionText.setY(shiftY + headerHeight / 2 + padding);
    
    // Buttons
    let btnStartY = shiftY + headerHeight / 2 + padding + questionText.height + padding * 1.5 + buttonHeight/2;
    buttons.forEach((btn) => {
        btn.setY(btnStartY);
        btnStartY += buttonHeight + buttonSpacing;
    });

    // Create Main Container
    // Order: Shadow -> Panel -> Content
    const finalChildren = [shadow, panel, ...contentElements];

    this.activePopupContainer = this.scene.add.container(centerX, centerY, finalChildren);
    this.activePopupContainer.setDepth(10001);

    // Scale animation
    this.activePopupContainer.setScale(0.9);
    this.scene.tweens.add({
      targets: this.activePopupContainer,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2'
    });

    // Setup Timer Event
    if (config.timer && config.onTimeout) {
      let timeLeft = config.timer;
      this.activeTimerEvent = this.scene.time.addEvent({
        delay: 1000,
        callback: () => {
          timeLeft--;
          if (timerText) timerText.setText(`Time: ${timeLeft}s`);
          if (timeLeft <= 0) {
            // Timeout!
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
   * Create a standardized answer button
   */
  private createButton(
    x: number, y: number, width: number, height: number, text: string, screenHeight: number, isMobile: boolean,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const shadow = this.scene.add.rectangle(x + 4, y + 4, width, height, 0x000000, 0.15);
    const bg = this.scene.add.rectangle(x, y, width, height, 0xfff6e8);
    bg.setStrokeStyle(3, 0xc4a46f);
    bg.setInteractive({ useHandCursor: true });

    const buttonFontSize = isMobile ? getResponsiveFontSize(20, screenHeight) : getResponsiveFontSize(17, screenHeight);
    const label = this.scene.add.text(x, y, text, {
      fontSize: buttonFontSize,
      color: '#473025',
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: width - 40 },
      resolution: 2
    }).setOrigin(0.5);

    const container = this.scene.add.container(0, 0, [shadow, bg, label]);

    // Interactions
    bg.on('pointerover', () => {
      bg.setFillStyle(0x96b902);
      bg.setStrokeStyle(4, 0x7a9700);
      label.setColor('#ffffff');
      bg.setScale(1.02);
      label.setScale(1.02);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0xfff6e8);
      bg.setStrokeStyle(3, 0xc4a46f);
      label.setColor('#473025');
      bg.setScale(1);
      label.setScale(1);
    });

    bg.on('pointerdown', () => {
      bg.setScale(0.98);
      label.setScale(0.98);
      onClick();
    });

    return container;
  }

  /**
   * Handle answer selection
   */
  private handleAnswer(
    isCorrect: boolean,
    config: QuizConfig,
    buttons: Phaser.GameObjects.Container[],
    panelHeight: number,
    isMobile: boolean
  ) {
    // Stop timer if active
    if (this.activeTimerEvent) {
      this.activeTimerEvent.remove();
      this.activeTimerEvent = undefined;
    }

    // Disable all buttons
    buttons.forEach(btn => {
      const bg = btn.list[1] as Phaser.GameObjects.Rectangle;
      bg.disableInteractive();
    });

    // Show Feedback
    const feedbackText = isCorrect ? 'Correct!' : 'Incorrect';
    const color = isCorrect ? '#96b902' : '#ef4444';
    const feedbackY = panelHeight / 2 - 40; // Position relative to bottom

    const feedback = this.scene.add.text(0, feedbackY, feedbackText, {
      fontSize: getResponsiveFontSize(28, this.scene.scale.height),
      color: color,
      fontFamily: 'Quicksand, sans-serif',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5).setAlpha(0);

    this.activePopupContainer?.add(feedback);

    // Show Explanation if exists
    if (config.explanation) {
      const explanation = this.scene.add.text(0, feedbackY + 38, config.explanation, {
        fontSize: getResponsiveFontSize(15, this.scene.scale.height),
        color: '#473025',
        fontFamily: 'Quicksand, sans-serif',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: 550 }, // Fixed width for now, could be responsive
        resolution: 2
      }).setOrigin(0.5).setAlpha(0);
      this.activePopupContainer?.add(explanation);
      
      this.scene.tweens.add({
        targets: [feedback, explanation],
        alpha: 1,
        duration: 150,
        ease: 'Power2'
      });
    } else {
      this.scene.tweens.add({
        targets: feedback,
        alpha: 1,
        duration: 150,
        ease: 'Power2'
      });
    }

    // Delay then Close
    this.scene.time.delayedCall(1500, () => {
      // Run callback
      if (isCorrect) config.onCorrect();
      else config.onIncorrect();

      // Close popup
      this.close();
    });
  }

  /**
   * Close and destroy the active popup
   */
  close() {
    if (this.activeTimerEvent) {
      this.activeTimerEvent.remove();
      this.activeTimerEvent = undefined;
    }

    if (this.activePopupContainer) {
      this.activePopupContainer.destroy();
      this.activePopupContainer = undefined;
    }

    if (this.activeOverlay) {
      this.activeOverlay.destroy();
      this.activeOverlay = undefined;
    }
  }

  /**
   * Handle screen resize
   */
  resize(width: number, height: number) {
    const centerX = width / 2;
    const centerY = height / 2;

    // Resize overlay
    if (this.activeOverlay) {
      this.activeOverlay.setSize(width, height);
      this.activeOverlay.setPosition(centerX, centerY);
    }

    // Reposition container
    if (this.activePopupContainer) {
      this.activePopupContainer.setPosition(centerX, centerY);
      // Note: Internal font sizes won't update dynamically on resize without
      // destroying and recreating, but the position will stay centered.
      // For a perfect responsive text update, we'd need to rebuild the popup on resize.
    }
  }
}
