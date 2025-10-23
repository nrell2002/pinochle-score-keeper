/**
 * Application configuration and constants
 */
export const CONFIG = {
    // Game settings
    GAME: {
        MIN_PLAYERS: 2,
        MAX_PLAYERS: 4,
        TARGET_SCORES: {
            2: 1000,
            3: 1500,
            4: 1500
        },
        MIN_BIDS: {
            2: 150,
            3: 250,
            4: 250
        },
        MAX_TRICKS: 25,
        MELD_INCREMENT: 10,
        POINTS_PER_TRICK: 10
    },

    // UI settings
    UI: {
        NOTIFICATION_DURATION: 2200,
        NOTIFICATION_DURATION_LONG: 4000,
        TABS: ['players', 'game', 'stats'],
        DEFAULT_TAB: 'players'
    },

    // Storage settings
    STORAGE: {
        KEYS: {
            PLAYERS: 'pinochle-players',
            CURRENT_GAME: 'pinochle-current-game',
            GAME_HISTORY: 'pinochle-game-history'
        }
    },

    // Validation rules
    VALIDATION: {
        PLAYER_NAME: {
            MIN_LENGTH: 1,
            MAX_LENGTH: 50,
            PATTERN: /^[a-zA-Z0-9\s\-_'\.]+$/
        },
        MELD: {
            MIN: 0,
            MAX: 1000,
            STEP: 10
        },
        TRICKS: {
            MIN: 0,
            MAX: 25
        },
        BID: {
            MIN: 150,
            MAX: 2000,
            STEP: 10
        }
    },

    // App metadata
    APP: {
        NAME: 'Pinochle Score Keeper',
        VERSION: '1.0.0',
        DESCRIPTION: 'Keep track of your pinochle game scores and player statistics',
        AUTHOR: 'nrell2002'
    },

    // Feature flags for future enhancements
    FEATURES: {
        OFFLINE_SUPPORT: true,
        DATA_EXPORT: true,
        THEMES: false,
        MULTIPLAYER: false,
        TOURNAMENT_MODE: false,
        ADVANCED_STATS: false
    }
};

/**
 * Game type configurations
 */
export const GAME_TYPES = [
    {
        players: 2,
        name: '2-Player Game',
        targetScore: CONFIG.GAME.TARGET_SCORES[2],
        minBid: CONFIG.GAME.MIN_BIDS[2],
        description: 'Traditional 2-player pinochle'
    },
    {
        players: 3,
        name: '3-Player Game',
        targetScore: CONFIG.GAME.TARGET_SCORES[3],
        minBid: CONFIG.GAME.MIN_BIDS[3],
        description: '3-player pinochle variant'
    },
    {
        players: 4,
        name: '4-Player Team Game',
        targetScore: CONFIG.GAME.TARGET_SCORES[4],
        minBid: CONFIG.GAME.MIN_BIDS[4],
        description: '4-player team pinochle'
    }
];

/**
 * Get game configuration for a specific number of players
 * @param {number} playerCount - Number of players
 * @returns {Object} Game configuration
 */
export function getGameConfig(playerCount) {
    return GAME_TYPES.find(type => type.players === playerCount);
}

/**
 * Validate if a player count is supported
 * @param {number} playerCount - Number of players
 * @returns {boolean} True if supported
 */
export function isValidPlayerCount(playerCount) {
    return playerCount >= CONFIG.GAME.MIN_PLAYERS && 
           playerCount <= CONFIG.GAME.MAX_PLAYERS;
}

/**
 * Get minimum bid for a game type
 * @param {number} playerCount - Number of players
 * @returns {number} Minimum bid amount
 */
export function getMinBid(playerCount) {
    return CONFIG.GAME.MIN_BIDS[playerCount] || CONFIG.GAME.MIN_BIDS[3];
}

/**
 * Get target score for a game type
 * @param {number} playerCount - Number of players
 * @returns {number} Target score
 */
export function getTargetScore(playerCount) {
    return CONFIG.GAME.TARGET_SCORES[playerCount] || CONFIG.GAME.TARGET_SCORES[3];
}

/**
 * Environment detection
 */
export const ENV = {
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1',
    IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    IS_PWA: window.matchMedia('(display-mode: standalone)').matches,
    HAS_TOUCH: 'ontouchstart' in window,
    SUPPORTS_LOCAL_STORAGE: (() => {
        try {
            const test = 'localStorage-test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    })()
};

export default CONFIG;