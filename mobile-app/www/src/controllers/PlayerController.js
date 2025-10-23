import Player from '../models/Player.js';
import storageService from '../services/StorageService.js';
import notificationService from '../services/NotificationService.js';
import eventService, { EVENTS } from '../services/EventService.js';
import { DOM, Validation } from '../utils/helpers.js';

/**
 * Controller for managing players
 */
class PlayerController {
    constructor() {
        this.players = [];
        this.elements = {};
        this.init();
    }

    /**
     * Initialize the controller
     */
    init() {
        this.bindElements();
        this.attachEventListeners();
        this.loadPlayers();
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.elements = {
            playerNameInput: DOM.getById('player-name'),
            addPlayerBtn: DOM.getById('add-player'),
            playersList: DOM.getById('players-list')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (this.elements.addPlayerBtn) {
            DOM.on(this.elements.addPlayerBtn, 'click', () => this.addPlayer());
        }

        if (this.elements.playerNameInput) {
            DOM.on(this.elements.playerNameInput, 'keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addPlayer();
                }
            });
        }

        // Listen for external events
        eventService.on(EVENTS.PLAYERS_LOADED, () => this.updateDisplay());
        eventService.on(EVENTS.PLAYER_UPDATED, () => this.updateDisplay());
    }

    /**
     * Load players from storage
     */
    loadPlayers() {
        try {
            const playersData = storageService.loadPlayers();
            this.players = playersData.map(data => Player.fromData(data));
            eventService.emit(EVENTS.PLAYERS_LOADED, this.players);
            this.updateDisplay();
        } catch (error) {
            console.error('Failed to load players:', error);
            notificationService.error('Failed to load players');
        }
    }

    /**
     * Save players to storage
     */
    savePlayers() {
        try {
            const playersData = this.players.map(player => player.toData());
            storageService.savePlayers(playersData);
            eventService.emit(EVENTS.DATA_SAVED, { type: 'players', data: playersData });
        } catch (error) {
            console.error('Failed to save players:', error);
            notificationService.error('Failed to save players');
        }
    }

    /**
     * Add a new player
     */
    addPlayer() {
        const nameInput = this.elements.playerNameInput;
        if (!nameInput) return;

        const validation = Validation.playerName(nameInput.value);
        if (!validation.valid) {
            notificationService.error(validation.error);
            return;
        }

        const name = validation.value;

        // Check for duplicate names
        if (this.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            notificationService.error('Player already exists');
            return;
        }

        try {
            const player = new Player(name);
            this.players.push(player);
            this.savePlayers();
            
            nameInput.value = '';
            this.updateDisplay();
            
            notificationService.playerOperation(name, 'added');
            eventService.emit(EVENTS.PLAYER_ADDED, player);
        } catch (error) {
            console.error('Failed to add player:', error);
            notificationService.error('Failed to add player');
        }
    }

    /**
     * Remove a player
     * @param {string} playerId - ID of player to remove
     */
    removePlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        if (!notificationService.confirm(`Are you sure you want to remove ${player.name}?`)) {
            return;
        }

        try {
            this.players = this.players.filter(p => p.id !== playerId);
            this.savePlayers();
            this.updateDisplay();
            
            notificationService.playerOperation(player.name, 'removed');
            eventService.emit(EVENTS.PLAYER_REMOVED, player);
        } catch (error) {
            console.error('Failed to remove player:', error);
            notificationService.error('Failed to remove player');
        }
    }

    /**
     * Update a player's statistics
     * @param {string} playerId - Player ID
     * @param {Object} stats - Updated statistics
     */
    updatePlayerStats(playerId, stats) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        try {
            Object.assign(player, stats);
            this.savePlayers();
            eventService.emit(EVENTS.PLAYER_UPDATED, player);
        } catch (error) {
            console.error('Failed to update player stats:', error);
            notificationService.error('Failed to update player statistics');
        }
    }

    /**
     * Get all players
     * @returns {Array<Player>} Array of players
     */
    getAllPlayers() {
        return [...this.players];
    }

    /**
     * Get player by ID
     * @param {string} playerId - Player ID
     * @returns {Player|null} Player or null if not found
     */
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId) || null;
    }

    /**
     * Get players by IDs
     * @param {Array<string>} playerIds - Array of player IDs
     * @returns {Array<Player>} Array of players
     */
    getPlayersByIds(playerIds) {
        return playerIds.map(id => this.getPlayer(id)).filter(Boolean);
    }

    /**
     * Update the players display
     */
    updateDisplay() {
        const playersList = this.elements.playersList;
        if (!playersList) return;

        if (this.players.length === 0) {
            DOM.setHTML(playersList, '<p>No players added yet. Add some players to get started!</p>');
            return;
        }

        const html = this.players.map(player => `
            <div class="player-item">
                <div>
                    <div class="player-name">${player.name}</div>
                    <div class="player-stats">
                        Games: ${player.gamesPlayed} | Wins: ${player.gamesWon} | Win Rate: ${player.getWinRate()}%
                    </div>
                </div>
                <button class="danger-button" onclick="window.playerController.removePlayer('${player.id}')">
                    Remove
                </button>
            </div>
        `).join('');

        DOM.setHTML(playersList, html);
    }

    /**
     * Export player data
     * @returns {Array} Player data for export
     */
    exportData() {
        return this.players.map(player => player.toData());
    }

    /**
     * Import player data
     * @param {Array} playersData - Player data to import
     * @param {boolean} merge - Whether to merge with existing players
     */
    importData(playersData, merge = true) {
        try {
            if (!merge) {
                this.players = [];
            }

            playersData.forEach(data => {
                const existing = this.players.find(p => p.name.toLowerCase() === data.name.toLowerCase());
                if (!existing) {
                    this.players.push(Player.fromData(data));
                }
            });

            this.savePlayers();
            this.updateDisplay();
            notificationService.success('Players imported successfully');
        } catch (error) {
            console.error('Failed to import players:', error);
            notificationService.error('Failed to import players');
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Remove event listeners would go here if we tracked them
        this.players = [];
        this.elements = {};
    }
}

export default PlayerController;