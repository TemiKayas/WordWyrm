import * as Phaser from 'phaser';

/**
 * Global event bus for cross-scene communication
 * Allows scenes to communicate without direct references
 */
export class GameEvents {
  private static emitter = new Phaser.Events.EventEmitter();

  /**
   * Register an event listener
   * @param event - Event name
   * @param fn - Callback function
   * @param context - Context for 'this' in callback
   */
  static on(event: string, fn: (...args: unknown[]) => void, context?: unknown): void {
    this.emitter.on(event, fn, context);
  }

  /**
   * Register a one-time event listener
   * @param event - Event name
   * @param fn - Callback function
   * @param context - Context for 'this' in callback
   */
  static once(event: string, fn: (...args: unknown[]) => void, context?: unknown): void {
    this.emitter.once(event, fn, context);
  }

  /**
   * Emit an event
   * @param event - Event name
   * @param args - Arguments to pass to listeners
   */
  static emit(event: string, ...args: unknown[]): void {
    this.emitter.emit(event, ...args);
  }

  /**
   * Remove an event listener
   * @param event - Event name
   * @param fn - Callback function (optional - removes all if not provided)
   * @param context - Context (optional)
   */
  static off(event: string, fn?: (...args: unknown[]) => void, context?: unknown): void {
    if (fn) {
      this.emitter.off(event, fn, context);
    } else {
      this.emitter.removeAllListeners(event);
    }
  }

  /**
   * Remove all listeners for all events
   */
  static removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

/**
 * Event name constants
 * Use these instead of magic strings for type safety
 */
export const GAME_EVENTS = {
  // Scaling events
  RESIZE: 'game:resize',
  SCALE_CHANGED: 'game:scale-changed',

  // Game state events
  GAME_STARTED: 'game:started',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',
  GAME_OVER: 'game:over',

  // Stage events
  STAGE_CHANGED: 'game:stage-changed',
  STAGE_TRANSITION_START: 'game:stage-transition-start',
  STAGE_TRANSITION_END: 'game:stage-transition-end',

  // Wave events
  WAVE_STARTED: 'game:wave-started',
  WAVE_COMPLETED: 'game:wave-completed',

  // UI events
  TOWER_SELECTED: 'ui:tower-selected',
  TOWER_DESELECTED: 'ui:tower-deselected',
  GOLD_CHANGED: 'ui:gold-changed',
  LIVES_CHANGED: 'ui:lives-changed'
} as const;

// Type for event payloads
export interface GameEventPayloads {
  [GAME_EVENTS.RESIZE]: Phaser.Structs.Size;
  [GAME_EVENTS.SCALE_CHANGED]: { scaleX: number; scaleY: number };
  [GAME_EVENTS.GAME_STARTED]: void;
  [GAME_EVENTS.GAME_PAUSED]: void;
  [GAME_EVENTS.GAME_RESUMED]: void;
  [GAME_EVENTS.GAME_OVER]: { victory: boolean; wave: number };
  [GAME_EVENTS.STAGE_CHANGED]: { stage: number };
  [GAME_EVENTS.WAVE_STARTED]: { wave: number };
  [GAME_EVENTS.WAVE_COMPLETED]: { wave: number };
  [GAME_EVENTS.TOWER_SELECTED]: { type: string };
  [GAME_EVENTS.TOWER_DESELECTED]: void;
  [GAME_EVENTS.GOLD_CHANGED]: { gold: number };
  [GAME_EVENTS.LIVES_CHANGED]: { lives: number };
}
