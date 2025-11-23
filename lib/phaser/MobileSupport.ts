import * as Phaser from 'phaser';

/**
 * MobileSupport - Reusable mobile support for Phaser games
 *
 * Provides:
 * - Mobile device detection
 * - Landscape orientation enforcement with overlay
 * - Swipe controls for direction-based games
 * - Tab/app switch pause with countdown
 * - Browser gesture prevention
 *
 * Usage:
 * 1. Import and create instance in your scene's create() method
 * 2. Call update() in your scene's update() method
 * 3. Check isPaused() before processing game logic
 */

export interface SwipeHandler {
    onSwipeUp: () => void;
    onSwipeDown: () => void;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
}

export class MobileSupport {
    private scene: Phaser.Scene;
    private isMobile = false;
    private isLandscape = true;
    private orientationOverlay?: Phaser.GameObjects.Container;
    private countdownOverlay?: Phaser.GameObjects.Container;
    private swipeStartX = 0;
    private swipeStartY = 0;
    private isPausedForOrientation = false;
    private isPausedForVisibility = false;
    private visibilityHandler?: () => void;
    private swipeHandler?: SwipeHandler;
    private gameStartedCallback?: () => boolean;
    private overlaySceneName?: string;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Initialize mobile support
     * @param swipeHandler - Optional handler for swipe directions
     * @param gameStartedCallback - Optional callback to check if game has started (for visibility pause)
     * @param overlaySceneName - Optional scene name to bring to top when overlays are hidden (e.g., 'UIScene')
     */
    setup(swipeHandler?: SwipeHandler, gameStartedCallback?: () => boolean, overlaySceneName?: string) {
        this.swipeHandler = swipeHandler;
        this.gameStartedCallback = gameStartedCallback;
        this.overlaySceneName = overlaySceneName;

        // Detect if device is mobile/touch
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (!this.isMobile) {
            return; // Desktop - no mobile features needed
        }

        // Prevent default touch behaviors (pull-to-refresh, back-swipe)
        this.preventBrowserGestures();

        // Setup swipe controls if handler provided
        if (swipeHandler) {
            this.setupSwipeControls();
        }

        // Setup orientation detection
        this.setupOrientationDetection();

        // Setup visibility change detection (tab/app switch)
        this.setupVisibilityDetection();

        // Check initial orientation
        this.checkOrientation();
    }

    /**
     * Check if game should be paused due to mobile state
     */
    isPaused(): boolean {
        return this.isPausedForOrientation || this.isPausedForVisibility;
    }

    /**
     * Check if running on mobile device
     */
    getIsMobile(): boolean {
        return this.isMobile;
    }

    private preventBrowserGestures() {
        const gameCanvas = this.scene.game.canvas;

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
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.swipeStartX = pointer.x;
            this.swipeStartY = pointer.y;
        });

        // Detect swipe on pointer up
        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!this.swipeHandler) return;

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
                if (deltaX > 0) {
                    this.swipeHandler.onSwipeRight();
                } else {
                    this.swipeHandler.onSwipeLeft();
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.swipeHandler.onSwipeDown();
                } else {
                    this.swipeHandler.onSwipeUp();
                }
            }
        });
    }

    private setupOrientationDetection() {
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
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
        if (this.orientationOverlay) return;

        this.isPausedForOrientation = true;

        // Bring this scene to top so overlay appears above all other scenes (e.g., UIScene)
        if (this.scene.scene) {
            try {
                this.scene.scene.bringToTop();
            } catch (e) {
                console.warn('Failed to bring scene to top:', e);
            }
        }

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        const elements: Phaser.GameObjects.GameObject[] = [];

        // Dark overlay
        const overlay = this.scene.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            1.0
        ).setDepth(5000);
        elements.push(overlay);

        // Rotate icon
        const rotateIcon = this.scene.add.text(
            width / 2,
            height / 2 - 60,
            '📱↔️',
            {
                fontSize: '64px'
            }
        ).setOrigin(0.5).setDepth(5001);
        elements.push(rotateIcon);

        // Message
        const message = this.scene.add.text(
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

        this.orientationOverlay = this.scene.add.container(0, 0, elements);
    }

    private hideOrientationOverlay() {
        if (this.orientationOverlay) {
            this.orientationOverlay.destroy();
            this.orientationOverlay = undefined;
        }
        this.isPausedForOrientation = false;

        // Restore overlay scene (e.g., UIScene) to top if specified
        if (this.overlaySceneName && this.scene.scene) {
            try {
                this.scene.scene.bringToTop(this.overlaySceneName);
            } catch (e) {
                console.warn('Failed to restore overlay scene order:', e);
            }
        }
    }

    private showCountdownOverlay() {
        if (this.countdownOverlay) return;

        // Bring this scene to top so overlay appears above all other scenes (e.g., UIScene)
        if (this.scene.scene) {
            try {
                this.scene.scene.bringToTop();
            } catch (e) {
                console.warn('Failed to bring scene to top:', e);
            }
        }

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        const elements: Phaser.GameObjects.GameObject[] = [];

        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.7
        ).setDepth(4000);
        elements.push(overlay);

        // Countdown text
        const countdownText = this.scene.add.text(
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

        this.countdownOverlay = this.scene.add.container(0, 0, elements);

        // Countdown sequence
        let count = 3;

        this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countdownText.setText(count.toString());
                    // Pulse animation
                    this.scene.tweens.add({
                        targets: countdownText,
                        scale: { from: 1.2, to: 1 },
                        duration: 300,
                        ease: 'Power2'
                    });
                } else {
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

        // Restore overlay scene (e.g., UIScene) to top if specified
        if (this.overlaySceneName && this.scene.scene) {
            try {
                this.scene.scene.bringToTop(this.overlaySceneName);
            } catch (e) {
                console.warn('Failed to restore overlay scene order:', e);
            }
        }
    }

    private setupVisibilityDetection() {
        this.visibilityHandler = () => {
            if (document.hidden) {
                this.isPausedForVisibility = true;
            } else {
                // Check if game has started before showing countdown
                const gameStarted = this.gameStartedCallback ? this.gameStartedCallback() : true;
                if (this.isPausedForVisibility && gameStarted) {
                    this.showCountdownOverlay();
                }
            }
        };

        document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    /**
     * Clean up event listeners - call in scene's shutdown()
     */
    destroy() {
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
    }
}
