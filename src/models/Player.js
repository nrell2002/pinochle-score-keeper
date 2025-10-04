/**
 * Player model representing a pinochle player
 */
class Player {
    /**
     * Create a new player
     * @param {string} name - Player name
     * @param {string} [id] - Unique identifier (auto-generated if not provided)
     */
    constructor(name, id = null) {
        this.id = id || Date.now().toString();
        this.name = name;
        this.gamesPlayed = 0;
        this.gamesWon = 0;
        this.totalScore = 0;
        this.highestHand = 0;
        this.highestBid = 0;
        this.totalMeld = 0;
    }

    /**
     * Get player's win rate as a percentage
     * @returns {number} Win rate percentage (0-100)
     */
    getWinRate() {
        return this.gamesPlayed > 0 ? Math.round((this.gamesWon / this.gamesPlayed) * 100) : 0;
    }

    /**
     * Get player's average score per game
     * @returns {number} Average score
     */
    getAverageScore() {
        return this.gamesPlayed > 0 ? Math.round(this.totalScore / this.gamesPlayed) : 0;
    }

    /**
     * Get player's average meld per game
     * @returns {number} Average meld
     */
    getAverageMeld() {
        return this.gamesPlayed > 0 ? Math.round(this.totalMeld / this.gamesPlayed) : 0;
    }

    /**
     * Update player statistics after a game
     * @param {boolean} won - Whether the player won the game
     * @param {number} finalScore - Final score for the game
     */
    updateGameStats(won, finalScore) {
        this.gamesPlayed++;
        if (won) {
            this.gamesWon++;
        }
        this.totalScore += finalScore;
    }

    /**
     * Update player statistics after a hand
     * @param {number} meld - Meld points for this hand
     * @param {number} handScore - Hand score (meld + tricks)
     * @param {number} [bid] - Winning bid (if this player was the bidder)
     */
    updateHandStats(meld, handScore, bid = null) {
        this.totalMeld += meld;
        
        if (handScore > this.highestHand) {
            this.highestHand = handScore;
        }
        
        if (bid && bid > this.highestBid) {
            this.highestBid = bid;
        }
    }

    /**
     * Create a player from stored data
     * @param {Object} data - Stored player data
     * @returns {Player} New player instance
     */
    static fromData(data) {
        const player = new Player(data.name, data.id);
        player.gamesPlayed = data.gamesPlayed || 0;
        player.gamesWon = data.gamesWon || 0;
        player.totalScore = data.totalScore || 0;
        player.highestHand = data.highestHand || 0;
        player.highestBid = data.highestBid || 0;
        player.totalMeld = data.totalMeld || 0;
        return player;
    }

    /**
     * Convert player to plain object for storage
     * @returns {Object} Plain object representation
     */
    toData() {
        return {
            id: this.id,
            name: this.name,
            gamesPlayed: this.gamesPlayed,
            gamesWon: this.gamesWon,
            totalScore: this.totalScore,
            highestHand: this.highestHand,
            highestBid: this.highestBid,
            totalMeld: this.totalMeld
        };
    }
}

export default Player;