import Game from '../models/Game.js';
import GameHand from '../models/GameHand.js';
import TableSetupController from './TableSetupController.js';
import storageService from '../services/StorageService.js';
import notificationService from '../services/NotificationService.js';
import eventService, { EVENTS } from '../services/EventService.js';
import { DOM, Validation } from '../utils/helpers.js';
import { getGameConfig, getMinBid } from '../utils/config.js';

/**
 * Controller for managing game logic and flow
 */
class GameController {
    constructor(playerController) {
        this.playerController = playerController;
        this.tableSetupController = new TableSetupController();
        this.currentGame = null;
        this.pendingHand = null;
        this.elements = {};
        this.init();
    }

    /**
     * Initialize the controller
     */
    init() {
        this.bindElements();
        this.attachEventListeners();
        this.loadCurrentGame();
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.elements = {
            // Game setup
            gameType: DOM.getById('game-type'),
            playerSelection: DOM.getById('player-selection'),
            setupTableBtn: DOM.getById('setup-table'),
            startGameBtn: DOM.getById('start-game'),
            gameSetup: DOM.getById('game-setup'),
            gamePlay: DOM.getById('game-play'),
            
            // Game interface
            currentHand: DOM.getById('current-hand'),
            dealerDisplay: DOM.getById('dealer-display'),
            currentDealerHand: DOM.getById('current-dealer-hand'),
            targetScore: DOM.getById('target-score'),
            
            // Hand phases
            handStartSection: DOM.getById('hand-start-section'),
            meldSectionCard: DOM.getById('meld-section-card'),
            scoreSectionCard: DOM.getById('score-section-card'),
            
            // Hand inputs
            winningBidInput: DOM.getById('winning-bid'),
            bidderSelect: DOM.getById('bidder'),
            meldInputs: DOM.getById('meld-inputs'),
            scoreInputs: DOM.getById('score-inputs'),
            
            // Hand displays
            meldWinningBid: DOM.getById('meld-winning-bid'),
            scoreWinningBid: DOM.getById('score-winning-bid'),
            scoreTricksRequired: DOM.getById('score-tricks-required'),
            
            // Actions
            nextToMeldBtn: DOM.getById('next-to-meld'),
            nextToScoreBtn: DOM.getById('next-to-score'),
            submitHandBtn: DOM.getById('submit-hand'),
            throwInHandBtn: DOM.getById('throw-in-hand'),
            shotMoonBtn: DOM.getById('shot-the-moon'),
            endGameBtn: DOM.getById('end-game'),
            
            // Moon options
            moonOptions: DOM.getById('moon-options'),
            
            // Scoreboard
            scoreboard: DOM.getById('scoreboard'),
            editScoresBtn: DOM.getById('edit-scores')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Game setup
        if (this.elements.gameType) {
            DOM.on(this.elements.gameType, 'change', () => {
                this.updatePlayerSelection();
                const gameType = parseInt(this.elements.gameType.value);
                this.tableSetupController.setGameType(gameType);
                eventService.emit('game-type-changed', gameType);
            });
        }

        if (this.elements.setupTableBtn) {
            DOM.on(this.elements.setupTableBtn, 'click', () => this.setupTable());
        }

        if (this.elements.startGameBtn) {
            DOM.on(this.elements.startGameBtn, 'click', () => this.startGame());
        }

        // Hand phases
        if (this.elements.nextToMeldBtn) {
            DOM.on(this.elements.nextToMeldBtn, 'click', () => this.nextToMeldPhase());
        }

        if (this.elements.nextToScoreBtn) {
            DOM.on(this.elements.nextToScoreBtn, 'click', () => this.nextToScorePhase());
        }

        if (this.elements.submitHandBtn) {
            DOM.on(this.elements.submitHandBtn, 'click', () => this.submitHand());
        }

        if (this.elements.throwInHandBtn) {
            DOM.on(this.elements.throwInHandBtn, 'click', () => this.throwInHand());
        }

        if (this.elements.shotMoonBtn) {
            DOM.on(this.elements.shotMoonBtn, 'click', () => this.shotTheMoon());
        }

        if (this.elements.endGameBtn) {
            DOM.on(this.elements.endGameBtn, 'click', () => this.endGame());
        }

        if (this.elements.editScoresBtn) {
            DOM.on(this.elements.editScoresBtn, 'click', () => this.showEditScores());
        }

        // External events
        eventService.on(EVENTS.PLAYERS_LOADED, () => this.updatePlayerSelection());
        eventService.on(EVENTS.PLAYER_ADDED, () => this.updatePlayerSelection());
        eventService.on(EVENTS.PLAYER_REMOVED, () => this.updatePlayerSelection());
    }

    /**
     * Load current game from storage
     */
    loadCurrentGame() {
        try {
            const gameData = storageService.loadCurrentGame();
            if (gameData) {
                this.currentGame = Game.fromData(gameData);
                this.updateGameInterface();
                eventService.emit(EVENTS.GAME_LOADED, this.currentGame);
            }
        } catch (error) {
            console.error('Failed to load current game:', error);
            notificationService.error('Failed to load current game');
        }
    }

    /**
     * Save current game to storage
     */
    saveCurrentGame() {
        if (!this.currentGame) return;

        try {
            const gameData = this.currentGame.toData();
            storageService.saveCurrentGame(gameData);
            eventService.emit(EVENTS.DATA_SAVED, { type: 'game', data: gameData });
        } catch (error) {
            console.error('Failed to save current game:', error);
            notificationService.error('Failed to save game');
        }
    }

    /**
     * Update player selection display
     */
    updatePlayerSelection() {
        const gameType = parseInt(this.elements.gameType?.value || '2');
        const playerSelection = this.elements.playerSelection;
        
        if (!playerSelection) return;

        const players = this.playerController.getAllPlayers();
        
        if (players.length < gameType) {
            DOM.setHTML(playerSelection, 
                `<p>You need at least ${gameType} players to start a ${gameType}-player game. Add more players first.</p>`
            );
            // Hide setup table button
            if (this.elements.setupTableBtn) {
                DOM.hide(this.elements.setupTableBtn);
            }
            return;
        }

        const html = `
            <h4>Select ${gameType} Players:</h4>
            ${players.map(player => `
                <div class="player-item" data-player-id="${player.id}">
                    <div class="player-name">${player.name}</div>
                </div>
            `).join('')}
            <p><em>Click players to select them. You need exactly ${gameType} players.</em></p>
        `;

        DOM.setHTML(playerSelection, html);

        // Show setup table button
        if (this.elements.setupTableBtn) {
            DOM.show(this.elements.setupTableBtn);
        }

        // Add click event listeners to player items
        DOM.queryAll('.player-item').forEach(item => {
            DOM.on(item, 'click', () => {
                item.classList.toggle('selected');
                this.checkPlayerSelection();
            });
        });
    }

    /**
     * Check if the correct number of players are selected
     */
    checkPlayerSelection() {
        const gameType = parseInt(this.elements.gameType?.value || '2');
        const selectedElements = DOM.queryAll('.player-item.selected');
        
        if (selectedElements.length === gameType) {
            const selectedPlayerIds = Array.from(selectedElements).map(el => el.dataset.playerId);
            const selectedPlayers = this.playerController.getPlayersByIds(selectedPlayerIds);
            
            // Update table setup controller with selected players
            this.tableSetupController.setSelectedPlayers(selectedPlayers);
            eventService.emit('players-selected', selectedPlayers);
            
            // Enable setup table button
            if (this.elements.setupTableBtn) {
                this.elements.setupTableBtn.disabled = false;
                DOM.setText(this.elements.setupTableBtn, 'Setup Table');
            }
        } else {
            // Disable setup table button
            if (this.elements.setupTableBtn) {
                this.elements.setupTableBtn.disabled = true;
                DOM.setText(this.elements.setupTableBtn, `Select ${gameType} players first`);
            }
        }
    }

    /**
     * Setup table with selected players
     */
    setupTable() {
        const gameType = parseInt(this.elements.gameType?.value || '2');
        const selectedElements = DOM.queryAll('.player-item.selected');
        const selectedPlayerIds = Array.from(selectedElements).map(el => el.dataset.playerId);

        if (selectedPlayerIds.length !== gameType) {
            notificationService.error(`Please select exactly ${gameType} players first`);
            return;
        }

        // Show table setup interface
        this.tableSetupController.showTableSetup();
    }

    /**
     * Start a new game
     */
    startGame() {
        // Check if table setup is complete
        if (!this.tableSetupController.isTableSetupComplete()) {
            notificationService.error('Please complete the table setup first');
            return;
        }

        try {
            // Get arranged players from table setup
            const arrangedPlayers = this.tableSetupController.getArrangedPlayers();
            const gameType = parseInt(this.elements.gameType?.value || '2');
            
            // Create game with arranged players
            this.currentGame = new Game(arrangedPlayers, gameType);
            
            // For 4-player games, set team assignments
            if (gameType === 4) {
                const teamAssignments = this.tableSetupController.getTeamAssignments();
                if (teamAssignments) {
                    this.currentGame.teamAssignments = teamAssignments;
                }
            }
            
            this.saveCurrentGame();
            this.updateGameInterface();
            this.showGameInterface();
            
            notificationService.success('Game started with table arrangement!');
            eventService.emit(EVENTS.GAME_STARTED, this.currentGame);
        } catch (error) {
            console.error('Failed to start game:', error);
            notificationService.error('Failed to start game');
        }
    }

    /**
     * Show game interface and hide setup
     */
    showGameInterface() {
        if (this.elements.gameSetup) {
            DOM.hide(this.elements.gameSetup);
        }
        if (this.elements.gamePlay) {
            DOM.show(this.elements.gamePlay);
        }
    }

    /**
     * Update the game interface
     */
    updateGameInterface() {
        if (!this.currentGame) return;

        try {
            // Update basic info
            DOM.setText(this.elements.currentHand, this.currentGame.getNextHandNumber());
            DOM.setText(this.elements.targetScore, this.currentGame.targetScore);

            // Update dealer info
            const dealer = this.currentGame.getCurrentDealer();
            const dealerText = `Dealer: ${dealer.name}`;
            DOM.setText(this.elements.dealerDisplay, dealerText);
            DOM.setText(this.elements.currentDealerHand, dealerText);

            // Reset hand phase display
            this.showHandStartPhase();
            this.updateBidderOptions();
            this.updateMeldScoreInputs();
            this.updateScoreboard();

        } catch (error) {
            console.error('Failed to update game interface:', error);
            notificationService.error('Failed to update game interface');
        }
    }

    /**
     * Show hand start phase
     */
    showHandStartPhase() {
        DOM.show(this.elements.handStartSection);
        DOM.hide(this.elements.meldSectionCard);
        DOM.hide(this.elements.scoreSectionCard);
    }

    /**
     * Update bidder select options
     */
    updateBidderOptions() {
        if (!this.currentGame || !this.elements.bidderSelect) return;

        const html = this.currentGame.players.map(p => 
            `<option value="${p.id}">${p.name}</option>`
        ).join('');

        DOM.setHTML(this.elements.bidderSelect, html);
    }

    /**
     * Update meld and score input sections
     */
    updateMeldScoreInputs() {
        if (!this.currentGame) return;

        // Meld inputs
        if (this.elements.meldInputs) {
            const meldHtml = this.currentGame.players.map(p => {
                let checkbox = '';
                // Only show checkbox for non-winning players
                if (!this.pendingHand || p.id !== this.pendingHand.bidderId) {
                    checkbox = `<label class="nines-only-label">
                        <input type="checkbox" id="nines-only-${p.id}"> Only 9's of trump?
                    </label>`;
                }
                return `
                    <div class="player-input">
                        <label>${p.name} Meld:</label>
                        <input type="number" id="meld-${p.id}" min="0" step="10" value="0">
                        ${checkbox}
                    </div>
                `;
            }).join('');

            DOM.setHTML(this.elements.meldInputs, meldHtml);
        }

        // Score inputs
        if (this.elements.scoreInputs) {
            const scoreHtml = this.currentGame.players.map(p => `
                <div class="player-input">
                    <label>${p.name} Tricks:</label>
                    <input type="number" id="score-${p.id}" min="0" max="25" value="0">
                </div>
            `).join('');

            DOM.setHTML(this.elements.scoreInputs, scoreHtml);
        }
    }

    /**
     * Proceed to meld phase
     */
    nextToMeldPhase() {
        if (!this.currentGame) return;

        const winningBid = parseInt(this.elements.winningBidInput?.value);
        const bidderId = this.elements.bidderSelect?.value;

        // Validate bid
        const minBid = getMinBid(this.currentGame.gameType);
        const bidValidation = Validation.bid(winningBid, minBid);
        if (!bidValidation.valid) {
            notificationService.error(bidValidation.error);
            return;
        }

        if (!bidderId) {
            notificationService.error('Please select a bidder');
            return;
        }

        try {
            const bidder = this.currentGame.players.find(p => p.id === bidderId);
            this.pendingHand = {
                winningBid,
                bidderId,
                bidderName: bidder.name
            };

            // Update UI
            DOM.hide(this.elements.handStartSection);
            DOM.show(this.elements.meldSectionCard);
            DOM.setText(this.elements.meldWinningBid, 
                `${winningBid} (${this.pendingHand.bidderName})`);

            eventService.emit(EVENTS.HAND_STARTED, this.pendingHand);
        } catch (error) {
            console.error('Failed to proceed to meld phase:', error);
            notificationService.error('Failed to proceed to meld phase');
        }
    }

    /**
     * Proceed to score phase
     */
    nextToScorePhase() {
        if (!this.currentGame || !this.pendingHand) return;

        try {
            DOM.hide(this.elements.meldSectionCard);
            DOM.show(this.elements.scoreSectionCard);
            DOM.setText(this.elements.scoreWinningBid, this.pendingHand.winningBid);

            // Calculate tricks required
            const meldInput = DOM.getById(`meld-${this.pendingHand.bidderId}`);
            const meldValue = meldInput ? parseInt(meldInput.value) || 0 : 0;
            let tricksRequired = Math.floor((this.pendingHand.winningBid - meldValue) / 10);
            if (tricksRequired < 1) tricksRequired = 1;

            DOM.setText(this.elements.scoreTricksRequired, tricksRequired);

            // Show moon options if needed
            if (this.elements.moonOptions) {
                if (tricksRequired > 25) {
                    DOM.show(this.elements.moonOptions);
                } else {
                    DOM.hide(this.elements.moonOptions);
                }
            }
        } catch (error) {
            console.error('Failed to proceed to score phase:', error);
            notificationService.error('Failed to proceed to score phase');
        }
    }

    /**
     * Submit completed hand
     */
    submitHand() {
        if (!this.currentGame || !this.pendingHand) return;

        try {
            const dealer = this.currentGame.getCurrentDealer();
            const hand = new GameHand(
                this.currentGame.getNextHandNumber(),
                dealer.id,
                dealer.name
            );

            hand.setWinningBid(
                this.pendingHand.winningBid,
                this.pendingHand.bidderId,
                this.pendingHand.bidderName
            );

            // Collect meld and scores
            const trickCounts = [];
            for (const player of this.currentGame.players) {
                const meldInput = DOM.getById(`meld-${player.id}`);
                const scoreInput = DOM.getById(`score-${player.id}`);

                const meld = parseInt(meldInput?.value) || 0;
                const tricks = parseInt(scoreInput?.value) || 0;

                // Validate meld
                const meldValidation = Validation.meld(meld);
                if (!meldValidation.valid) {
                    notificationService.error(`${player.name}: ${meldValidation.error}`);
                    return;
                }

                // Validate tricks
                const tricksValidation = Validation.tricks(tricks);
                if (!tricksValidation.valid) {
                    notificationService.error(`${player.name}: ${tricksValidation.error}`);
                    return;
                }

                trickCounts.push(tricks);

                // Apply meld safety logic for non-bidders
                let finalMeld = meld;
                if (player.id !== this.pendingHand.bidderId && meld > 0) {
                    const ninesCheckbox = DOM.getById(`nines-only-${player.id}`);
                    const ninesOnly = ninesCheckbox?.checked || false;

                    if ((meld === 10 || meld === 20) && ninesOnly) {
                        // Safe - keep meld
                    } else if (tricks < 1) {
                        // Not safe - lose meld
                        finalMeld = 0;
                        notificationService.warning(
                            `${player.name}'s meld is lost (must win at least 1 trick)`
                        );
                    }
                }

                hand.setPlayerMeld(player.id, finalMeld);
                hand.setPlayerScore(player.id, tricks * 10);
            }

            // Validate total tricks
            const totalTricksValidation = Validation.totalTricks(trickCounts);
            if (!totalTricksValidation.valid) {
                notificationService.error(totalTricksValidation.error);
                return;
            }

            // Validate hand
            const handValidation = hand.validate(this.currentGame.players);
            if (!handValidation.valid) {
                notificationService.error(handValidation.errors[0]);
                return;
            }

            // Add hand to game
            this.currentGame.addHand(hand);
            this.saveCurrentGame();

            // Update player statistics
            this.updatePlayerHandStats(hand);

            // Reset interface
            this.resetHandInputs();
            this.pendingHand = null;
            this.updateGameInterface();
            this.checkGameEnd();

            notificationService.handComplete(hand.handNumber);
            eventService.emit(EVENTS.HAND_COMPLETED, hand);

        } catch (error) {
            console.error('Failed to submit hand:', error);
            notificationService.error('Failed to submit hand');
        }
    }

    /**
     * Throw in hand (no bids)
     */
    throwInHand() {
        if (!this.currentGame) return;

        try {
            const dealer = this.currentGame.getCurrentDealer();
            const hand = new GameHand(
                this.currentGame.getNextHandNumber(),
                dealer.id,
                dealer.name
            );

            hand.throwIn();
            this.currentGame.addHand(hand);
            this.saveCurrentGame();

            this.resetHandInputs();
            this.pendingHand = null;
            this.updateGameInterface();

            notificationService.info('Hand thrown in (no bids)');
            eventService.emit(EVENTS.HAND_THROWN_IN, hand);

        } catch (error) {
            console.error('Failed to throw in hand:', error);
            notificationService.error('Failed to throw in hand');
        }
    }

    /**
     * Handle shot the moon scenario
     */
    shotTheMoon() {
        if (!this.currentGame || !this.pendingHand) return;

        try {
            const dealer = this.currentGame.getCurrentDealer();
            const hand = new GameHand(
                this.currentGame.getNextHandNumber(),
                dealer.id,
                dealer.name
            );

            hand.setWinningBid(
                this.pendingHand.winningBid,
                this.pendingHand.bidderId,
                this.pendingHand.bidderName
            );

            // Bidder gets 500 points, others get their meld only
            for (const player of this.currentGame.players) {
                if (player.id === this.pendingHand.bidderId) {
                    hand.setPlayerMeld(player.id, 0);
                    hand.setPlayerScore(player.id, 500);
                } else {
                    const meldInput = DOM.getById(`meld-${player.id}`);
                    const meld = parseInt(meldInput?.value) || 0;
                    hand.setPlayerMeld(player.id, meld);
                    hand.setPlayerScore(player.id, 0);
                }
            }

            this.currentGame.addHand(hand);
            this.saveCurrentGame();

            this.resetHandInputs();
            this.pendingHand = null;
            this.updateGameInterface();

            notificationService.success('Shot the Moon! Scores updated.');
            eventService.emit(EVENTS.HAND_SHOT_MOON, hand);

        } catch (error) {
            console.error('Failed to handle shot the moon:', error);
            notificationService.error('Failed to handle shot the moon');
        }
    }

    /**
     * Check if game has ended
     */
    checkGameEnd() {
        if (!this.currentGame) return;

        const winner = this.currentGame.checkForWinner();
        if (winner) {
            notificationService.gameWin(winner.name, winner.score);
            
            setTimeout(() => {
                if (notificationService.confirm(
                    `${winner.name} has reached ${this.currentGame.targetScore} points and wins!\n\nEnd the game now?`
                )) {
                    this.endGame();
                }
            }, 1500);
        }
    }

    /**
     * End the current game
     */
    endGame() {
        if (!this.currentGame) return;

        if (!notificationService.confirm('Are you sure you want to end this game?')) {
            return;
        }

        try {
            const winner = this.currentGame.scores.reduce((prev, current) => 
                (prev.score > current.score) ? prev : current
            );

            this.currentGame.endGame(winner.playerId, winner.name);

            // Update player statistics
            this.updatePlayerGameStats();

            // Save to history and clear current game
            const gameData = this.currentGame.toData();
            storageService.addToGameHistory(gameData);
            storageService.removeCurrentGame();

            // Reset UI
            this.currentGame = null;
            this.pendingHand = null;
            DOM.show(this.elements.gameSetup);
            DOM.hide(this.elements.gamePlay);

            notificationService.success(`Game ended! ${winner.name} wins with ${winner.score} points!`);
            eventService.emit(EVENTS.GAME_ENDED, gameData);

        } catch (error) {
            console.error('Failed to end game:', error);
            notificationService.error('Failed to end game');
        }
    }

    /**
     * Update scoreboard display
     */
    updateScoreboard() {
        if (!this.currentGame || !this.elements.scoreboard) return;

        try {
            const players = this.currentGame.players;
            const scores = this.currentGame.scores;
            const hands = this.currentGame.hands;

            let html = '<table><thead><tr><th>Round / Winning Bid</th>';
            for (const player of players) {
                html += `<th>${player.name}</th>`;
            }
            html += '</tr></thead><tbody>';

            hands.forEach(hand => {
                let roundInfo = `#${hand.handNumber}`;
                if (hand.winningBid) {
                    roundInfo += ` | Bid: ${hand.winningBid}`;
                    if (hand.bidderName) {
                        roundInfo += ` (${hand.bidderName})`;
                    }
                }

                html += `<tr><td>${roundInfo}</td>`;

                if (hand.thrownIn) {
                    html += `<td colspan="${players.length}" style="color:#e74c3c;font-weight:bold;">Thrown In (No Bids)</td>`;
                } else {
                    for (const player of players) {
                        const meld = hand.playerMeld[player.id] || 0;
                        const score = hand.playerScores[player.id] || 0;
                        html += `<td>Meld: ${meld}<br>Score: ${score}</td>`;
                    }
                }
                html += '</tr>';
            });

            // Add totals row
            html += '<tr><td><b>Total</b></td>';
            for (const player of players) {
                const total = scores.find(s => s.playerId === player.id).score;
                html += `<td><b>${total}</b></td>`;
            }
            html += '</tr></tbody></table>';

            DOM.setHTML(this.elements.scoreboard, html);
            eventService.emit(EVENTS.SCOREBOARD_UPDATED, this.currentGame);

        } catch (error) {
            console.error('Failed to update scoreboard:', error);
        }
    }

    /**
     * Update player hand statistics
     * @param {GameHand} hand - Completed hand
     */
    updatePlayerHandStats(hand) {
        if (!this.currentGame) return;

        try {
            for (const player of this.currentGame.players) {
                const meld = hand.playerMeld[player.id] || 0;
                const score = hand.playerScores[player.id] || 0;
                const handTotal = meld + score;
                const bid = player.id === hand.bidderId ? hand.winningBid : null;

                this.playerController.updatePlayerStats(player.id, {
                    totalMeld: player.totalMeld + meld,
                    highestHand: Math.max(player.highestHand, handTotal),
                    highestBid: bid ? Math.max(player.highestBid, bid) : player.highestBid
                });
            }
        } catch (error) {
            console.error('Failed to update player hand stats:', error);
        }
    }

    /**
     * Update player game statistics
     */
    updatePlayerGameStats() {
        if (!this.currentGame) return;

        try {
            for (const player of this.currentGame.players) {
                const finalScore = this.currentGame.scores.find(s => s.playerId === player.id).score;
                const won = player.id === this.currentGame.winnerId;

                this.playerController.updatePlayerStats(player.id, {
                    gamesPlayed: player.gamesPlayed + 1,
                    gamesWon: won ? player.gamesWon + 1 : player.gamesWon,
                    totalScore: player.totalScore + finalScore
                });
            }
        } catch (error) {
            console.error('Failed to update player game stats:', error);
        }
    }

    /**
     * Reset hand input fields
     */
    resetHandInputs() {
        if (this.elements.winningBidInput) {
            this.elements.winningBidInput.value = '';
        }

        DOM.queryAll('[id^="meld-"]').forEach(input => input.value = '0');
        DOM.queryAll('[id^="score-"]').forEach(input => input.value = '0');
    }

    /**
     * Show score editing interface
     */
    showEditScores() {
        // Implementation would be similar to the original but modularized
        notificationService.info('Score editing feature will be implemented');
    }

    /**
     * Get current game status
     * @returns {Object|null} Game status or null
     */
    getGameStatus() {
        return this.currentGame ? this.currentGame.getStatus() : null;
    }

    /**
     * Export current game data
     * @returns {Object|null} Game data or null
     */
    exportCurrentGame() {
        return this.currentGame ? this.currentGame.toData() : null;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.currentGame = null;
        this.pendingHand = null;
        this.elements = {};
    }
}

export default GameController;