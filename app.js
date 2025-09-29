// Pinochle Score Keeper Application
class PinochleScoreKeeper {
    constructor() {
        this.players = JSON.parse(localStorage.getItem('pinochle-players')) || [];
        this.currentGame = null;
        this.gameHistory = JSON.parse(localStorage.getItem('pinochle-game-history')) || [];
        
        this.initializeEventListeners();
        this.updatePlayersDisplay();
        this.updateStatsDisplay();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Tab navigation
        document.getElementById('players-tab').addEventListener('click', () => this.showTab('players'));
        document.getElementById('game-tab').addEventListener('click', () => this.showTab('game'));
        document.getElementById('stats-tab').addEventListener('click', () => this.showTab('stats'));

        // Player management
        document.getElementById('add-player').addEventListener('click', () => this.addPlayer());
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayer();
        });

        // Game setup
        document.getElementById('game-type').addEventListener('change', () => this.updatePlayerSelection());
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        
        // Game play
        document.getElementById('submit-hand').addEventListener('click', () => this.submitHand());
        document.getElementById('end-game').addEventListener('click', () => this.endGame());
    }

    // Show specific tab
    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        
        // Show selected tab
        document.getElementById(`${tabName}-section`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Update content if needed
        if (tabName === 'game') {
            this.updatePlayerSelection();
        } else if (tabName === 'stats') {
            this.updateStatsDisplay();
        }
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Player Management
    addPlayer() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();
        
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

    // Game Setup
    updatePlayerSelection() {
        const gameType = parseInt(document.getElementById('game-type').value);
        const playerSelection = document.getElementById('player-selection');
        
        if (this.players.length < gameType) {
            playerSelection.innerHTML = `<p>You need at least ${gameType} players to start a ${gameType}-player game. Add more players first.</p>`;
            return;
        }
        
        playerSelection.innerHTML = `
            <h4>Select ${gameType} Players:</h4>
            ${this.players.map((player, index) => `
                <div class="player-item" data-player-id="${player.id}">
                    <div class="player-name">${player.name}</div>
                </div>
            `).join('')}
            <p><em>Click players to select them. You need exactly ${gameType} players.</em></p>
        `;
        
        // Add click event listeners to player items
        playerSelection.querySelectorAll('.player-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
            });
        });
    }

    startGame() {
        const gameType = parseInt(document.getElementById('game-type').value);
        const selectedPlayers = Array.from(document.querySelectorAll('.player-item.selected'))
            .map(el => el.dataset.playerId);
        
        if (selectedPlayers.length !== gameType) {
            this.showToast(`Please select exactly ${gameType} players`, 'error');
            return;
        }
        
        const players = selectedPlayers.map(id => this.players.find(p => p.id === id));
        
        this.currentGame = {
            id: Date.now().toString(),
            gameType: gameType,
            players: players,
            hands: [],
            scores: players.map(p => ({ playerId: p.id, name: p.name, score: 0 })),
            startTime: new Date().toISOString(),
            targetScore: gameType === 2 ? 1000 : 1500
        };
        
        document.getElementById('target-score').textContent = this.currentGame.targetScore;
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        
        this.updateGameInterface();
        this.showToast('Game started!');
    }

    updateGameInterface() {
        if (!this.currentGame) return;
        
        const currentHand = document.getElementById('current-hand');
        const bidderSelect = document.getElementById('bidder');
        const meldInputs = document.getElementById('meld-inputs');
        const scoreInputs = document.getElementById('score-inputs');
        
        currentHand.textContent = this.currentGame.hands.length + 1;
        
        // Update bidder options
        bidderSelect.innerHTML = this.currentGame.players.map(p => 
            `<option value="${p.id}">${p.name}</option>`
        ).join('');
        
        // Create meld inputs
        meldInputs.innerHTML = this.currentGame.players.map(p => `
            <div class="player-input">
                <label>${p.name} Meld:</label>
                <input type="number" id="meld-${p.id}" min="0" value="0">
            </div>
        `).join('');
        
        // Create score inputs
        scoreInputs.innerHTML = this.currentGame.players.map(p => `
            <div class="player-input">
                <label>${p.name} Points:</label>
                <input type="number" id="score-${p.id}" min="0" value="0">
            </div>
        `).join('');
        
        this.updateScoreboard();
    }

    submitHand() {
        if (!this.currentGame) return;
        
        const winningBid = parseInt(document.getElementById('winning-bid').value);
        const bidderId = document.getElementById('bidder').value;
        
        if (!winningBid || winningBid < 20) {
            this.showToast('Please enter a valid winning bid (minimum 20)', 'error');
            return;
        }
        
        const handData = {
            handNumber: this.currentGame.hands.length + 1,
            winningBid: winningBid,
            bidderId: bidderId,
            bidderName: this.currentGame.players.find(p => p.id === bidderId).name,
            playerMeld: {},
            playerScores: {},
            timestamp: new Date().toISOString()
        };
        
        // Collect meld and scores
        let totalHandScore = 0;
        for (const player of this.currentGame.players) {
            const meld = parseInt(document.getElementById(`meld-${player.id}`).value) || 0;
            const score = parseInt(document.getElementById(`score-${player.id}`).value) || 0;
            
            handData.playerMeld[player.id] = meld;
            handData.playerScores[player.id] = score;
            totalHandScore += score;
        }
        
        // Validate total hand score (should be around 25-30 for most hands, but allow flexibility)
        if (totalHandScore < 10 || totalHandScore > 50) {
            if (!confirm(`Total hand score is ${totalHandScore}, which seems unusual. Continue anyway?`)) {
                return;
            }
        }
        
        // Update game scores
        for (const player of this.currentGame.players) {
            const playerScore = this.currentGame.scores.find(s => s.playerId === player.id);
            const meld = handData.playerMeld[player.id];
            const points = handData.playerScores[player.id];
            
            // Add meld and points to total
            playerScore.score += meld + points;
            
            // Update player statistics
            const playerData = this.players.find(p => p.id === player.id);
            playerData.totalMeld += meld;
            
            // Track highest hand score
            const handTotal = meld + points;
            if (handTotal > playerData.highestHand) {
                playerData.highestHand = handTotal;
            }
            
            // Track highest bid if this player was the bidder
            if (player.id === bidderId && winningBid > playerData.highestBid) {
                playerData.highestBid = winningBid;
            }
        }
        
        this.currentGame.hands.push(handData);
        
        // Clear inputs
        document.getElementById('winning-bid').value = '';
        document.querySelectorAll('[id^="meld-"]').forEach(input => input.value = '0');
        document.querySelectorAll('[id^="score-"]').forEach(input => input.value = '0');
        
        this.updateGameInterface();
        this.checkGameEnd();
        
        this.showToast(`Hand ${handData.handNumber} recorded`);
    }

    checkGameEnd() {
        if (!this.currentGame) return;
        
        const winningScore = this.currentGame.scores.find(s => s.score >= this.currentGame.targetScore);
        if (winningScore) {
            const winner = this.players.find(p => p.id === winningScore.playerId);
            this.showToast(`🎉 ${winner.name} wins with ${winningScore.score} points!`, 'success');
        }
    }

    updateScoreboard() {
        if (!this.currentGame) return;
        
        const scoreboard = document.getElementById('scoreboard');
        const hands = this.currentGame.hands;
        
        let tableHtml = '<table><thead><tr><th>Hand</th>';
        
        // Add player headers
        for (const player of this.currentGame.players) {
            tableHtml += `<th>${player.name}</th>`;
        }
        tableHtml += '<th>Bid</th></tr></thead><tbody>';
        
        // Add hand rows
        for (let i = 0; i < hands.length; i++) {
            const hand = hands[i];
            tableHtml += `<tr><td>${hand.handNumber}</td>`;
            
            for (const player of this.currentGame.players) {
                const meld = hand.playerMeld[player.id] || 0;
                const score = hand.playerScores[player.id] || 0;
                const total = meld + score;
                tableHtml += `<td>${total} (${meld}+${score})</td>`;
            }
            
            tableHtml += `<td>${hand.winningBid} (${hand.bidderName})</td></tr>`;
        }
        
        // Add total row
        tableHtml += '<tr class="totals"><td><strong>Total</strong></td>';
        for (const player of this.currentGame.players) {
            const total = this.currentGame.scores.find(s => s.playerId === player.id).score;
            tableHtml += `<td><strong>${total}</strong></td>`;
        }
        tableHtml += '<td></td></tr>';
        
        tableHtml += '</tbody></table>';
        scoreboard.innerHTML = tableHtml;
    }

    endGame() {
        if (!this.currentGame) return;
        
        if (!confirm('Are you sure you want to end this game?')) return;
        
        // Determine winner
        const winner = this.currentGame.scores.reduce((prev, current) => 
            (prev.score > current.score) ? prev : current
        );
        
        // Update player statistics
        for (const player of this.currentGame.players) {
            const playerData = this.players.find(p => p.id === player.id);
            playerData.gamesPlayed++;
            
            if (player.id === winner.playerId) {
                playerData.gamesWon++;
            }
            
            const finalScore = this.currentGame.scores.find(s => s.playerId === player.id).score;
            playerData.totalScore += finalScore;
        }
        
        // Save game to history
        this.currentGame.endTime = new Date().toISOString();
        this.currentGame.winnerId = winner.playerId;
        this.currentGame.winnerName = winner.name;
        this.gameHistory.push(this.currentGame);
        
        localStorage.setItem('pinochle-game-history', JSON.stringify(this.gameHistory));
        this.savePlayersToStorage();
        
        // Reset UI
        this.currentGame = null;
        document.getElementById('game-setup').classList.remove('hidden');
        document.getElementById('game-play').classList.add('hidden');
        
        this.showToast(`Game ended! ${winner.name} wins with ${winner.score} points!`);
        this.updatePlayersDisplay();
    }

    // Statistics
    updateStatsDisplay() {
        const statsDisplay = document.getElementById('stats-display');
        
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
}

// Initialize the application
const app = new PinochleScoreKeeper();