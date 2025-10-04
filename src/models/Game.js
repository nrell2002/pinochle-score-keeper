import GameHand from './GameHand.js';

/**
 * Game model representing a complete pinochle game
 */
class Game {
    /**
     * Create a new game
     * @param {Array} players - Array of Player objects
     * @param {number} gameType - Number of players (2, 3, or 4)
     */
    constructor(players, gameType) {
        this.id = Date.now().toString();
        this.gameType = gameType;
        this.players = players;
        this.hands = [];
        this.scores = players.map(p => ({ 
            playerId: p.id, 
            name: p.name, 
            score: 0 
        }));
        this.startTime = new Date().toISOString();
        this.endTime = null;
        this.targetScore = gameType === 2 ? 1000 : 1500;
        this.dealerIndex = 0;
        this.winnerId = null;
        this.winnerName = null;
    }

    /**
     * Get the current dealer
     * @returns {Object} Current dealer player
     */
    getCurrentDealer() {
        return this.players[this.dealerIndex];
    }

    /**
     * Advance to the next dealer
     */
    advanceDealer() {
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
    }

    /**
     * Get the next hand number
     * @returns {number} Next hand number
     */
    getNextHandNumber() {
        return this.hands.length + 1;
    }

    /**
     * Add a completed hand to the game
     * @param {GameHand} hand - Completed hand
     */
    addHand(hand) {
        this.hands.push(hand);
        this.recalculateScores();
        this.advanceDealer();
    }

    /**
     * Recalculate all player scores from hands
     */
    recalculateScores() {
        // Reset scores
        this.scores.forEach(s => s.score = 0);

        // Recalculate from all hands
        this.hands.forEach(hand => {
            if (hand.thrownIn) {
                return; // Skip thrown in hands
            }

            if (hand.isBidderSet()) {
                // Bidder goes set: subtract winning bid, others score normally
                const bidderScore = this.scores.find(s => s.playerId === hand.bidderId);
                bidderScore.score -= hand.winningBid;

                // Other players score meld + hand score
                this.players.forEach(player => {
                    if (player.id !== hand.bidderId) {
                        const playerScore = this.scores.find(s => s.playerId === player.id);
                        const meld = hand.playerMeld[player.id] || 0;
                        const score = hand.playerScores[player.id] || 0;
                        playerScore.score += meld + score;
                    }
                });
            } else {
                // Normal scoring for all players
                this.players.forEach(player => {
                    const playerScore = this.scores.find(s => s.playerId === player.id);
                    const meld = hand.playerMeld[player.id] || 0;
                    const score = hand.playerScores[player.id] || 0;
                    playerScore.score += meld + score;
                });
            }
        });
    }

    /**
     * Check if any player has reached the target score
     * @returns {Object|null} Winner object or null if no winner
     */
    checkForWinner() {
        const winningPlayers = this.scores.filter(s => s.score >= this.targetScore);
        
        if (winningPlayers.length > 0) {
            // Find the player with the highest score among those who reached target
            return winningPlayers.reduce((prev, current) => 
                (prev.score > current.score) ? prev : current
            );
        }
        
        return null;
    }

    /**
     * End the game with a winner
     * @param {string} winnerId - ID of the winning player
     * @param {string} winnerName - Name of the winning player
     */
    endGame(winnerId, winnerName) {
        this.endTime = new Date().toISOString();
        this.winnerId = winnerId;
        this.winnerName = winnerName;
    }

    /**
     * Check if the game is completed
     * @returns {boolean} True if game is completed
     */
    isCompleted() {
        return this.endTime !== null;
    }

    /**
     * Get game duration in minutes
     * @returns {number} Duration in minutes
     */
    getDurationMinutes() {
        const start = new Date(this.startTime);
        const end = this.endTime ? new Date(this.endTime) : new Date();
        return Math.round((end - start) / (1000 * 60));
    }

    /**
     * Get current game status summary
     * @returns {Object} Game status information
     */
    getStatus() {
        const winner = this.checkForWinner();
        const currentHand = this.getNextHandNumber();
        const leader = this.scores.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
        );

        return {
            currentHand,
            leader: leader.name,
            leaderScore: leader.score,
            targetScore: this.targetScore,
            hasWinner: winner !== null,
            winner: winner?.name || null,
            winnerScore: winner?.score || null,
            duration: this.getDurationMinutes()
        };
    }

    /**
     * Create a game from stored data
     * @param {Object} data - Stored game data
     * @returns {Game} New game instance
     */
    static fromData(data) {
        const game = new Game(data.players, data.gameType);
        game.id = data.id;
        game.hands = data.hands.map(handData => GameHand.fromData(handData));
        game.scores = data.scores;
        game.startTime = data.startTime;
        game.endTime = data.endTime;
        game.targetScore = data.targetScore;
        game.dealerIndex = data.dealerIndex;
        game.winnerId = data.winnerId;
        game.winnerName = data.winnerName;
        return game;
    }

    /**
     * Convert game to plain object for storage
     * @returns {Object} Plain object representation
     */
    toData() {
        return {
            id: this.id,
            gameType: this.gameType,
            players: this.players,
            hands: this.hands.map(hand => hand.toData()),
            scores: this.scores,
            startTime: this.startTime,
            endTime: this.endTime,
            targetScore: this.targetScore,
            dealerIndex: this.dealerIndex,
            winnerId: this.winnerId,
            winnerName: this.winnerName
        };
    }
}

export default Game;