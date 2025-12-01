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

        // First try to save without a guest name (for logged-in users)
        let result = await saveGameSession({
          gameId,
          score: data.score,
          correctAnswers: data.correctAnswers,
          totalQuestions,
          metadata,
          questionResponses: data.questionResponses
        });

        // If failed and asks for player name, prompt for guest name
        if (!result.success && result.error.includes('player name')) {
          const guestName = prompt('Please enter your name to save your score:');

          if (guestName && guestName.trim()) {
            result = await saveGameSession({
              gameId,
              score: data.score,
              correctAnswers: data.correctAnswers,
              totalQuestions,
              metadata,
              guestName: guestName.trim()
            });
          } else {
            console.log('No name provided, score not saved');
            return;
          }
        }

        if (!result.success) {
          console.error('Failed to save game session:', result.error);
        } else {
          console.log('Game session saved successfully!');
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
