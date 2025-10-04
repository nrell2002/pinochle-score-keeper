// Pinochle Score Keeper Application
class PinochleScoreKeeper {
    // Handle 'Throw Hand' in moon scenario
    throwHandMoon() {
        this.showToast('Hand thrown due to excessive tricks required.');
        // Optionally, you can record a hand with zero points for all players or custom logic here
        this._pendingHand = null;
        this.updateGameInterface();
    }

    // Handle 'Shot the Moon' scenario
    shotTheMoon() {
        if (!this.currentGame || !this._pendingHand) return;
        const { winningBid, bidderId, bidderName } = this._pendingHand;
        const handData = {
            handNumber: this.currentGame.hands.length + 1,
            winningBid,
            bidderId,
            bidderName,
            playerMeld: {},
            playerScores: {},
            timestamp: new Date().toISOString(),
            dealerId: this.currentGame.players[this.currentGame.dealerIndex].id,
            dealerName: this.currentGame.players[this.currentGame.dealerIndex].name
        };
        // Winning bidder gets prior score + 500, meld and hand score not included
        let priorScore = 0;
        const bidderScoreObj = this.currentGame.scores.find(s => s.playerId === bidderId);
        if (bidderScoreObj) priorScore = bidderScoreObj.score;
        handData.playerMeld[bidderId] = 0;
        handData.playerScores[bidderId] = 500;
        bidderScoreObj.score = priorScore + 500;
        // Other players' scores remain unchanged from prior round
        for (const player of this.currentGame.players) {
            if (player.id !== bidderId) {
                const meldInputOther = document.getElementById(`meld-${player.id}`);
                let meldOther = meldInputOther ? parseInt(meldInputOther.value) || 0 : 0;
                handData.playerMeld[player.id] = meldOther;
                handData.playerScores[player.id] = 0;
                // Do not change their score
            }
        }
        // Advance dealer for next hand
        this.currentGame.hands.push(handData);
        this.currentGame.dealerIndex = (this.currentGame.dealerIndex + 1) % this.currentGame.players.length;
        localStorage.setItem('pinochle-current-game', JSON.stringify(this.currentGame));
        this._pendingHand = null;
        this.updateGameInterface();
        this.showToast('Shot the Moon! Scores updated.');
    }
    // Toast notification logic
    updateScoreboard() {
        if (!this.currentGame) return;
        const scoreboard = document.getElementById('scoreboard');
        const players = this.currentGame.players;
        const scores = this.currentGame.scores;
        const hands = this.currentGame.hands;
        let html = '<table><thead><tr><th>Round / Winning Bid</th>';
        for (const player of players) {
            html += `<th>${player.name}</th>`;
        }
        html += '</tr></thead><tbody>';
        hands.forEach((hand, idx) => {
            let roundInfo = `#${hand.handNumber}`;
            if (hand.winningBid !== null && hand.winningBid !== undefined) {
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
                    const meld = hand.playerMeld ? hand.playerMeld[player.id] || 0 : 0;
                    const score = hand.playerScores ? hand.playerScores[player.id] || 0 : 0;
                    html += `<td>Meld: ${meld}<br>Score: ${score}</td>`;
                }
            }
            html += '</tr>';
        });
        // Add current totals row
        html += '<tr><td><b>Total</b></td>';
        for (const player of players) {
            const total = scores.find(s => s.playerId === player.id).score;
            html += `<td><b>${total}</b></td>`;
        }
        html += '</tr></tbody></table>';
        scoreboard.innerHTML = html;
    }

    // Tab switching logic
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
    constructor() {
        this.players = JSON.parse(localStorage.getItem('pinochle-players')) || [];
        this.currentGame = JSON.parse(localStorage.getItem('pinochle-current-game')) || null;
        this.gameHistory = JSON.parse(localStorage.getItem('pinochle-game-history')) || [];
        this.dealerIndex = 0; // Tracks the dealer's index in the players array

        this.initializeEventListeners();
        this.updatePlayersDisplay();
    }

    // Toast notification logic
    showToast(message, type = 'info') {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '30px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%)';
            toast.style.zIndex = '9999';
            toast.style.padding = '12px 24px';
            toast.style.borderRadius = '6px';
            toast.style.fontSize = '1.1em';
            toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.background = type === 'error' ? '#e74c3c' : (type === 'success' ? '#27ae60' : '#333');
        toast.style.color = '#fff';
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2200);
    }

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
        
        this.dealerIndex = 0; // Start with first player as dealer
        this.currentGame = {
            id: Date.now().toString(),
            gameType: gameType,
            players: players,
            hands: [],
            scores: players.map(p => ({ playerId: p.id, name: p.name, score: 0 })),
            startTime: new Date().toISOString(),
            targetScore: gameType === 2 ? 1000 : 1500,
            dealerIndex: this.dealerIndex
        };
        localStorage.setItem('pinochle-current-game', JSON.stringify(this.currentGame));
        document.getElementById('target-score').textContent = this.currentGame.targetScore;
        document.getElementById('game-setup').classList.add('hidden');
        document.getElementById('game-play').classList.remove('hidden');
        this.updateGameInterface();
        this.showToast('Game started!');
    }

    updateGameInterface() {
        if (!this.currentGame) return;
        const currentHand = document.getElementById('current-hand');
        const dealerDisplay = document.getElementById('dealer-display');
        const currentDealerHand = document.getElementById('current-dealer-hand');
        const handStartSection = document.getElementById('hand-start-section');
        const meldSectionCard = document.getElementById('meld-section-card');
        const scoreSectionCard = document.getElementById('score-section-card');
        const bidderSelect = document.getElementById('bidder');
        const meldInputs = document.getElementById('meld-inputs');
        const scoreInputs = document.getElementById('score-inputs');

        currentHand.textContent = this.currentGame.hands.length + 1;

        // Show current dealer in both locations
        const dealer = this.currentGame.players[this.currentGame.dealerIndex];
        if (dealerDisplay) {
            dealerDisplay.textContent = `Dealer: ${dealer.name}`;
        }
        if (currentDealerHand) {
            currentDealerHand.textContent = `Dealer: ${dealer.name}`;
        }

        // Show hand start section, hide meld/score sections
        if (handStartSection) handStartSection.classList.remove('hidden');
        if (meldSectionCard) meldSectionCard.classList.add('hidden');
        if (scoreSectionCard) scoreSectionCard.classList.add('hidden');

        // Update bidder options
        bidderSelect.innerHTML = this.currentGame.players.map(p => 
            `<option value="${p.id}">${p.name}</option>`
        ).join('');

        // Prepare meld/score inputs (will be shown after Next)
        meldInputs.innerHTML = this.currentGame.players.map(p => {
            let checkbox = '';
            // Only show checkbox for non-winning players
            if (!this._pendingHand || p.id !== this._pendingHand.bidderId) {
                checkbox = `<label style="margin-left:8px;"><input type="checkbox" id="nines-only-${p.id}"> Only 9's of trump?</label>`;
            }
            return `
                <div class="player-input">
                    <label>${p.name} Meld:</label>
                    <input type="number" id="meld-${p.id}" min="0" step="10" value="0">
                    ${checkbox}
                </div>
            `;
        }).join('');
        scoreInputs.innerHTML = this.currentGame.players.map(p => `
            <div class="player-input">
                <label>${p.name} Tricks:</label>
                <input type="number" id="score-${p.id}" min="0" max="25" value="0">
            </div>
        `).join('');

        this.updateScoreboard();
    }
    nextToMeldPhase() {
        if (!this.currentGame) {
            console.debug('No current game.');
            return;
        }
        const winningBidInput = document.getElementById('winning-bid');
        const bidderSelect = document.getElementById('bidder');
        const handStartSection = document.getElementById('hand-start-section');
        const meldSectionCard = document.getElementById('meld-section-card');
        const meldWinningBid = document.getElementById('meld-winning-bid');
        console.debug('nextToMeldPhase called', {
            winningBidInput,
            bidderSelect,
            handStartSection,
            meldSectionCard,
            meldWinningBid
        });
        // Set minimum bid based on game type
        let minBid = 250;
        if (this.currentGame.gameType === 2) {
            minBid = 150;
        }
        const winningBid = parseInt(winningBidInput.value);
        console.debug('Winning bid value:', winningBid);
        if (!winningBid || winningBid < minBid) {
            console.debug('Invalid winning bid:', winningBid, 'Minimum required:', minBid);
            this.showToast(`Please enter a valid winning bid (minimum ${minBid})`, 'error');
            return;
        }
        if (!bidderSelect.value) {
            console.debug('No bidder selected');
            this.showToast('Please select a bidder', 'error');
            return;
        }
        // Store winning bid and bidder for this hand in temporary state
        this._pendingHand = {
            winningBid,
            bidderId: bidderSelect.value,
            bidderName: this.currentGame.players.find(p => p.id === bidderSelect.value).name
        };
        console.debug('Pending hand:', this._pendingHand);
        // Hide hand start, show meld
        if (handStartSection) {
            handStartSection.classList.add('hidden');
            console.debug('Hand start section hidden');
        } else {
            console.debug('Hand start section not found');
        }
        if (meldSectionCard) {
            meldSectionCard.classList.remove('hidden');
            console.debug('Meld section card shown');
        } else {
            console.debug('Meld section card not found');
        }
        if (meldWinningBid) {
            meldWinningBid.textContent = `${winningBid} (${this._pendingHand.bidderName})`;
            console.debug('Meld winning bid updated');
        } else {
            console.debug('Meld winning bid element not found');
        }
    }

    nextToScorePhase() {
        if (!this.currentGame || !this._pendingHand) return;
        const meldSectionCard = document.getElementById('meld-section-card');
        const scoreSectionCard = document.getElementById('score-section-card');
        const scoreWinningBid = document.getElementById('score-winning-bid');
        const scoreTricksRequired = document.getElementById('score-tricks-required');
        // Hide meld, show score
        if (meldSectionCard) meldSectionCard.classList.add('hidden');
        if (scoreSectionCard) scoreSectionCard.classList.remove('hidden');
        if (scoreWinningBid) scoreWinningBid.textContent = this._pendingHand.winningBid;
        // Calculate tricks required
        const meldInput = document.getElementById(`meld-${this._pendingHand.bidderId}`);
        let meldValue = meldInput ? parseInt(meldInput.value) || 0 : 0;
        let tricksRequired = Math.floor((this._pendingHand.winningBid - meldValue) / 10);
        if (tricksRequired < 1) tricksRequired = 1;
        if (scoreTricksRequired) scoreTricksRequired.textContent = tricksRequired;

        // Show moon options if tricks required > 25
        const moonOptions = document.getElementById('moon-options');
        if (moonOptions) {
            if (tricksRequired > 25) {
                moonOptions.style.display = '';
            } else {
                moonOptions.style.display = 'none';
            }
        }
    }
    // Move to meld/score phase after winning bid is entered
    initializeEventListeners() {
        document.getElementById('players-tab').addEventListener('click', () => this.showTab('players'));
        document.getElementById('game-tab').addEventListener('click', () => this.showTab('game'));
        document.getElementById('stats-tab').addEventListener('click', () => this.showTab('stats'));
        document.getElementById('add-player').addEventListener('click', () => this.addPlayer());
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayer();
        });
        document.getElementById('game-type').addEventListener('change', () => this.updatePlayerSelection());
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('next-to-meld').addEventListener('click', () => this.nextToMeldPhase());
    document.getElementById('next-to-score').addEventListener('click', () => this.nextToScorePhase());
    document.getElementById('submit-hand').addEventListener('click', () => this.submitHand());
    document.getElementById('edit-scores').addEventListener('click', () => this.showEditScores());
    const shotMoonBtn = document.getElementById('shot-the-moon');
    if (shotMoonBtn) shotMoonBtn.addEventListener('click', () => this.shotTheMoon());
        document.getElementById('end-game').addEventListener('click', () => this.endGame());
        document.getElementById('throw-in-hand').addEventListener('click', () => this.throwInHand());
    }


    // Throw in hand (no bids)
    throwInHand() {
        if (!this.currentGame) return;
        // Record a hand with no bids and no meld/score
        const handData = {
            handNumber: this.currentGame.hands.length + 1,
            winningBid: null,
            bidderId: null,
            bidderName: null,
            playerMeld: {},
            playerScores: {},
            timestamp: new Date().toISOString(),
            dealerId: this.currentGame.players[this.currentGame.dealerIndex].id,
            dealerName: this.currentGame.players[this.currentGame.dealerIndex].name,
            thrownIn: true
        };
        // Advance dealer for next hand
        this.currentGame.hands.push(handData);
        this.currentGame.dealerIndex = (this.currentGame.dealerIndex + 1) % this.currentGame.players.length;
        localStorage.setItem('pinochle-current-game', JSON.stringify(this.currentGame));
        // Clear inputs and pending hand
        document.getElementById('winning-bid').value = '';
        this._pendingHand = null;
        this.updateGameInterface();
        this.showToast('Hand thrown in (no bids)');
    }

    submitHand() {
        if (!this.currentGame || !this._pendingHand) return;
        // Use winning bid and bidder from pending hand
        const { winningBid, bidderId, bidderName } = this._pendingHand;
        const handData = {
            handNumber: this.currentGame.hands.length + 1,
            winningBid,
            bidderId,
            bidderName,
            playerMeld: {},
            playerScores: {},
            timestamp: new Date().toISOString(),
            dealerId: this.currentGame.players[this.currentGame.dealerIndex].id,
            dealerName: this.currentGame.players[this.currentGame.dealerIndex].name
        };
        // Collect meld and scores
        let totalHandScore = 0;
        let totalTricks = 0;
        for (const player of this.currentGame.players) {
            const meld = parseInt(document.getElementById(`meld-${player.id}`).value) || 0;
            const tricks = parseInt(document.getElementById(`score-${player.id}`).value) || 0;
            if (meld % 10 !== 0) {
                this.showToast('Meld values must be divisible by 10.','error');
                return;
            }
            // Non-winning players meld safety logic
            let ninesOnly = false;
            if (this._pendingHand && player.id !== this._pendingHand.bidderId && (meld === 10 || meld === 20)) {
                const ninesCheckbox = document.getElementById(`nines-only-${player.id}`);
                ninesOnly = ninesCheckbox && ninesCheckbox.checked;
            }
            // If meld is 10 or 20 and only 9's, meld is safe regardless of tricks
            // If meld > 20 or meld is 10/20 but not only 9's, must win at least 1 trick
            if (this._pendingHand && player.id !== this._pendingHand.bidderId) {
                if ((meld === 10 || meld === 20) && ninesOnly) {
                    // Safe, no trick required
                } else if (meld > 0 && tricks < 1) {
                    // Not safe, meld lost
                    handData.playerMeld[player.id] = 0;
                    this.showToast(`${player.name}'s meld is lost (must win at least 1 trick to claim meld).`, 'error');
                }
            }
            handData.playerMeld[player.id] = meld;
            handData.playerScores[player.id] = tricks * 10;
            totalTricks += tricks;
        }
        // Validate total tricks (max 25)
        if (totalTricks > 25) {
            this.showToast('Total tricks cannot exceed 25. Please adjust.','error');
            return;
        }
        // Check if winning bidder goes set
        const bidderMeld = handData.playerMeld[bidderId];
        const bidderScore = handData.playerScores[bidderId];
        if ((bidderMeld + bidderScore) < winningBid) {
            // Bidder goes set: subtract winning bid from their score, do not add meld or hand score
            const playerScore = this.currentGame.scores.find(s => s.playerId === bidderId);
            playerScore.score -= winningBid;
            // Other players score meld + hand score as normal
            for (const player of this.currentGame.players) {
                if (player.id !== bidderId) {
                    const meld = handData.playerMeld[player.id];
                    const points = handData.playerScores[player.id];
                    const otherScore = this.currentGame.scores.find(s => s.playerId === player.id);
                    otherScore.score += meld + points;
                    // Update player statistics
                    const playerData = this.players.find(p => p.id === player.id);
                    playerData.totalMeld += meld;
                    // Track highest hand score
                    const handTotal = meld + points;
                    if (handTotal > playerData.highestHand) {
                        playerData.highestHand = handTotal;
                    }
                }
            }
        } else {
            // Normal scoring for all players
            for (const player of this.currentGame.players) {
                const playerScore = this.currentGame.scores.find(s => s.playerId === player.id);
                const meld = handData.playerMeld[player.id];
                const points = handData.playerScores[player.id];
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
        }
        this.currentGame.hands.push(handData);
        // Advance dealer for next hand
        this.currentGame.dealerIndex = (this.currentGame.dealerIndex + 1) % this.currentGame.players.length;
        localStorage.setItem('pinochle-current-game', JSON.stringify(this.currentGame));
        // Clear inputs and pending hand
        document.getElementById('winning-bid').value = '';
        document.querySelectorAll('[id^="meld-"]').forEach(input => input.value = '0');
        document.querySelectorAll('[id^="score-"]').forEach(input => input.value = '0');
        this._pendingHand = null;
        this.updateGameInterface();
        this.checkGameEnd();
        this.showToast(`Hand ${handData.handNumber} recorded`);
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
        
    // Remove current game from storage
    localStorage.removeItem('pinochle-current-game');
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
        // Show score editing UI
    showEditScores() {
        if (!this.currentGame) return;
        // Create a modal or inline form for editing scores
        let modal = document.getElementById('edit-scores-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'edit-scores-modal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(0,0,0,0.5)';
            modal.style.zIndex = '9999';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            document.body.appendChild(modal);
        }
        // Build form
    let html = '<div style="background:#fff;padding:24px;border-radius:8px;max-width:900px;width:100%;overflow:auto;max-height:80vh;">';
        html += '<h2>Edit Prior Round Scores</h2>';
        html += '<form id="edit-scores-form">';
        html += '<label for="edit-round-select">Select Round:</label> ';
        html += `<select id="edit-round-select">${this.currentGame.hands.map((hand, idx) => `<option value="${idx}">Round #${hand.handNumber}</option>`).join('')}</select>`;
        html += '<div id="edit-round-fields"></div>';
        html += '<button type="submit" class="primary-button" style="margin-top:16px;">Save Changes</button>';
        html += '<button type="button" id="cancel-edit-scores" class="secondary-button" style="margin-left:8px;">Cancel</button>';
        html += '</form></div>';
        modal.innerHTML = html;
        // Helper to render fields for selected round
        const renderRoundFields = (roundIdx) => {
            const hand = this.currentGame.hands[roundIdx];
            let fieldsHtml = `<h4>Hand ${hand.handNumber}</h4>`;
            fieldsHtml += `<label>Winning Bid: <input type="number" name="winning-bid-${roundIdx}" value="${hand.winningBid || 0}" style="width:80px;" step="10"></label><br>`;
            this.currentGame.players.forEach(player => {
                const meld = hand.playerMeld ? hand.playerMeld[player.id] || 0 : 0;
                const tricks = hand.playerScores ? (hand.playerScores[player.id] || 0) / 10 : 0;
                fieldsHtml += `<div style="margin-bottom:8px;"><strong>${player.name}</strong><br>`;
                fieldsHtml += `Meld: <input type="number" name="meld-${roundIdx}-${player.id}" value="${meld}" style="width:80px;" step="10"> `;
                fieldsHtml += `Tricks: <input type="number" name="tricks-${roundIdx}-${player.id}" value="${tricks}" min="0" max="25" style="width:60px;" step="1"></div>`;
            });
            document.getElementById('edit-round-fields').innerHTML = fieldsHtml;
        };
        // Initial render
        renderRoundFields(0);
        document.getElementById('edit-round-select').onchange = (e) => {
            renderRoundFields(parseInt(e.target.value));
        };
        // Cancel button
        document.getElementById('cancel-edit-scores').onclick = () => {
            modal.remove();
        };
        // Save handler
        document.getElementById('edit-scores-form').onsubmit = (e) => {
            e.preventDefault();
            const roundIdx = parseInt(document.getElementById('edit-round-select').value);
            const hand = this.currentGame.hands[roundIdx];
            // Update winning bid
            const bidInput = document.querySelector(`[name='winning-bid-${roundIdx}']`);
            if (bidInput) {
                hand.winningBid = parseInt(bidInput.value) || 0;
            }
            this.currentGame.players.forEach(player => {
                const meldInput = document.querySelector(`[name='meld-${roundIdx}-${player.id}']`);
                const tricksInput = document.querySelector(`[name='tricks-${roundIdx}-${player.id}']`);
                if (meldInput) {
                    hand.playerMeld[player.id] = parseInt(meldInput.value) || 0;
                }
                if (tricksInput) {
                    hand.playerScores[player.id] = (parseInt(tricksInput.value) || 0) * 10;
                }
            });
            // Recalculate total scores from scratch, including set logic
            this.currentGame.scores.forEach(s => s.score = 0);
            this.currentGame.hands.forEach(hand => {
                // Determine if bidder goes set
                const bidderId = hand.bidderId;
                const winningBid = hand.winningBid || 0;
                const bidderMeld = hand.playerMeld && bidderId ? hand.playerMeld[bidderId] || 0 : 0;
                const bidderScore = hand.playerScores && bidderId ? hand.playerScores[bidderId] || 0 : 0;
                if (bidderId && (bidderMeld + bidderScore) < winningBid) {
                    // Bidder goes set: subtract winning bid from their score, do not add meld or hand score
                    let s = this.currentGame.scores.find(x => x.playerId === bidderId);
                    s.score -= winningBid;
                    // Other players score meld + hand score as normal
                    this.currentGame.players.forEach(player => {
                        if (player.id !== bidderId) {
                            const meld = hand.playerMeld ? hand.playerMeld[player.id] || 0 : 0;
                            const score = hand.playerScores ? hand.playerScores[player.id] || 0 : 0;
                            let sOther = this.currentGame.scores.find(x => x.playerId === player.id);
                            sOther.score += meld + score;
                        }
                    });
                } else {
                    // Normal scoring for all players
                    this.currentGame.players.forEach(player => {
                        const meld = hand.playerMeld ? hand.playerMeld[player.id] || 0 : 0;
                        const score = hand.playerScores ? hand.playerScores[player.id] || 0 : 0;
                        let s = this.currentGame.scores.find(x => x.playerId === player.id);
                        s.score += meld + score;
                    });
                }
            });
            localStorage.setItem('pinochle-current-game', JSON.stringify(this.currentGame));
            modal.remove();
            this.updateScoreboard();
            this.showToast('Scores updated.');
        };
    }
}

// Initialize the application after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.app = new PinochleScoreKeeper();
});