/**
 * Game hand model representing a single hand in a pinochle game
 */
class GameHand {
    /**
     * Create a new game hand
     * @param {number} handNumber - Hand number in sequence
     * @param {string} dealerId - ID of the dealer
     * @param {string} dealerName - Name of the dealer
     */
    constructor(handNumber, dealerId, dealerName) {
        this.handNumber = handNumber;
        this.winningBid = null;
        this.bidderId = null;
        this.bidderName = null;
        this.playerMeld = {};
        this.playerScores = {};
        this.timestamp = new Date().toISOString();
        this.dealerId = dealerId;
        this.dealerName = dealerName;
        this.thrownIn = false;
    }

    /**
     * Set the winning bid for this hand
     * @param {number} bid - Winning bid amount
     * @param {string} bidderId - ID of the bidder
     * @param {string} bidderName - Name of the bidder
     */
    setWinningBid(bid, bidderId, bidderName) {
        this.winningBid = bid;
        this.bidderId = bidderId;
        this.bidderName = bidderName;
    }

    /**
     * Set meld for a player
     * @param {string} playerId - Player ID
     * @param {number} meld - Meld points
     */
    setPlayerMeld(playerId, meld) {
        this.playerMeld[playerId] = meld;
    }

    /**
     * Set score for a player
     * @param {string} playerId - Player ID
     * @param {number} score - Hand score (tricks * 10)
     */
    setPlayerScore(playerId, score) {
        this.playerScores[playerId] = score;
    }

    /**
     * Mark this hand as thrown in (no bids)
     */
    throwIn() {
        this.thrownIn = true;
        this.winningBid = null;
        this.bidderId = null;
        this.bidderName = null;
        this.playerMeld = {};
        this.playerScores = {};
    }

    /**
     * Check if the bidder goes set (doesn't make their bid)
     * @returns {boolean} True if bidder goes set
     */
    isBidderSet() {
        if (!this.bidderId || !this.winningBid) {
            return false;
        }
        
        const bidderMeld = this.playerMeld[this.bidderId] || 0;
        const bidderScore = this.playerScores[this.bidderId] || 0;
        
        return (bidderMeld + bidderScore) < this.winningBid;
    }

    /**
     * Get total hand score for a player (meld + tricks)
     * @param {string} playerId - Player ID
     * @returns {number} Total hand score
     */
    getPlayerHandTotal(playerId) {
        const meld = this.playerMeld[playerId] || 0;
        const score = this.playerScores[playerId] || 0;
        return meld + score;
    }

    /**
     * Validate hand data
     * @param {Array} players - Array of players in the game
     * @returns {Object} Validation result with success boolean and errors array
     */
    validate(players) {
        const errors = [];

        // Check meld divisible by 10
        for (const playerId in this.playerMeld) {
            const meld = this.playerMeld[playerId];
            if (meld % 10 !== 0) {
                const player = players.find(p => p.id === playerId);
                errors.push(`${player?.name || 'Player'}'s meld must be divisible by 10`);
            }
        }

        // Check total tricks <= 25
        const totalTricks = Object.values(this.playerScores).reduce((sum, score) => sum + (score / 10), 0);
        if (totalTricks > 25) {
            errors.push('Total tricks cannot exceed 25');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Create a game hand from stored data
     * @param {Object} data - Stored hand data
     * @returns {GameHand} New hand instance
     */
    static fromData(data) {
        const hand = new GameHand(data.handNumber, data.dealerId, data.dealerName);
        hand.winningBid = data.winningBid;
        hand.bidderId = data.bidderId;
        hand.bidderName = data.bidderName;
        hand.playerMeld = data.playerMeld || {};
        hand.playerScores = data.playerScores || {};
        hand.timestamp = data.timestamp;
        hand.thrownIn = data.thrownIn || false;
        return hand;
    }

    /**
     * Convert hand to plain object for storage
     * @returns {Object} Plain object representation
     */
    toData() {
        return {
            handNumber: this.handNumber,
            winningBid: this.winningBid,
            bidderId: this.bidderId,
            bidderName: this.bidderName,
            playerMeld: this.playerMeld,
            playerScores: this.playerScores,
            timestamp: this.timestamp,
            dealerId: this.dealerId,
            dealerName: this.dealerName,
            thrownIn: this.thrownIn
        };
    }
}

export default GameHand;
