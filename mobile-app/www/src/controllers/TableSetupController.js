import { DOM } from '../utils/helpers.js';
import notificationService from '../services/NotificationService.js';
import eventService, { EVENTS } from '../services/EventService.js';

/**
 * Controller for managing table setup and player seating arrangements
 */
class TableSetupController {
    constructor() {
        this.selectedPlayers = [];
        this.gameType = 2;
        this.tableArrangement = {};
        this.dealerPosition = 0;
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
            tableSetup: DOM.getById('table-setup'),
            tableInstructions: DOM.getById('table-instructions'),
            tableContainer: DOM.getById('table-container'),
            setupTableBtn: DOM.getById('setup-table'),
            backToSelectionBtn: DOM.getById('back-to-selection'),
            startGameBtn: DOM.getById('start-game')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (this.elements.setupTableBtn) {
            DOM.on(this.elements.setupTableBtn, 'click', () => this.showTableSetup());
        }

        if (this.elements.backToSelectionBtn) {
            DOM.on(this.elements.backToSelectionBtn, 'click', () => this.backToPlayerSelection());
        }

        // Listen for game type changes
        eventService.on('game-type-changed', (gameType) => {
            this.gameType = gameType;
        });

        // Listen for player selection changes
        eventService.on('players-selected', (players) => {
            this.selectedPlayers = players;
        });
    }

    /**
     * Show the table setup interface
     */
    showTableSetup() {
        if (this.selectedPlayers.length !== this.gameType) {
            notificationService.error(`Please select exactly ${this.gameType} players first`);
            return;
        }

        // Hide player selection and show table setup
        const playerSelection = DOM.getById('player-selection');
        if (playerSelection) DOM.hide(playerSelection.parentElement);
        
        if (this.elements.tableSetup) {
            DOM.show(this.elements.tableSetup);
            this.renderTableSetup();
        }
    }

    /**
     * Go back to player selection
     */
    backToPlayerSelection() {
        if (this.elements.tableSetup) DOM.hide(this.elements.tableSetup);
        
        const playerSelection = DOM.getById('player-selection');
        if (playerSelection) DOM.show(playerSelection.parentElement);
    }

    /**
     * Render the table setup interface
     */
    renderTableSetup() {
        this.renderInstructions();
        this.renderTable();
    }

    /**
     * Render setup instructions based on game type
     */
    renderInstructions() {
        if (!this.elements.tableInstructions) return;

        let instructions = '';
        
        switch (this.gameType) {
            case 2:
                instructions = `
                    <p><strong>2-Player Setup:</strong> Players sit across from each other. Click on a seat to assign a player.</p>
                    <p>The dealer alternates between players after each hand.</p>
                `;
                break;
            case 3:
                instructions = `
                    <p><strong>3-Player Setup:</strong> Players sit in a triangular arrangement. Click on a seat to assign a player.</p>
                    <p>The dealer advances clockwise (to the left) after each hand.</p>
                `;
                break;
            case 4:
                instructions = `
                    <p><strong>4-Player Team Setup:</strong> Players on the same team sit opposite each other.</p>
                    <p><strong>Team A</strong> (Green) and <strong>Team B</strong> (Orange) - teammates sit across from each other.</p>
                    <p>The dealer advances clockwise (to the left) after each hand.</p>
                `;
                break;
        }

        DOM.setHTML(this.elements.tableInstructions, instructions);
    }

    /**
     * Render the table visualization
     */
    renderTable() {
        if (!this.elements.tableContainer) return;

        const positions = this.getTablePositions();
        const tableShape = this.gameType === 2 ? 'rectangular' : 'circular';

        let html = `
            <div class="table-visual">
                <div class="table-surface ${tableShape}">
                    <div class="dealer-indicator">First Dealer</div>
                    ${positions.map((pos, index) => `
                        <div class="seat ${pos.class} ${this.getTeamClass(index)}" 
                             data-position="${index}"
                             onclick="window.tableSetupController.selectSeat(${index})">
                            <div class="seat-label">${pos.label}</div>
                            <div class="seat-player" id="seat-player-${index}">Click to assign</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${this.gameType === 4 ? this.renderTeamLegend() : ''}
            
            <div class="available-players">
                <h4>Available Players:</h4>
                ${this.selectedPlayers.map((player, index) => `
                    <div class="available-player" data-player-id="${player.id}" data-player-index="${index}">
                        ${player.name}
                    </div>
                `).join('')}
            </div>
        `;

        DOM.setHTML(this.elements.tableContainer, html);
        this.attachTableEventListeners();
    }

    /**
     * Get table positions based on game type
     */
    getTablePositions() {
        switch (this.gameType) {
            case 2:
                return [
                    { label: 'North', class: 'position-north' },
                    { label: 'South', class: 'position-south' }
                ];
            case 3:
                return [
                    { label: 'North', class: 'position-north' },
                    { label: 'Southeast', class: 'position-southeast' },
                    { label: 'Southwest', class: 'position-southwest' }
                ];
            case 4:
                return [
                    { label: 'North', class: 'position-north' },
                    { label: 'East', class: 'position-east' },
                    { label: 'South', class: 'position-south' },
                    { label: 'West', class: 'position-west' }
                ];
            default:
                return [];
        }
    }

    /**
     * Get team class for 4-player games
     */
    getTeamClass(position) {
        if (this.gameType !== 4) return '';
        
        // Team A: positions 0 and 2 (North and South)
        // Team B: positions 1 and 3 (East and West)
        return position % 2 === 0 ? 'team-a' : 'team-b';
    }

    /**
     * Render team legend for 4-player games
     */
    renderTeamLegend() {
        return `
            <div class="team-legend">
                <div class="team-indicator">
                    <div class="team-color team-a"></div>
                    <span>Team A (North ↔ South)</span>
                </div>
                <div class="team-indicator">
                    <div class="team-color team-b"></div>
                    <span>Team B (East ↔ West)</span>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to table elements
     */
    attachTableEventListeners() {
        // Add drag and drop functionality for available players
        const availablePlayers = DOM.queryAll('.available-player');
        availablePlayers.forEach(player => {
            player.draggable = true;
            
            DOM.on(player, 'dragstart', (e) => {
                e.dataTransfer.setData('text/plain', player.dataset.playerId);
                player.classList.add('dragging');
            });
            
            DOM.on(player, 'dragend', () => {
                player.classList.remove('dragging');
            });
        });

        // Add drop functionality to seats
        const seats = DOM.queryAll('.seat');
        seats.forEach(seat => {
            DOM.on(seat, 'dragover', (e) => {
                e.preventDefault();
                seat.classList.add('drag-over');
            });
            
            DOM.on(seat, 'dragleave', () => {
                seat.classList.remove('drag-over');
            });
            
            DOM.on(seat, 'drop', (e) => {
                e.preventDefault();
                seat.classList.remove('drag-over');
                
                const playerId = e.dataTransfer.getData('text/plain');
                const position = parseInt(seat.dataset.position);
                this.assignPlayerToSeat(playerId, position);
            });
        });
    }

    /**
     * Select a seat (for click-to-assign functionality)
     */
    selectSeat(position) {
        // Find first unassigned player
        const unassignedPlayer = this.selectedPlayers.find(player => 
            !Object.values(this.tableArrangement).includes(player.id)
        );

        if (unassignedPlayer) {
            this.assignPlayerToSeat(unassignedPlayer.id, position);
        } else {
            // Allow reassignment
            const currentPlayerId = this.tableArrangement[position];
            if (currentPlayerId) {
                this.removePlayerFromSeat(position);
            }
        }
    }

    /**
     * Assign a player to a specific seat
     */
    assignPlayerToSeat(playerId, position) {
        // Remove player from any existing position
        Object.keys(this.tableArrangement).forEach(pos => {
            if (this.tableArrangement[pos] === playerId) {
                delete this.tableArrangement[pos];
            }
        });

        // Assign to new position
        this.tableArrangement[position] = playerId;
        
        // Update UI
        this.updateSeatDisplay(position);
        this.updateAvailablePlayers();
        
        // Check if all seats are filled
        if (Object.keys(this.tableArrangement).length === this.gameType) {
            this.enableStartGame();
        }
    }

    /**
     * Remove player from a seat
     */
    removePlayerFromSeat(position) {
        delete this.tableArrangement[position];
        this.updateSeatDisplay(position);
        this.updateAvailablePlayers();
    }

    /**
     * Update seat display
     */
    updateSeatDisplay(position) {
        const seatPlayer = DOM.getById(`seat-player-${position}`);
        const seat = DOM.query(`[data-position="${position}"]`);
        
        if (!seatPlayer || !seat) return;

        const playerId = this.tableArrangement[position];
        
        if (playerId) {
            const player = this.selectedPlayers.find(p => p.id === playerId);
            if (player) {
                DOM.setText(seatPlayer, player.name);
                seat.classList.add('occupied');
                
                // Mark as dealer if this is position 0
                if (position === this.dealerPosition) {
                    seat.classList.add('dealer');
                } else {
                    seat.classList.remove('dealer');
                }
            }
        } else {
            DOM.setText(seatPlayer, 'Click to assign');
            seat.classList.remove('occupied', 'dealer');
        }
    }

    /**
     * Update available players display
     */
    updateAvailablePlayers() {
        const assignedPlayerIds = Object.values(this.tableArrangement);
        const availablePlayers = DOM.queryAll('.available-player');
        
        availablePlayers.forEach(player => {
            const playerId = player.dataset.playerId;
            if (assignedPlayerIds.includes(playerId)) {
                player.style.display = 'none';
            } else {
                player.style.display = 'inline-block';
            }
        });
    }

    /**
     * Enable start game button when all seats are filled
     */
    enableStartGame() {
        if (this.elements.startGameBtn) {
            this.elements.startGameBtn.disabled = false;
            DOM.setText(this.elements.startGameBtn, 'Start Game');
        }
        
        notificationService.success('Table setup complete! Ready to start the game.');
    }

    /**
     * Get the arranged players in table order
     */
    getArrangedPlayers() {
        const arrangedPlayers = [];
        
        for (let position = 0; position < this.gameType; position++) {
            const playerId = this.tableArrangement[position];
            if (playerId) {
                const player = this.selectedPlayers.find(p => p.id === playerId);
                if (player) {
                    arrangedPlayers.push(player);
                }
            }
        }
        
        return arrangedPlayers;
    }

    /**
     * Get team assignments for 4-player games
     */
    getTeamAssignments() {
        if (this.gameType !== 4) return null;

        const teamA = [];
        const teamB = [];

        // Team A: positions 0 and 2 (North and South)
        // Team B: positions 1 and 3 (East and West)
        for (let position = 0; position < 4; position++) {
            const playerId = this.tableArrangement[position];
            const player = this.selectedPlayers.find(p => p.id === playerId);
            
            if (player) {
                if (position % 2 === 0) {
                    teamA.push(player);
                } else {
                    teamB.push(player);
                }
            }
        }

        return { teamA, teamB };
    }

    /**
     * Validate table setup
     */
    isTableSetupComplete() {
        return Object.keys(this.tableArrangement).length === this.gameType;
    }

    /**
     * Reset table setup
     */
    reset() {
        this.tableArrangement = {};
        this.dealerPosition = 0;
        this.selectedPlayers = [];
        this.gameType = 2;
    }

    /**
     * Set selected players
     */
    setSelectedPlayers(players) {
        this.selectedPlayers = players;
    }

    /**
     * Set game type
     */
    setGameType(gameType) {
        this.gameType = gameType;
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Remove event listeners
        eventService.off('game-type-changed');
        eventService.off('players-selected');
    }
}

export default TableSetupController;