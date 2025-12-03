/**
 * GameDataService - Abstraction layer for game data
 * Works in both Phaser Editor (mock data) and WordWyrm (API/database)
 */

export interface Quiz {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export class GameDataService {
  private static instance: GameDataService;

  private constructor() {}

  static getInstance(): GameDataService {
    if (!GameDataService.instance) {
      GameDataService.instance = new GameDataService();
    }
    return GameDataService.instance;
  }

  /**
   * Show a styled DOM-based notification popup
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Remove existing notification if any
    const existing = document.getElementById('game-notification-popup');
    if (existing) {
      existing.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'game-notification-popup';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Create card
    const card = document.createElement('div');
    card.style.cssText = `
      background: #fffcf8;
      border: 4px solid #473025;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      font-family: 'Quicksand', sans-serif;
    `;

    // Icon color based on type
    let iconColor = '#ff9f22';
    if (type === 'success') iconColor = '#96b902';
    else if (type === 'error') iconColor = '#ff4880';

    // Icon
    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${iconColor};
      margin: 0 auto 16px;
    `;

    // Message
    const text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = `
      color: #473025;
      font-size: 16px;
      margin: 0 0 20px;
      line-height: 1.4;
    `;

    // Button
    const button = document.createElement('button');
    button.textContent = 'OK';
    button.style.cssText = `
      background: #96b902;
      border: 2px solid #7a9700;
      border-radius: 8px;
      color: white;
      font-family: 'Quicksand', sans-serif;
      font-size: 14px;
      font-weight: bold;
      padding: 8px 24px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    button.onmouseover = () => button.style.background = '#7a9700';
    button.onmouseout = () => button.style.background = '#96b902';
    button.onclick = () => overlay.remove();

    card.appendChild(icon);
    card.appendChild(text);
    card.appendChild(button);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  /**
   * Detect if running in Phaser Editor vs WordWyrm production
   */
  isPhaserEditor(): boolean {
    // Check if we're in a local file system or Phaser Editor environment
    const hostname = window.location.hostname;
    return hostname === '' ||
           hostname === 'localhost' ||
           hostname.includes('127.0.0.1') ||
           !window.location.href.includes('wordwyrm');
  }

  /**
   * Get quiz data - uses mock data in Phaser Editor, API in production
   */
  async getQuizData(): Promise<Quiz> {
    if (this.isPhaserEditor()) {
      console.log('[GameDataService] Running in Phaser Editor - using mock quiz data');
      return this.getMockQuizData();
    } else {
      console.log('[GameDataService] Running in WordWyrm - fetching quiz from API');
      return this.fetchQuizFromAPI();
    }
  }

  /**
   * Fetch quiz from WordWyrm API (production)
   */
  private async fetchQuizFromAPI(): Promise<Quiz> {
    try {
      // Get quiz ID from URL params or use default
      const params = new URLSearchParams(window.location.search);
      const quizId = params.get('quizId') || 'default';

      const response = await fetch(`/api/quiz/${quizId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz, falling back to mock data:', error);
      return this.getMockQuizData();
    }
  }

  /**
   * Mock quiz data for Phaser Editor testing
   */
  private getMockQuizData(): Quiz {
    return {
      questions: [
        {
          question: "What is the capital of France?",
          options: ["London", "Paris", "Berlin", "Madrid"],
          answer: "Paris",
          explanation: "Paris is the capital and largest city of France."
        },
        {
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          answer: "4",
          explanation: "Basic addition: 2 + 2 equals 4."
        },
        {
          question: "Which planet is closest to the Sun?",
          options: ["Venus", "Earth", "Mercury", "Mars"],
          answer: "Mercury",
          explanation: "Mercury is the smallest planet and closest to the Sun."
        },
        {
          question: "What is the largest ocean on Earth?",
          options: ["Atlantic", "Indian", "Arctic", "Pacific"],
          answer: "Pacific",
          explanation: "The Pacific Ocean is the largest and deepest ocean."
        },
        {
          question: "Who wrote 'Romeo and Juliet'?",
          options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
          answer: "William Shakespeare",
          explanation: "Shakespeare wrote this famous tragedy in the 1590s."
        },
        {
          question: "What is the speed of light?",
          options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
          answer: "300,000 km/s",
          explanation: "Light travels at approximately 300,000 kilometers per second."
        },
        {
          question: "How many continents are there?",
          options: ["5", "6", "7", "8"],
          answer: "7",
          explanation: "The seven continents are: Africa, Antarctica, Asia, Australia, Europe, North America, and South America."
        },
        {
          question: "What is the chemical symbol for gold?",
          options: ["Go", "Gd", "Au", "Ag"],
          answer: "Au",
          explanation: "Au comes from the Latin word 'aurum' meaning gold."
        },
        {
          question: "Who painted the Mona Lisa?",
          options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
          answer: "Leonardo da Vinci",
          explanation: "Da Vinci painted this masterpiece in the early 16th century."
        },
        {
          question: "What is the largest mammal?",
          options: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
          answer: "Blue Whale",
          explanation: "Blue whales can grow up to 100 feet long and weigh 200 tons."
        }
      ]
    };
  }

  /**
   * Save game session - uses localStorage in Phaser Editor, server action in production
   */
  async saveGameSession(data: {
    score: number;
    waveNumber: number;
    gold: number;
    lives: number;
    towersPlaced: number;
    correctAnswers: number;
    questionResponses?: Record<string, {
      questionText: string;
      selectedAnswer: string;
      correctAnswer: string;
      correct: boolean;
    }>;
  }): Promise<void> {
    if (this.isPhaserEditor()) {
      console.log('[GameDataService] Saving to localStorage:', data);
      localStorage.setItem('towerDefenseSession', JSON.stringify(data));
    } else {
      console.log('[GameDataService] Saving game session to database:', data);
      try {
        // Get game ID from URL parameters
        const params = new URLSearchParams(window.location.search);
        const gameId = params.get('gameId');

        if (!gameId) {
          console.warn('[GameDataService] No game ID found in URL, skipping session save');
          return;
        }

        // Prepare metadata with Tower Defense-specific statistics
        const metadata = {
          wavesCompleted: data.waveNumber,
          towersBuilt: data.towersPlaced,
          enemiesDefeated: 0, // TODO: Track this in the scene
          goldEarned: data.gold,
          livesRemaining: data.lives
        };

        // Calculate total questions answered (use waveNumber as proxy)
        const totalQuestions = data.waveNumber;

        // Dynamically import the server action to avoid bundling issues
        const { saveGameSession } = await import('@/app/actions/game');

        // Save game session - analytics will only be tracked for class members
        const result = await saveGameSession({
          gameId,
          score: data.score,
          correctAnswers: data.correctAnswers,
          totalQuestions,
          metadata,
          questionResponses: data.questionResponses
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
        console.error('[GameDataService] Error saving session:', error);
      }
    }
  }

  /**
   * Load previous game session
   */
  async loadGameSession(): Promise<unknown | null> {
    if (this.isPhaserEditor()) {
      const saved = localStorage.getItem('towerDefenseSession');
      return saved ? JSON.parse(saved) : null;
    } else {
      try {
        const response = await fetch('/api/game-session');
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error('Error loading session:', error);
        return null;
      }
    }
  }

  /**
   * Get environment info for debugging
   */
  getEnvironmentInfo(): {
    environment: 'phaser-editor' | 'wordwyrm';
    hostname: string;
    url: string;
  } {
    return {
      environment: this.isPhaserEditor() ? 'phaser-editor' : 'wordwyrm',
      hostname: window.location.hostname,
      url: window.location.href
    };
  }
}

// Export singleton instance
export const gameDataService = GameDataService.getInstance();
