/**
 * Storage service for managing data persistence using localStorage
 */
class StorageService {
    constructor() {
        this.keys = {
            PLAYERS: 'pinochle-players',
            CURRENT_GAME: 'pinochle-current-game',
            GAME_HISTORY: 'pinochle-game-history'
        };
    }

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     */
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            throw new Error('Failed to save data');
        }
    }

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Stored data or default value
     */
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    }

    /**
     * Clear all application data
     */
    clearAll() {
        Object.values(this.keys).forEach(key => this.remove(key));
    }

    /**
     * Save players data
     * @param {Array} players - Array of player data
     */
    savePlayers(players) {
        this.save(this.keys.PLAYERS, players);
    }

    /**
     * Load players data
     * @returns {Array} Array of player data
     */
    loadPlayers() {
        return this.load(this.keys.PLAYERS, []);
    }

    /**
     * Save current game data
     * @param {Object} game - Game data
     */
    saveCurrentGame(game) {
        this.save(this.keys.CURRENT_GAME, game);
    }

    /**
     * Load current game data
     * @returns {Object|null} Current game data or null
     */
    loadCurrentGame() {
        return this.load(this.keys.CURRENT_GAME, null);
    }

    /**
     * Remove current game data
     */
    removeCurrentGame() {
        this.remove(this.keys.CURRENT_GAME);
    }

    /**
     * Save game history
     * @param {Array} history - Array of completed games
     */
    saveGameHistory(history) {
        this.save(this.keys.GAME_HISTORY, history);
    }

    /**
     * Load game history
     * @returns {Array} Array of completed games
     */
    loadGameHistory() {
        return this.load(this.keys.GAME_HISTORY, []);
    }

    /**
     * Add a completed game to history
     * @param {Object} game - Completed game data
     */
    addToGameHistory(game) {
        const history = this.loadGameHistory();
        history.push(game);
        this.saveGameHistory(history);
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is available
     */
    isAvailable() {
        try {
            const test = 'localStorage-test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        if (!this.isAvailable()) {
            return { available: false };
        }

        const usage = {};
        let totalSize = 0;

        Object.entries(this.keys).forEach(([name, key]) => {
            const data = localStorage.getItem(key);
            const size = data ? data.length : 0;
            usage[name.toLowerCase()] = size;
            totalSize += size;
        });

        return {
            available: true,
            usage,
            totalSize,
            totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
        };
    }

    /**
     * Export all data for backup
     * @returns {Object} All stored data
     */
    exportData() {
        return {
            players: this.loadPlayers(),
            currentGame: this.loadCurrentGame(),
            gameHistory: this.loadGameHistory(),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import data from backup
     * @param {Object} data - Data to import
     * @param {boolean} overwrite - Whether to overwrite existing data
     */
    importData(data, overwrite = false) {
        try {
            if (data.players && (overwrite || this.loadPlayers().length === 0)) {
                this.savePlayers(data.players);
            }

            if (data.currentGame && (overwrite || !this.loadCurrentGame())) {
                this.saveCurrentGame(data.currentGame);
            }

            if (data.gameHistory && (overwrite || this.loadGameHistory().length === 0)) {
                this.saveGameHistory(data.gameHistory);
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to import data:', error);
            return { 
                success: false, 
                error: 'Failed to import data: ' + error.message 
            };
        }
    }
}

// Create singleton instance
const storageService = new StorageService();

export default storageService;