import { DOM, Format } from '../utils/helpers.js';
import eventService, { EVENTS } from '../services/EventService.js';
import storageService from '../services/StorageService.js';

/**
 * Controller for managing statistics display
 */
class StatsController {
    constructor(playerController) {
        this.playerController = playerController;
        this.elements = {};
        this.init();
    }

    /**
     * Initialize the controller
     */
    init() {
        this.bindElements();
        this.attachEventListeners();
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.elements = {
            statsDisplay: DOM.getById('stats-display')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Listen for events that should trigger stats update
        eventService.on(EVENTS.TAB_CHANGED, (tabName) => {
            if (tabName === 'stats') {
                this.updateStatsDisplay();
            }
        });

        eventService.on(EVENTS.GAME_ENDED, () => {
            this.updateStatsDisplay();
        });

        eventService.on(EVENTS.PLAYER_UPDATED, () => {
            this.updateStatsDisplay();
        });

        eventService.on(EVENTS.PLAYERS_LOADED, () => {
            this.updateStatsDisplay();
        });
    }

    /**
     * Update the statistics display
     */
    updateStatsDisplay() {
        const statsDisplay = this.elements.statsDisplay;
        if (!statsDisplay) return;

        const players = this.playerController.getAllPlayers();

        if (players.length === 0) {
            DOM.setHTML(statsDisplay, 
                '<p>No player statistics available. Add some players and play some games!</p>'
            );
            return;
        }

        try {
            const html = players.map(player => this.renderPlayerStats(player)).join('');
            DOM.setHTML(statsDisplay, html);
        } catch (error) {
            console.error('Failed to update stats display:', error);
            DOM.setHTML(statsDisplay, '<p>Error loading statistics.</p>');
        }
    }

    /**
     * Render statistics for a single player
     * @param {Player} player - Player object
     * @returns {string} HTML for player stats
     */
    renderPlayerStats(player) {
        const winRate = player.getWinRate();
        const avgScore = player.getAverageScore();
        const avgMeld = player.getAverageMeld();

        return `
            <div class="player-stats-card">
                <h3>${player.name}</h3>
                <div class="stat-row">
                    <span class="stat-label">Games Played:</span>
                    <span class="stat-value">${Format.number(player.gamesPlayed)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Games Won:</span>
                    <span class="stat-value">${Format.number(player.gamesWon)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Win Rate:</span>
                    <span class="stat-value">${Format.percentage(winRate)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Average Score:</span>
                    <span class="stat-value">${Format.number(avgScore)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Average Meld:</span>
                    <span class="stat-value">${Format.number(avgMeld)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Highest Hand:</span>
                    <span class="stat-value">${Format.number(player.highestHand)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Highest Bid:</span>
                    <span class="stat-value">${Format.number(player.highestBid)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Get overall statistics summary
     * @returns {Object} Statistics summary
     */
    getStatsSummary() {
        const players = this.playerController.getAllPlayers();
        const gameHistory = storageService.loadGameHistory();

        if (players.length === 0) {
            return {
                totalPlayers: 0,
                totalGames: 0,
                averageGameDuration: 0,
                mostActivePlayer: null,
                highestScoringPlayer: null
            };
        }

        const totalGames = players.reduce((sum, p) => sum + p.gamesPlayed, 0) / players.length;
        const mostActivePlayer = players.reduce((prev, current) => 
            (prev.gamesPlayed > current.gamesPlayed) ? prev : current
        );
        const highestScoringPlayer = players.reduce((prev, current) => 
            (prev.highestHand > current.highestHand) ? prev : current
        );

        // Calculate average game duration from history
        let averageGameDuration = 0;
        if (gameHistory.length > 0) {
            const totalDuration = gameHistory.reduce((sum, game) => {
                if (game.startTime && game.endTime) {
                    const start = new Date(game.startTime);
                    const end = new Date(game.endTime);
                    return sum + (end - start);
                }
                return sum;
            }, 0);
            averageGameDuration = Math.round(totalDuration / gameHistory.length / (1000 * 60)); // minutes
        }

        return {
            totalPlayers: players.length,
            totalGames: Math.round(totalGames),
            averageGameDuration,
            mostActivePlayer: mostActivePlayer.name,
            highestScoringPlayer: highestScoringPlayer.name,
            highestScoringHand: highestScoringPlayer.highestHand
        };
    }

    /**
     * Export statistics data
     * @returns {Object} Statistics data for export
     */
    exportStats() {
        const players = this.playerController.getAllPlayers();
        const gameHistory = storageService.loadGameHistory();
        const summary = this.getStatsSummary();

        return {
            summary,
            players: players.map(player => ({
                name: player.name,
                gamesPlayed: player.gamesPlayed,
                gamesWon: player.gamesWon,
                winRate: player.getWinRate(),
                averageScore: player.getAverageScore(),
                averageMeld: player.getAverageMeld(),
                highestHand: player.highestHand,
                highestBid: player.highestBid,
                totalScore: player.totalScore,
                totalMeld: player.totalMeld
            })),
            gameHistory: gameHistory.map(game => ({
                id: game.id,
                gameType: game.gameType,
                startTime: game.startTime,
                endTime: game.endTime,
                duration: game.endTime ? 
                    Math.round((new Date(game.endTime) - new Date(game.startTime)) / (1000 * 60)) : 
                    null,
                winner: game.winnerName,
                targetScore: game.targetScore,
                handsPlayed: game.hands ? game.hands.length : 0
            })),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Get top performers in various categories
     * @returns {Object} Top performers data
     */
    getTopPerformers() {
        const players = this.playerController.getAllPlayers();
        
        if (players.length === 0) {
            return {};
        }

        // Filter players who have played at least one game
        const activePlayers = players.filter(p => p.gamesPlayed > 0);
        
        if (activePlayers.length === 0) {
            return {};
        }

        return {
            highestWinRate: activePlayers.reduce((prev, current) => 
                (prev.getWinRate() > current.getWinRate()) ? prev : current
            ),
            mostGamesPlayed: activePlayers.reduce((prev, current) => 
                (prev.gamesPlayed > current.gamesPlayed) ? prev : current
            ),
            highestSingleHand: players.reduce((prev, current) => 
                (prev.highestHand > current.highestHand) ? prev : current
            ),
            highestBid: players.reduce((prev, current) => 
                (prev.highestBid > current.highestBid) ? prev : current
            ),
            averageScoreLeader: activePlayers.reduce((prev, current) => 
                (prev.getAverageScore() > current.getAverageScore()) ? prev : current
            ),
            averageMeldLeader: activePlayers.reduce((prev, current) => 
                (prev.getAverageMeld() > current.getAverageMeld()) ? prev : current
            )
        };
    }

    /**
     * Reset all statistics (for testing or data cleanup)
     */
    resetAllStats() {
        const players = this.playerController.getAllPlayers();
        
        players.forEach(player => {
            this.playerController.updatePlayerStats(player.id, {
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                highestHand: 0,
                highestBid: 0,
                totalMeld: 0
            });
        });

        // Clear game history
        storageService.saveGameHistory([]);
        
        this.updateStatsDisplay();
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.elements = {};
    }
}

export default StatsController;