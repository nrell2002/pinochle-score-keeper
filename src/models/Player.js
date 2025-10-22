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
        this.handsPlayed = 0;
        this.totalBids = 0;
        this.successfulBids = 0;
        this.totalTricks = 0;
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
     * Get player's average meld per hand
     * @returns {number} Average meld per hand
     */
    getAverageMeldPerHand() {
        return this.handsPlayed > 0 ? Math.round(this.totalMeld / this.handsPlayed) : 0;
    }

    /**
     * Get player's bidding success rate as a percentage
     * @returns {number} Bidding success rate percentage (0-100)
     */
    getBiddingSuccessRate() {
        return this.totalBids > 0 ? Math.round((this.successfulBids / this.totalBids) * 100) : 0;
    }

    /**
     * Get player's average tricks per hand
     * @returns {number} Average tricks per hand
     */
    getAverageTricksPerHand() {
        return this.handsPlayed > 0 ? Math.round((this.totalTricks / this.handsPlayed) * 10) / 10 : 0;
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
     * @param {number} tricks - Number of tricks taken (in points, divide by 10 for actual trick count)
     * @param {number} [bid] - Winning bid (if this player was the bidder)
     * @param {boolean} [bidSuccessful] - Whether the bid was successful (if this player was the bidder)
     */
    updateHandStats(meld, handScore, tricks = 0, bid = null, bidSuccessful = null) {
        this.totalMeld += meld;
        this.handsPlayed++;
        this.totalTricks += (tricks / 10); // Convert from points to actual trick count
        
        if (handScore > this.highestHand) {
            this.highestHand = handScore;
        }
        
        if (bid !== null) {
            this.totalBids++;
            if (bid > this.highestBid) {
                this.highestBid = bid;
            }
            if (bidSuccessful) {
                this.successfulBids++;
            }
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
        player.handsPlayed = data.handsPlayed || 0;
        player.totalBids = data.totalBids || 0;
        player.successfulBids = data.successfulBids || 0;
        player.totalTricks = data.totalTricks || 0;
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
            totalMeld: this.totalMeld,
            handsPlayed: this.handsPlayed,
            totalBids: this.totalBids,
            successfulBids: this.successfulBids,
            totalTricks: this.totalTricks
        };
    }
}

export default Player;