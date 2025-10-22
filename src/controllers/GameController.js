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
            backToBidBtn: DOM.getById('back-to-bid'),
            backToMeldBtn: DOM.getById('back-to-meld'),
            
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

        // Back navigation buttons
        if (this.elements.backToBidBtn) {
            DOM.on(this.elements.backToBidBtn, 'click', () => this.backToBidPhase());
        }

        if (this.elements.backToMeldBtn) {
            DOM.on(this.elements.backToMeldBtn, 'click', () => this.backToMeldPhase());
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
     * Check if a player is on the same team as the bidder (4-player games only)
     * @param {string} playerId - Player ID to check
     * @returns {boolean} True if player is the bidder's teammate
     */
    isPlayerBidderTeammate(playerId) {
        if (!this.currentGame || !this.pendingHand || this.currentGame.gameType !== 4) {
            return false;
        }

        const bidderId = this.pendingHand.bidderId;
        const teamAssignments = this.currentGame.teamAssignments;
        
        if (!teamAssignments) return false;

        // Check if both players are on the same team
        const bidderOnTeamA = teamAssignments.teamA.some(p => p.id === bidderId);
        const playerOnTeamA = teamAssignments.teamA.some(p => p.id === playerId);
        
        // They are teammates if they're on the same team
        return bidderOnTeamA === playerOnTeamA;
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
                // Only show checkbox for players who are NOT the bidder AND NOT the bidder's teammate
                const isBidder = this.pendingHand && p.id === this.pendingHand.bidderId;
                const isBidderTeammate = this.isPlayerBidderTeammate(p.id);
                
                if (!isBidder && !isBidderTeammate) {
                    checkbox = `<label class="nines-only-label" id="nines-label-${p.id}" style="display: none;">
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
            
            // Add event listeners to meld inputs to toggle 9's checkbox visibility
            this.currentGame.players.forEach(p => {
                const meldInput = DOM.getById(`meld-${p.id}`);
                const isBidder = this.pendingHand && p.id === this.pendingHand.bidderId;
                const isBidderTeammate = this.isPlayerBidderTeammate(p.id);
                
                if (meldInput && !isBidder && !isBidderTeammate) {
                    meldInput.addEventListener('input', () => {
                        this.toggleNinesCheckbox(p.id);
                    });
                    // Initialize checkbox visibility based on current value
                    this.toggleNinesCheckbox(p.id);
                }
            });
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
     * Toggle visibility of 9's checkbox based on meld value and game type
     * @param {string} playerId - Player ID
     */
    toggleNinesCheckbox(playerId) {
        if (!this.currentGame) return;
        
        const meldInput = DOM.getById(`meld-${playerId}`);
        const ninesLabel = DOM.getById(`nines-label-${playerId}`);
        
        if (!meldInput || !ninesLabel) return;
        
        const meldValue = parseInt(meldInput.value) || 0;
        const gameType = this.currentGame.gameType;
        
        // Show checkbox only if meld value could be made up of only 9's of trump
        let shouldShow = false;
        if (gameType === 2) {
            // 2-player: only 1 nine of trump (max 10 points)
            shouldShow = (meldValue === 10);
        } else {
            // 3/4-player: 2 nines of trump (max 20 points)
            shouldShow = (meldValue === 10 || meldValue === 20);
        }
        
        ninesLabel.style.display = shouldShow ? 'block' : 'none';
        
        // Uncheck the checkbox if hiding it
        if (!shouldShow) {
            const checkbox = DOM.getById(`nines-only-${playerId}`);
            if (checkbox) {
                checkbox.checked = false;
            }
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

            // Update meld inputs to reflect any bidder changes
            this.updateMeldScoreInputs();

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
     * Go back to bid phase from meld phase
     */
    backToBidPhase() {
        if (!this.currentGame) return;

        try {
            // Show bid section, hide meld section
            DOM.show(this.elements.handStartSection);
            DOM.hide(this.elements.meldSectionCard);

            // Restore previous values if they exist
            if (this.pendingHand) {
                if (this.elements.winningBidInput) {
                    this.elements.winningBidInput.value = this.pendingHand.winningBid || '';
                }
                if (this.elements.bidderSelect && this.pendingHand.bidderId) {
                    this.elements.bidderSelect.value = this.pendingHand.bidderId;
                }
            }

            eventService.emit('hand-phase-changed', 'bid');
        } catch (error) {
            console.error('Failed to go back to bid phase:', error);
            notificationService.error('Failed to go back to bid phase');
        }
    }

    /**
     * Go back to meld phase from score phase
     */
    backToMeldPhase() {
        if (!this.currentGame || !this.pendingHand) return;

        try {
            // Show meld section, hide score section
            DOM.hide(this.elements.scoreSectionCard);
            DOM.show(this.elements.meldSectionCard);

            // Update meld display
            DOM.setText(this.elements.meldWinningBid, 
                `${this.pendingHand.winningBid} (${this.pendingHand.bidderName})`);

            eventService.emit('hand-phase-changed', 'meld');
        } catch (error) {
            console.error('Failed to go back to meld phase:', error);
            notificationService.error('Failed to go back to meld phase');
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
            const winnerName = winner.teamName || winner.name;
            const winnerScore = winner.score;
            
            notificationService.gameWin(winnerName, winnerScore);
            
            setTimeout(() => {
                this.showFinalScoreModal(winnerName, winnerScore);
            }, 1500);
        }
    }

    /**
     * Show final score modal before ending the game
     * @param {string} winnerName - Name of the winner
     * @param {number} winnerScore - Winner's score
     */
    showFinalScoreModal(winnerName, winnerScore) {
        // Remove existing modal if it exists
        const existingModal = DOM.getById('final-score-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'final-score-modal';
        modal.classList.add('final-score-modal');

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.classList.add('final-score-modal-content');

        // Create header
        const header = document.createElement('div');
        header.classList.add('final-score-header');
        header.innerHTML = `
            <h2>🎉 Game Complete!</h2>
            <p><strong>${winnerName}</strong> wins with <strong>${winnerScore}</strong> points!</p>
        `;

        // Create scoreboard container
        const scoreboardContainer = document.createElement('div');
        scoreboardContainer.classList.add('final-score-scoreboard');
        scoreboardContainer.innerHTML = '<h3>Final Scores</h3>';
        
        // Generate the same scoreboard HTML
        const scoreboardTable = document.createElement('div');
        scoreboardTable.innerHTML = this.generateScoreboardHTML();
        scoreboardContainer.appendChild(scoreboardTable);

        // Create actions
        const actions = document.createElement('div');
        actions.classList.add('final-score-actions');
        actions.innerHTML = `
            <button id="end-game-confirm" class="primary-button">End Game</button>
            <button id="continue-playing" class="secondary-button">Continue Playing</button>
        `;

        modalContent.appendChild(header);
        modalContent.appendChild(scoreboardContainer);
        modalContent.appendChild(actions);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add event listeners
        this.initializeFinalScoreHandlers(modal, winnerName);
    }

    /**
     * Generate scoreboard HTML (reusable from updateScoreboard)
     * @returns {string} HTML string for the scoreboard
     */
    generateScoreboardHTML() {
        if (!this.currentGame) return '';

        const players = this.currentGame.players;
        const scores = this.currentGame.scores;
        const hands = this.currentGame.hands;
        const is4PlayerTeamGame = this.currentGame.gameType === 4 && this.currentGame.teamAssignments;

        let html = '<table><thead><tr><th>Round / Winning Bid</th>';
        
        // Header row with player names and team colors for 4-player games
        if (is4PlayerTeamGame) {
            for (const player of players) {
                const teamClass = this.getPlayerTeamClass(player.id);
                html += `<th class="${teamClass}">${player.name}</th>`;
            }
            // Add team total columns
            html += '<th class="team-a-header">Team A Total</th>';
            html += '<th class="team-b-header">Team B Total</th>';
        } else {
            for (const player of players) {
                html += `<th>${player.name}</th>`;
            }
        }
        html += '</tr></thead><tbody>';

        // Hand rows
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
                const colSpan = is4PlayerTeamGame ? players.length + 2 : players.length;
                html += `<td colspan="${colSpan}" style="color:#e74c3c;font-weight:bold;">Thrown In (No Bids)</td>`;
            } else {
                // Player scores
                for (const player of players) {
                    const meld = hand.playerMeld[player.id] || 0;
                    const score = hand.playerScores[player.id] || 0;
                    const tricks = score / 10; // Convert score back to tricks for display
                    const handTotal = meld + score;
                    const teamClass = is4PlayerTeamGame ? this.getPlayerTeamClass(player.id) : '';
                    
                    // Check if this player is the bidder for hand result
                    const isBidder = player.id === hand.bidderId;
                    let handResult = '';
                    if (isBidder && hand.winningBid) {
                        const bidderTotal = meld + score;
                        handResult = bidderTotal >= hand.winningBid ? 'Success' : 'Set';
                    }
                    
                    // Build the cell content
                    let cellContent = `Meld: ${meld}<br>Tricks: ${tricks}`;
                    if (handResult) {
                        cellContent += `<br><strong>${handResult}</strong>`;
                    }
                    cellContent += `<br>Total: ${handTotal}`;
                    
                    html += `<td class="${teamClass}">${cellContent}</td>`;
                }
                
                // Team totals for this hand (4-player only)
                if (is4PlayerTeamGame) {
                    const teamAHandTotal = this.currentGame.teamAssignments.teamA.reduce((total, player) => {
                        const meld = hand.playerMeld[player.id] || 0;
                        const score = hand.playerScores[player.id] || 0;
                        return total + meld + score;
                    }, 0);
                    
                    const teamBHandTotal = this.currentGame.teamAssignments.teamB.reduce((total, player) => {
                        const meld = hand.playerMeld[player.id] || 0;
                        const score = hand.playerScores[player.id] || 0;
                        return total + meld + score;
                    }, 0);
                    
                    html += `<td class="team-a-cell"><b>${teamAHandTotal}</b></td>`;
                    html += `<td class="team-b-cell"><b>${teamBHandTotal}</b></td>`;
                }
            }
            html += '</tr>';
        });

        // Totals row
        html += '<tr class="totals-row"><td><b>Total</b></td>';
        for (const player of players) {
            const total = scores.find(s => s.playerId === player.id).score;
            const teamClass = is4PlayerTeamGame ? this.getPlayerTeamClass(player.id) : '';
            html += `<td class="${teamClass}"><b>${total}</b></td>`;
        }
        
        // Team grand totals (4-player only)
        if (is4PlayerTeamGame) {
            const teamScores = this.currentGame.getTeamScores();
            html += `<td class="team-a-total"><b>${teamScores.teamA}</b></td>`;
            html += `<td class="team-b-total"><b>${teamScores.teamB}</b></td>`;
        }
        
        html += '</tr></tbody></table>';

        // Add team legend for 4-player games
        if (is4PlayerTeamGame) {
            html += `
                <div class="team-legend" style="margin-top: 15px;">
                    <div class="team-indicator">
                        <div class="team-color team-a"></div>
                        <span>Team A: ${this.currentGame.teamAssignments.teamA.map(p => p.name).join(' & ')}</span>
                    </div>
                    <div class="team-indicator">
                        <div class="team-color team-b"></div>
                        <span>Team B: ${this.currentGame.teamAssignments.teamB.map(p => p.name).join(' & ')}</span>
                    </div>
                </div>
            `;
        }

        return html;
    }

    /**
     * Initialize event handlers for the final score modal
     * @param {HTMLElement} modal - Modal element
     * @param {string} winnerName - Name of the winner
     */
    initializeFinalScoreHandlers(modal, winnerName) {
        // End game button handler
        const endGameBtn = DOM.getById('end-game-confirm');
        if (endGameBtn) {
            DOM.on(endGameBtn, 'click', () => {
                modal.remove();
                this.confirmEndGame();
            });
        }

        // Continue playing button handler
        const continueBtn = DOM.getById('continue-playing');
        if (continueBtn) {
            DOM.on(continueBtn, 'click', () => {
                modal.remove();
                // Just close the modal and continue the game
            });
        }

        // Modal background click to close
        DOM.on(modal, 'click', (e) => {
            if (e.target === modal) {
                // Treat background click as "continue playing"
                modal.remove();
            }
        });

        // Escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * End the current game - shows final score modal first
     */
    endGame() {
        if (!this.currentGame) return;

        try {
            // Determine the winner to show in the final score modal
            let winner;
            let winnerName;
            let winnerScore;
            
            // Check for team or individual winner
            const gameWinner = this.currentGame.checkForWinner();
            if (gameWinner && gameWinner.type === 'team') {
                // Team winner
                winnerName = gameWinner.teamName;
                winnerScore = gameWinner.score;
            } else {
                // Individual winner (highest score)
                winner = this.currentGame.scores.reduce((prev, current) => 
                    (prev.score > current.score) ? prev : current
                );
                winnerName = winner.name;
                winnerScore = winner.score;
            }

            // Show the final score modal instead of immediately ending
            this.showFinalScoreModal(winnerName, winnerScore);

        } catch (error) {
            console.error('Failed to show final score:', error);
            notificationService.error('Failed to show final score');
        }
    }

    /**
     * Actually end the game (called from final score modal)
     */
    confirmEndGame() {
        if (!this.currentGame) return;

        if (!notificationService.confirm('Are you sure you want to end this game?')) {
            return;
        }

        try {
            let winner;
            let winnerMessage;
            
            // Check for team or individual winner
            const gameWinner = this.currentGame.checkForWinner();
            if (gameWinner && gameWinner.type === 'team') {
                // Team winner
                winner = { 
                    playerId: `team_${gameWinner.team}`, 
                    name: gameWinner.teamName 
                };
                winnerMessage = `${gameWinner.teamName} wins with ${gameWinner.score} points!`;
            } else {
                // Individual winner (highest score)
                winner = this.currentGame.scores.reduce((prev, current) => 
                    (prev.score > current.score) ? prev : current
                );
                winnerMessage = `Game ended! ${winner.name} wins with ${winner.score} points!`;
            }

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

            notificationService.success(winnerMessage);
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
            const html = this.generateScoreboardHTML();
            DOM.setHTML(this.elements.scoreboard, html);
            eventService.emit(EVENTS.SCOREBOARD_UPDATED, this.currentGame);

        } catch (error) {
            console.error('Failed to update scoreboard:', error);
        }
    }

    /**
     * Get team class for a player in 4-player games
     * @param {string} playerId - Player ID
     * @returns {string} Team class name
     */
    getPlayerTeamClass(playerId) {
        if (!this.currentGame?.teamAssignments) return '';
        
        const isTeamA = this.currentGame.teamAssignments.teamA.some(p => p.id === playerId);
        return isTeamA ? 'team-a' : 'team-b';
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
        if (!this.currentGame || !this.currentGame.hands.length) {
            notificationService.warning('No hands to edit');
            return;
        }

        this.createEditScoresModal();
    }

    /**
     * Create and display the edit scores modal
     */
    createEditScoresModal() {
        // Remove existing modal if it exists
        const existingModal = DOM.getById('edit-scores-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'edit-scores-modal';
        modal.classList.add('edit-scores-modal');

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.classList.add('edit-scores-modal-content');

        // Build the form HTML
        const formHTML = this.buildEditScoresFormHTML();
        modalContent.innerHTML = formHTML;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Initialize event handlers
        this.initializeEditScoresHandlers(modal);

        // Initialize with the first round
        if (this.currentGame.hands.length > 0) {
            this.renderRoundFields(0);
        }
    }

    /**
     * Build the HTML for the edit scores form
     * @returns {string} HTML string
     */
    buildEditScoresFormHTML() {
        const handsOptions = this.currentGame.hands
            .map((hand, idx) => `<option value="${idx}">Round #${hand.handNumber}</option>`)
            .join('');

        return `
            <h2>Edit Prior Round Scores</h2>
            <form id="edit-scores-form">
                <label for="edit-round-select">Select Round:</label>
                <select id="edit-round-select">${handsOptions}</select>
                <div id="edit-round-fields"></div>
                <button type="submit" class="primary-button" style="margin-top:16px;">Save Changes</button>
                <button type="button" id="cancel-edit-scores" class="secondary-button" style="margin-left:8px;">Cancel</button>
            </form>
        `;
    }

    /**
     * Initialize event handlers for the edit scores modal
     * @param {HTMLElement} modal - Modal element
     */
    initializeEditScoresHandlers(modal) {
        // Round selection handler
        const roundSelect = DOM.getById('edit-round-select');
        if (roundSelect) {
            DOM.on(roundSelect, 'change', (e) => {
                this.renderRoundFields(parseInt(e.target.value));
            });
        }

        // Cancel button handler
        const cancelBtn = DOM.getById('cancel-edit-scores');
        if (cancelBtn) {
            DOM.on(cancelBtn, 'click', () => {
                modal.remove();
            });
        }

        // Form submission handler
        const form = DOM.getById('edit-scores-form');
        if (form) {
            DOM.on(form, 'submit', (e) => {
                e.preventDefault();
                this.saveEditedScores(modal);
            });
        }

        // Modal background click to close
        DOM.on(modal, 'click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Render the input fields for a specific round
     * @param {number} roundIdx - Index of the round to edit
     */
    renderRoundFields(roundIdx) {
        const hand = this.currentGame.hands[roundIdx];
        const fieldsContainer = DOM.getById('edit-round-fields');
        
        if (!fieldsContainer || !hand) return;

        let fieldsHTML = `<h4>Hand ${hand.handNumber}</h4>`;
        
        // Check if this is a thrown-in hand (not editable)
        if (hand.thrownIn) {
            fieldsHTML += `
                <div style="padding: 16px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #e74c3c; font-weight: bold; text-align: center;">
                        <em>This hand was thrown in (no bids) - Cannot be edited</em>
                    </p>
                </div>
            `;
        } else {
            fieldsHTML += `
                <div style="margin-bottom: 16px;">
                    <label>Winning Bid: 
                        <input type="number" name="winning-bid-${roundIdx}" value="${hand.winningBid || 0}" 
                               style="width:80px;" step="10" min="0">
                    </label>
                </div>
            `;

            // Add fields for each player
            this.currentGame.players.forEach(player => {
                const meld = hand.playerMeld[player.id] || 0;
                const tricks = Math.round((hand.playerScores[player.id] || 0) / 10);
                
                fieldsHTML += `
                    <div style="margin-bottom: 12px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <strong>${player.name}</strong><br>
                        <label>Meld: 
                            <input type="number" name="meld-${roundIdx}-${player.id}" value="${meld}" 
                                   style="width:80px;" step="10" min="0">
                        </label>
                        <label style="margin-left: 16px;">Tricks: 
                            <input type="number" name="tricks-${roundIdx}-${player.id}" value="${tricks}" 
                                   min="0" max="25" style="width:60px;" step="1">
                        </label>
                    </div>
                `;
            });
        }

        DOM.setHTML(fieldsContainer, fieldsHTML);
    }

    /**
     * Save the edited scores and recalculate
     * @param {HTMLElement} modal - Modal element to close
     */
    saveEditedScores(modal) {
        try {
            const roundSelect = DOM.getById('edit-round-select');
            const roundIdx = parseInt(roundSelect.value);
            const hand = this.currentGame.hands[roundIdx];

            // Prevent editing thrown-in hands
            if (hand.thrownIn) {
                notificationService.warning('Cannot edit thrown-in hands');
                return;
            }

            // Update winning bid
            const bidInput = DOM.query(`[name='winning-bid-${roundIdx}']`);
            if (bidInput) {
                hand.winningBid = parseInt(bidInput.value) || 0;
            }

            // Update player meld and scores
            this.currentGame.players.forEach(player => {
                const meldInput = DOM.query(`[name='meld-${roundIdx}-${player.id}']`);
                const tricksInput = DOM.query(`[name='tricks-${roundIdx}-${player.id}']`);
                
                if (meldInput) {
                    hand.playerMeld[player.id] = parseInt(meldInput.value) || 0;
                }
                if (tricksInput) {
                    hand.playerScores[player.id] = (parseInt(tricksInput.value) || 0) * 10;
                }
            });

            // Recalculate all scores using the existing method
            this.currentGame.recalculateScores();

            // Save to storage
            storageService.saveCurrentGame(this.currentGame);

            // Update the UI
            this.updateScoreboard();

            // Close modal and show success message
            modal.remove();
            notificationService.success('Scores updated successfully');

        } catch (error) {
            console.error('Failed to save edited scores:', error);
            notificationService.error('Failed to save changes');
        }
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