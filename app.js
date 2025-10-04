/**
 * Legacy compatibility wrapper for the original PinochleScoreKeeper class
 * This file maintains backwards compatibility while the application 
 * transitions to the new modular architecture.
 * 
 * DEPRECATED: This file is kept for compatibility purposes only.
 * New development should use the modular architecture in /src/
 */

console.warn('Using legacy PinochleScoreKeeper class. Consider upgrading to the modular architecture.');

// Fallback implementation for browsers that don't support ES6 modules
if (!window.app) {
    // Simple polyfill for basic functionality
    class LegacyPinochleScoreKeeper {
        constructor() {
            this.players = JSON.parse(localStorage.getItem('pinochle-players')) || [];
            this.currentGame = JSON.parse(localStorage.getItem('pinochle-current-game')) || null;
            this.gameHistory = JSON.parse(localStorage.getItem('pinochle-game-history')) || [];
            
            this.initializeEventListeners();
            this.updatePlayersDisplay();
            
            // Show compatibility warning
            this.showToast('Running in compatibility mode. Some features may be limited.', 'warning');
        }

        showToast(message, type = 'info') {
            console.log(`Toast (${type}): ${message}`);
            // Simple alert fallback
            if (type === 'error') {
                alert(`Error: ${message}`);
            }
        }

        addPlayer() {
            const nameInput = document.getElementById('player-name');
            const name = nameInput?.value?.trim();
            
            if (!name) {
                this.showToast('Please enter a player name', 'error');
                return;
            }
            
            if (this.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
                this.showToast('Player already exists', 'error');
                return;
            }
            
            const player = {
                id: Date.now().toString(),
                name: name,
                gamesPlayed: 0,
                gamesWon: 0,
                totalScore: 0,
                highestHand: 0,
                highestBid: 0,
                totalMeld: 0
            };
            
            this.players.push(player);
            this.savePlayersToStorage();
            this.updatePlayersDisplay();
            nameInput.value = '';
            this.showToast(`Player ${name} added successfully`);
        }

        removePlayer(playerId) {
            if (confirm('Are you sure you want to remove this player?')) {
                this.players = this.players.filter(p => p.id !== playerId);
                this.savePlayersToStorage();
                this.updatePlayersDisplay();
                this.showToast('Player removed');
            }
        }

        savePlayersToStorage() {
            localStorage.setItem('pinochle-players', JSON.stringify(this.players));
        }

        updatePlayersDisplay() {
            const playersList = document.getElementById('players-list');
            if (!playersList) return;
            
            if (this.players.length === 0) {
                playersList.innerHTML = '<p>No players added yet. Add some players to get started!</p>';
                return;
            }
            
            playersList.innerHTML = this.players.map(player => `
                <div class="player-item">
                    <div>
                        <div class="player-name">${player.name}</div>
                        <div class="player-stats">
                            Games: ${player.gamesPlayed} | Wins: ${player.gamesWon} | Win Rate: ${player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0}%
                        </div>
                    </div>
                    <button class="danger-button" onclick="app.removePlayer('${player.id}')">Remove</button>
                </div>
            `).join('');
        }

        showTab(tabName) {
            // Basic tab switching
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            
            const section = document.getElementById(`${tabName}-section`);
            const button = document.getElementById(`${tabName}-tab`);
            
            if (section) section.classList.add('active');
            if (button) button.classList.add('active');
            
            if (tabName === 'stats') {
                this.updateStatsDisplay();
            }
        }

        updateStatsDisplay() {
            const statsDisplay = document.getElementById('stats-display');
            if (!statsDisplay) return;
            
            if (this.players.length === 0) {
                statsDisplay.innerHTML = '<p>No player statistics available. Add some players and play some games!</p>';
                return;
            }
            
            statsDisplay.innerHTML = this.players.map(player => {
                const winRate = player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0;
                const avgScore = player.gamesPlayed > 0 ? Math.round(player.totalScore / player.gamesPlayed) : 0;
                const avgMeld = player.gamesPlayed > 0 ? Math.round(player.totalMeld / player.gamesPlayed) : 0;
                
                return `
                    <div class="player-stats-card">
                        <h3>${player.name}</h3>
                        <div class="stat-row">
                            <span class="stat-label">Games Played:</span>
                            <span class="stat-value">${player.gamesPlayed}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Games Won:</span>
                            <span class="stat-value">${player.gamesWon}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Win Rate:</span>
                            <span class="stat-value">${winRate}%</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Average Score:</span>
                            <span class="stat-value">${avgScore}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Average Meld:</span>
                            <span class="stat-value">${avgMeld}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Highest Hand:</span>
                            <span class="stat-value">${player.highestHand}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Highest Bid:</span>
                            <span class="stat-value">${player.highestBid}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        initializeEventListeners() {
            const elements = [
                { id: 'players-tab', event: 'click', handler: () => this.showTab('players') },
                { id: 'game-tab', event: 'click', handler: () => this.showTab('game') },
                { id: 'stats-tab', event: 'click', handler: () => this.showTab('stats') },
                { id: 'add-player', event: 'click', handler: () => this.addPlayer() },
                { id: 'player-name', event: 'keypress', handler: (e) => { if (e.key === 'Enter') this.addPlayer(); } }
            ];

            elements.forEach(({ id, event, handler }) => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener(event, handler);
                }
            });
        }

        // Stub methods for game functionality
        updatePlayerSelection() {
            const gameType = parseInt(document.getElementById('game-type')?.value || '2');
            const playerSelection = document.getElementById('player-selection');
            
            if (!playerSelection) return;
            
            if (this.players.length < gameType) {
                playerSelection.innerHTML = `<p>You need at least ${gameType} players to start a ${gameType}-player game. Add more players first.</p>`;
                return;
            }
            
            playerSelection.innerHTML = `
                <h4>Select ${gameType} Players:</h4>
                <p><em>Game functionality is limited in compatibility mode. Please upgrade your browser for full functionality.</em></p>
                ${this.players.map(player => `
                    <div class="player-item">
                        <div class="player-name">${player.name}</div>
                    </div>
                `).join('')}
            `;
        }

        startGame() {
            this.showToast('Game functionality requires a modern browser with ES6 module support.', 'error');
        }

        // Other stub methods that might be called
        nextToMeldPhase() { this.showToast('Feature not available in compatibility mode', 'error'); }
        nextToScorePhase() { this.showToast('Feature not available in compatibility mode', 'error'); }
        submitHand() { this.showToast('Feature not available in compatibility mode', 'error'); }
        throwInHand() { this.showToast('Feature not available in compatibility mode', 'error'); }
        shotTheMoon() { this.showToast('Feature not available in compatibility mode', 'error'); }
        endGame() { this.showToast('Feature not available in compatibility mode', 'error'); }
        showEditScores() { this.showToast('Feature not available in compatibility mode', 'error'); }
        updateGameInterface() { }
        updateScoreboard() { }
        checkGameEnd() { }
    }

    // Initialize legacy app if no modern app is available
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.app) {
            window.app = new LegacyPinochleScoreKeeper();
        }
    });
}