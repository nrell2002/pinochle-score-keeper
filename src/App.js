import PlayerController from './controllers/PlayerController.js';
import GameController from './controllers/GameController.js';
import UIController from './controllers/UIController.js';
import StatsController from './controllers/StatsController.js';
import notificationService from './services/NotificationService.js';
import eventService, { EVENTS } from './services/EventService.js';
import storageService from './services/StorageService.js';
import { CONFIG, ENV } from './utils/config.js';

/**
 * Main application class - orchestrates all controllers and services
 */
class PinochleScoreKeeperApp {
    constructor() {
        this.controllers = {};
        this.initialized = false;
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Check if storage is available
            if (!storageService.isAvailable()) {
                notificationService.error('Local storage is not available. Some features may not work.');
            }

            // Initialize controllers in order
            this.initializeControllers();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            // Set up error handling
            this.setupErrorHandling();
            
            // Expose controllers globally for backwards compatibility
            this.exposeGlobalReferences();
            
            this.initialized = true;
            
            // Log initialization in development
            if (ENV.IS_DEVELOPMENT) {
                console.log('Pinochle Score Keeper initialized', {
                    version: CONFIG.APP.VERSION,
                    environment: ENV,
                    storageInfo: storageService.getStorageInfo()
                });
            }

            // Emit initialization complete event
            eventService.emit('app:initialized', this);

        } catch (error) {
            console.error('Failed to initialize application:', error);
            notificationService.error('Failed to initialize application');
        }
    }

    /**
     * Initialize all controllers
     */
    initializeControllers() {
        // Initialize UI controller first
        this.controllers.ui = new UIController();
        
        // Initialize player controller
        this.controllers.player = new PlayerController();
        
        // Initialize game controller (depends on player controller)
        this.controllers.game = new GameController(this.controllers.player);
        
        // Initialize stats controller (depends on player controller)
        this.controllers.stats = new StatsController(this.controllers.player);

        // Set up inter-controller communication
        this.setupControllerCommunication();
    }

    /**
     * Set up communication between controllers
     */
    setupControllerCommunication() {
        // When tab changes to game, update player selection
        eventService.on(EVENTS.TAB_CHANGED, (tabName) => {
            if (tabName === 'game' && this.controllers.game) {
                this.controllers.game.updatePlayerSelection();
            }
        });

        // When players are updated, refresh game interface if needed
        eventService.on(EVENTS.PLAYER_UPDATED, () => {
            if (this.controllers.game?.currentGame) {
                this.controllers.game.updateGameInterface();
            }
        });

        // When game state changes, update UI badges/indicators
        eventService.on(EVENTS.GAME_STARTED, () => {
            if (this.controllers.ui) {
                this.controllers.ui.addTabBadge('game', '●');
            }
        });

        eventService.on(EVENTS.GAME_ENDED, () => {
            if (this.controllers.ui) {
                this.controllers.ui.removeTabBadge('game');
            }
        });

        // Update stats when relevant events occur
        const statsUpdateEvents = [
            EVENTS.GAME_ENDED,
            EVENTS.PLAYER_UPDATED,
            EVENTS.PLAYERS_LOADED
        ];

        statsUpdateEvents.forEach(event => {
            eventService.on(event, () => {
                if (this.controllers.stats && this.controllers.ui?.getCurrentTab() === 'stats') {
                    this.controllers.stats.updateStatsDisplay();
                }
            });
        });
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Handle page visibility changes (for potential future features)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Refresh data when page becomes visible again
                eventService.emit('app:resumed');
            }
        });

        // Handle beforeunload to warn about unsaved changes
        window.addEventListener('beforeunload', (event) => {
            if (this.controllers.game?.currentGame) {
                event.preventDefault();
                event.returnValue = 'You have a game in progress. Are you sure you want to leave?';
                return event.returnValue;
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardShortcuts(event) {
        // Only handle shortcuts when not typing in inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        // Alt + number keys for tab switching
        if (event.altKey && !event.ctrlKey && !event.shiftKey) {
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    this.controllers.ui?.showTab('players');
                    break;
                case '2':
                    event.preventDefault();
                    this.controllers.ui?.showTab('game');
                    break;
                case '3':
                    event.preventDefault();
                    this.controllers.ui?.showTab('stats');
                    break;
            }
        }

        // Escape key to cancel modals/inputs
        if (event.key === 'Escape') {
            // Future implementation for modal handling
            eventService.emit('ui:escape-pressed');
        }
    }

    /**
     * Set up global error handling
     */
    setupErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            if (ENV.IS_DEVELOPMENT) {
                notificationService.error(`Error: ${event.error.message}`);
            } else {
                notificationService.error('An unexpected error occurred');
            }
        });

        // Handle promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            if (ENV.IS_DEVELOPMENT) {
                notificationService.error(`Promise rejection: ${event.reason}`);
            } else {
                notificationService.error('An unexpected error occurred');
            }
        });

        // Set up service error handlers
        eventService.on(EVENTS.DATA_ERROR, (error) => {
            console.error('Data error:', error);
            notificationService.error('Data operation failed');
        });
    }

    /**
     * Expose global references for backwards compatibility
     */
    exposeGlobalReferences() {
        // Expose controllers for direct access if needed
        window.playerController = this.controllers.player;
        window.gameController = this.controllers.game;
        window.tableSetupController = this.controllers.game?.tableSetupController;
        window.uiController = this.controllers.ui;
        window.statsController = this.controllers.stats;
        
        // Expose main app instance
        window.app = this;
        
        // Expose services
        window.notificationService = notificationService;
        window.eventService = eventService;
        window.storageService = storageService;
    }

    /**
     * Get application status
     * @returns {Object} Application status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            version: CONFIG.APP.VERSION,
            environment: ENV,
            storage: storageService.getStorageInfo(),
            currentTab: this.controllers.ui?.getCurrentTab(),
            playersCount: this.controllers.player?.getAllPlayers().length || 0,
            hasActiveGame: Boolean(this.controllers.game?.currentGame),
            gameStatus: this.controllers.game?.getGameStatus()
        };
    }

    /**
     * Export all application data
     * @returns {Object} Complete application data export
     */
    exportData() {
        return {
            metadata: {
                appVersion: CONFIG.APP.VERSION,
                exportDate: new Date().toISOString(),
                appStatus: this.getStatus()
            },
            players: this.controllers.player?.exportData() || [],
            currentGame: this.controllers.game?.exportCurrentGame(),
            gameHistory: storageService.loadGameHistory(),
            statistics: this.controllers.stats?.exportStats()
        };
    }

    /**
     * Import application data
     * @param {Object} data - Data to import
     * @param {Object} options - Import options
     */
    importData(data, options = {}) {
        const { overwrite = false, validateVersion = true } = options;

        try {
            // Validate version compatibility if requested
            if (validateVersion && data.metadata?.appVersion) {
                const importVersion = data.metadata.appVersion;
                const currentVersion = CONFIG.APP.VERSION;
                
                if (importVersion !== currentVersion) {
                    const proceed = notificationService.confirm(
                        `Data was exported from version ${importVersion}, but you're running ${currentVersion}. Continue import?`
                    );
                    if (!proceed) return;
                }
            }

            // Import players
            if (data.players && this.controllers.player) {
                this.controllers.player.importData(data.players, !overwrite);
            }

            // Import game history
            if (data.gameHistory) {
                if (overwrite || storageService.loadGameHistory().length === 0) {
                    storageService.saveGameHistory(data.gameHistory);
                }
            }

            notificationService.success('Data imported successfully');
            eventService.emit('app:data-imported', data);

        } catch (error) {
            console.error('Failed to import data:', error);
            notificationService.error('Failed to import data');
        }
    }

    /**
     * Reset all application data
     */
    resetAllData() {
        const confirmed = notificationService.confirm(
            'This will permanently delete all players, games, and statistics. Are you sure?'
        );

        if (!confirmed) return;

        try {
            storageService.clearAll();
            
            // Reinitialize controllers to reload fresh data
            this.controllers.player?.loadPlayers();
            this.controllers.stats?.updateStatsDisplay();
            
            // If there's an active game, end it
            if (this.controllers.game?.currentGame) {
                this.controllers.game.currentGame = null;
                this.controllers.game.updateGameInterface();
            }

            notificationService.success('All data has been reset');
            eventService.emit('app:data-reset');

        } catch (error) {
            console.error('Failed to reset data:', error);
            notificationService.error('Failed to reset data');
        }
    }

    /**
     * Restart the application
     */
    restart() {
        try {
            // Clean up existing controllers
            Object.values(this.controllers).forEach(controller => {
                if (controller.destroy) {
                    controller.destroy();
                }
            });

            // Clear controllers
            this.controllers = {};
            this.initialized = false;

            // Reinitialize
            this.init();

            notificationService.success('Application restarted');
            eventService.emit('app:restarted');

        } catch (error) {
            console.error('Failed to restart application:', error);
            notificationService.error('Failed to restart application');
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Clean up controllers
        Object.values(this.controllers).forEach(controller => {
            if (controller.destroy) {
                controller.destroy();
            }
        });

        // Clean up services
        notificationService.destroy();
        eventService.removeAllListeners();

        // Remove global references
        delete window.app;
        delete window.playerController;
        delete window.gameController;
        delete window.uiController;
        delete window.statsController;

        this.controllers = {};
        this.initialized = false;
    }
}

export default PinochleScoreKeeperApp;