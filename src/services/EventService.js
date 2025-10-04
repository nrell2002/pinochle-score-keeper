/**
 * Event service for implementing pub/sub pattern
 * Allows loose coupling between application components
 */
class EventService {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to execute
     * @param {Object} context - Context for the callback (optional)
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback, context = null) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }

        const listener = { callback, context };
        this.listeners.get(eventName).push(listener);

        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }

    /**
     * Subscribe to an event once (auto-unsubscribes after first trigger)
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to execute
     * @param {Object} context - Context for the callback (optional)
     * @returns {Function} Unsubscribe function
     */
    once(eventName, callback, context = null) {
        const unsubscribe = this.on(eventName, (...args) => {
            unsubscribe();
            callback.apply(context, args);
        }, context);

        return unsubscribe;
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to remove
     */
    off(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            return;
        }

        const eventListeners = this.listeners.get(eventName);
        const index = eventListeners.findIndex(listener => listener.callback === callback);
        
        if (index > -1) {
            eventListeners.splice(index, 1);
        }

        // Clean up empty event arrays
        if (eventListeners.length === 0) {
            this.listeners.delete(eventName);
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} eventName - Name of the event
     * @param {...any} args - Arguments to pass to callbacks
     */
    emit(eventName, ...args) {
        if (!this.listeners.has(eventName)) {
            return;
        }

        const eventListeners = this.listeners.get(eventName);
        
        // Create a copy to avoid issues if listeners are modified during iteration
        [...eventListeners].forEach(listener => {
            try {
                listener.callback.apply(listener.context, args);
            } catch (error) {
                console.error(`Error in event listener for '${eventName}':`, error);
            }
        });
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Name of the event
     */
    removeAllListeners(eventName) {
        if (eventName) {
            this.listeners.delete(eventName);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get number of listeners for an event
     * @param {string} eventName - Name of the event
     * @returns {number} Number of listeners
     */
    listenerCount(eventName) {
        return this.listeners.has(eventName) ? this.listeners.get(eventName).length : 0;
    }

    /**
     * Get all event names that have listeners
     * @returns {Array<string>} Array of event names
     */
    eventNames() {
        return Array.from(this.listeners.keys());
    }
}

// Define standard application events
export const EVENTS = {
    // Player events
    PLAYER_ADDED: 'player:added',
    PLAYER_REMOVED: 'player:removed',
    PLAYER_UPDATED: 'player:updated',
    PLAYERS_LOADED: 'players:loaded',

    // Game events
    GAME_STARTED: 'game:started',
    GAME_ENDED: 'game:ended',
    GAME_LOADED: 'game:loaded',
    GAME_STATE_CHANGED: 'game:state-changed',

    // Hand events
    HAND_STARTED: 'hand:started',
    HAND_COMPLETED: 'hand:completed',
    HAND_THROWN_IN: 'hand:thrown-in',
    HAND_SHOT_MOON: 'hand:shot-moon',

    // UI events
    TAB_CHANGED: 'ui:tab-changed',
    SCORES_UPDATED: 'ui:scores-updated',
    SCOREBOARD_UPDATED: 'ui:scoreboard-updated',

    // Data events
    DATA_SAVED: 'data:saved',
    DATA_LOADED: 'data:loaded',
    DATA_ERROR: 'data:error',

    // Validation events
    VALIDATION_ERROR: 'validation:error',
    VALIDATION_SUCCESS: 'validation:success'
};

// Create singleton instance
const eventService = new EventService();

export default eventService;