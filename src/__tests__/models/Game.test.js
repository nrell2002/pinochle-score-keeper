describe('Game edge cases', () => {
  let mockPlayers;
  beforeEach(() => {
    mockPlayers = [
      { id: 'p1', name: 'A' },
      { id: 'p2', name: 'B' }
    ];
  });

  test('recalculateScores skips thrown in hands', () => {
    const game = new Game(mockPlayers, 2);
    const hand = {
      thrownIn: true,
      isBidderSet: () => false,
      playerMeld: {},
      playerScores: {}
    };
    game.hands = [hand];
    game.scores[0].score = 100;
    game.scores[1].score = 200;
    game.recalculateScores();
    expect(game.scores[0].score).toBe(0);
    expect(game.scores[1].score).toBe(0);
  });

  test('recalculateScores handles bidder set', () => {
    const game = new Game(mockPlayers, 2);
    const hand = {
      thrownIn: false,
      isBidderSet: () => true,
      bidderId: 'p1',
      winningBid: 50,
      playerMeld: { p2: 10 },
      playerScores: { p2: 20 }
    };
    game.hands = [hand];
    game.recalculateScores();
    expect(game.scores[0].score).toBe(-50);
    expect(game.scores[1].score).toBe(30);
  });

  test('checkForWinner returns highest scorer among those reaching target', () => {
    const game = new Game(mockPlayers, 2);
    game.scores = [
      { playerId: 'p1', name: 'A', score: 1000 },
      { playerId: 'p2', name: 'B', score: 1200 }
    ];
    const winner = game.checkForWinner();
    expect(winner.playerId).toBe('p2');
  });

  test('checkForWinner returns null if no one reaches target', () => {
    const game = new Game(mockPlayers, 2);
    game.scores = [
      { playerId: 'p1', name: 'A', score: 500 },
      { playerId: 'p2', name: 'B', score: 800 }
    ];
    const winner = game.checkForWinner();
    expect(winner).toBeNull();
  });
});
import Game from '../../models/Game.js';
import GameHand from '../../models/GameHand.js';

// Mock GameHand import
jest.mock('../../models/GameHand.js');

describe('Game', () => {
  let mockPlayers;
  let mockDate;

  beforeEach(() => {
    // Mock Date for consistent timestamps
    mockDate = '2023-01-01T12:00:00.000Z';
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

    mockPlayers = [
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' },
      { id: 'player3', name: 'Charlie' }
    ];

    // Reset GameHand mock
    GameHand.mockClear();
    GameHand.fromData = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create a 2-player game with correct defaults', () => {
      const twoPlayers = mockPlayers.slice(0, 2);
      const game = new Game(twoPlayers, 2);

      expect(game.id).toBe('1234567890123'); // Mocked Date.now()
      expect(game.gameType).toBe(2);
      expect(game.players).toBe(twoPlayers);
      expect(game.hands).toEqual([]);
      expect(game.scores).toEqual([
        { playerId: 'player1', name: 'Alice', score: 0 },
        { playerId: 'player2', name: 'Bob', score: 0 }
      ]);
      expect(game.startTime).toBe(mockDate);
      expect(game.endTime).toBeNull();
      expect(game.targetScore).toBe(1000); // 2-player target
      expect(game.dealerIndex).toBe(0);
      expect(game.winnerId).toBeNull();
      expect(game.winnerName).toBeNull();
    });

    test('should create a 3-player game with correct target score', () => {
      const game = new Game(mockPlayers, 3);

      expect(game.gameType).toBe(3);
      expect(game.targetScore).toBe(1500); // 3-player target
      expect(game.scores).toHaveLength(3);
    });

    test('should create a 4-player game with correct target score', () => {
      const fourPlayers = [...mockPlayers, { id: 'player4', name: 'Diana' }];
      const game = new Game(fourPlayers, 4);

      expect(game.gameType).toBe(4);
      expect(game.targetScore).toBe(1500); // 4-player target
      expect(game.scores).toHaveLength(4);
    });
  });

  describe('getCurrentDealer', () => {
    test('should return the current dealer based on dealerIndex', () => {
      const game = new Game(mockPlayers, 3);
      expect(game.getCurrentDealer()).toBe(mockPlayers[0]);

      game.dealerIndex = 1;
      expect(game.getCurrentDealer()).toBe(mockPlayers[1]);

      game.dealerIndex = 2;
      expect(game.getCurrentDealer()).toBe(mockPlayers[2]);
    });
  });

  describe('advanceDealer', () => {
    test('should advance dealer index cyclically', () => {
      const game = new Game(mockPlayers, 3);

      expect(game.dealerIndex).toBe(0);
      
      game.advanceDealer();
      expect(game.dealerIndex).toBe(1);
      
      game.advanceDealer();
      expect(game.dealerIndex).toBe(2);
      
      game.advanceDealer();
      expect(game.dealerIndex).toBe(0); // Wraps around
    });
  });

  describe('getNextHandNumber', () => {
    test('should return correct hand numbers', () => {
      const game = new Game(mockPlayers, 3);
      
      expect(game.getNextHandNumber()).toBe(1);
      
      // Simulate adding hands
      game.hands.push({});
      expect(game.getNextHandNumber()).toBe(2);
      
      game.hands.push({});
      expect(game.getNextHandNumber()).toBe(3);
    });
  });

  describe('addHand', () => {
    test('should add hand, recalculate scores, and advance dealer', () => {
      const game = new Game(mockPlayers, 3);
      const mockHand = {
        thrownIn: false,
        isBidderSet: jest.fn().mockReturnValue(false),
        bidderId: 'player1',
        winningBid: 300,
        playerMeld: { 'player1': 50, 'player2': 30, 'player3': 40 },
        playerScores: { 'player1': 140, 'player2': 110, 'player3': 100 }
      };

      jest.spyOn(game, 'recalculateScores');
      jest.spyOn(game, 'advanceDealer');

      const initialDealerIndex = game.dealerIndex;
      
      game.addHand(mockHand);

      expect(game.hands).toContain(mockHand);
      expect(game.recalculateScores).toHaveBeenCalled();
      expect(game.advanceDealer).toHaveBeenCalled();
    });
  });

  describe('recalculateScores', () => {
    let game;

    beforeEach(() => {
      game = new Game(mockPlayers, 3);
    });

    test('should skip thrown in hands', () => {
      const thrownInHand = {
        thrownIn: true,
        isBidderSet: jest.fn(),
        playerMeld: { 'player1': 50 },
        playerScores: { 'player1': 140 }
      };

      game.hands = [thrownInHand];
      game.recalculateScores();

      // Scores should remain at 0
      expect(game.scores).toEqual([
        { playerId: 'player1', name: 'Alice', score: 0 },
        { playerId: 'player2', name: 'Bob', score: 0 },
        { playerId: 'player3', name: 'Charlie', score: 0 }
      ]);
      expect(thrownInHand.isBidderSet).not.toHaveBeenCalled();
    });

    test('should handle normal scoring when bidder makes bid', () => {
      const normalHand = {
        thrownIn: false,
        isBidderSet: jest.fn().mockReturnValue(false),
        bidderId: 'player1',
        winningBid: 300,
        playerMeld: { 'player1': 50, 'player2': 30, 'player3': 40 },
        playerScores: { 'player1': 140, 'player2': 110, 'player3': 100 }
      };

      game.hands = [normalHand];
      game.recalculateScores();

      expect(game.scores).toEqual([
        { playerId: 'player1', name: 'Alice', score: 190 }, // 50 + 140
        { playerId: 'player2', name: 'Bob', score: 140 },   // 30 + 110
        { playerId: 'player3', name: 'Charlie', score: 140 } // 40 + 100
      ]);
    });

    test('should handle bidder going set', () => {
      const setBidderHand = {
        thrownIn: false,
        isBidderSet: jest.fn().mockReturnValue(true),
        bidderId: 'player1',
        winningBid: 300,
        playerMeld: { 'player1': 50, 'player2': 30, 'player3': 40 },
        playerScores: { 'player1': 140, 'player2': 110, 'player3': 100 }
      };

      game.hands = [setBidderHand];
      game.recalculateScores();

      expect(game.scores).toEqual([
        { playerId: 'player1', name: 'Alice', score: -300 }, // -300 (set)
        { playerId: 'player2', name: 'Bob', score: 140 },    // 30 + 110
        { playerId: 'player3', name: 'Charlie', score: 140 }  // 40 + 100
      ]);
    });

    test('should handle missing meld or score data', () => {
      const incompleteHand = {
        thrownIn: false,
        isBidderSet: jest.fn().mockReturnValue(false),
        bidderId: 'player1',
        winningBid: 300,
        playerMeld: { 'player1': 50 }, // Missing player2, player3
        playerScores: { 'player2': 110 } // Missing player1, player3
      };

      game.hands = [incompleteHand];
      game.recalculateScores();

      expect(game.scores).toEqual([
        { playerId: 'player1', name: 'Alice', score: 50 },   // 50 + 0
        { playerId: 'player2', name: 'Bob', score: 110 },    // 0 + 110
        { playerId: 'player3', name: 'Charlie', score: 0 }   // 0 + 0
      ]);
    });

    test('should accumulate scores across multiple hands', () => {
      const hand1 = {
        thrownIn: false,
        isBidderSet: jest.fn().mockReturnValue(false),
        bidderId: 'player1',
        winningBid: 300,
        playerMeld: { 'player1': 50, 'player2': 30, 'player3': 40 },
        playerScores: { 'player1': 140, 'player2': 110, 'player3': 100 }
      };

      const hand2 = {
        thrownIn: false,
        isBidderSet: jest.fn().mockReturnValue(false),
        bidderId: 'player2',
        winningBid: 250,
        playerMeld: { 'player1': 30, 'player2': 60, 'player3': 20 },
        playerScores: { 'player1': 100, 'player2': 120, 'player3': 130 }
      };

      game.hands = [hand1, hand2];
      game.recalculateScores();

      expect(game.scores).toEqual([
        { playerId: 'player1', name: 'Alice', score: 320 },   // (50+140) + (30+100)
        { playerId: 'player2', name: 'Bob', score: 320 },     // (30+110) + (60+120)
        { playerId: 'player3', name: 'Charlie', score: 290 }  // (40+100) + (20+130)
      ]);
    });
  });

  describe('checkForWinner', () => {
    let game;

    beforeEach(() => {
      game = new Game(mockPlayers, 3); // Target score: 1500
    });

    test('should return null when no player reaches target score', () => {
      game.scores = [
        { playerId: 'player1', name: 'Alice', score: 1200 },
        { playerId: 'player2', name: 'Bob', score: 1400 },
        { playerId: 'player3', name: 'Charlie', score: 1100 }
      ];

      expect(game.checkForWinner()).toBeNull();
    });

    test('should return winner when one player reaches target score', () => {
      game.scores = [
        { playerId: 'player1', name: 'Alice', score: 1200 },
        { playerId: 'player2', name: 'Bob', score: 1600 },
        { playerId: 'player3', name: 'Charlie', score: 1100 }
      ];

      const winner = game.checkForWinner();
      expect(winner).toEqual({ playerId: 'player2', name: 'Bob', score: 1600 });
    });

    test('should return highest scorer when multiple players reach target', () => {
      game.scores = [
        { playerId: 'player1', name: 'Alice', score: 1700 },
        { playerId: 'player2', name: 'Bob', score: 1600 },
        { playerId: 'player3', name: 'Charlie', score: 1550 }
      ];

      const winner = game.checkForWinner();
      expect(winner).toEqual({ playerId: 'player1', name: 'Alice', score: 1700 });
    });

    test('should return team winner for 4-player games when team reaches target', () => {
      const mockPlayers = [
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' },
        { id: 'player3', name: 'Charlie' },
        { id: 'player4', name: 'Diana' }
      ];
      
      const game = new Game(mockPlayers, 4);
      
      // Set up team assignments
      game.teamAssignments = {
        teamA: [{ id: 'player1', name: 'Alice' }, { id: 'player3', name: 'Charlie' }],
        teamB: [{ id: 'player2', name: 'Bob' }, { id: 'player4', name: 'Diana' }]
      };
      
      // Set individual scores where Team A reaches target
      game.scores = [
        { playerId: 'player1', name: 'Alice', score: 800 },
        { playerId: 'player2', name: 'Bob', score: 600 },
        { playerId: 'player3', name: 'Charlie', score: 750 }, // Team A total: 1550
        { playerId: 'player4', name: 'Diana', score: 700 }    // Team B total: 1300
      ];
      
      const winner = game.checkForWinner();
      expect(winner).toBeTruthy();
      expect(winner.type).toBe('team');
      expect(winner.team).toBe('teamA');
      expect(winner.score).toBe(1550);
      expect(winner.teamName).toBe('Team A');
    });

    test('should return null for 4-player games when no team reaches target', () => {
      const mockPlayers = [
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' },
        { id: 'player3', name: 'Charlie' },
        { id: 'player4', name: 'Diana' }
      ];
      
      const game = new Game(mockPlayers, 4);
      
      // Set up team assignments
      game.teamAssignments = {
        teamA: [{ id: 'player1', name: 'Alice' }, { id: 'player3', name: 'Charlie' }],
        teamB: [{ id: 'player2', name: 'Bob' }, { id: 'player4', name: 'Diana' }]
      };
      
      // Set individual scores where no team reaches target
      game.scores = [
        { playerId: 'player1', name: 'Alice', score: 400 },
        { playerId: 'player2', name: 'Bob', score: 300 },
        { playerId: 'player3', name: 'Charlie', score: 350 }, // Team A total: 750
        { playerId: 'player4', name: 'Diana', score: 250 }    // Team B total: 550
      ];
      
      const winner = game.checkForWinner();
      expect(winner).toBeNull();
    });
  });

  describe('getTeamScores', () => {
    test('should calculate team totals correctly for 4-player games', () => {
      const mockPlayers = [
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' },
        { id: 'player3', name: 'Charlie' },
        { id: 'player4', name: 'Diana' }
      ];
      
      const game = new Game(mockPlayers, 4);
      
      // Set up team assignments
      game.teamAssignments = {
        teamA: [{ id: 'player1', name: 'Alice' }, { id: 'player3', name: 'Charlie' }],
        teamB: [{ id: 'player2', name: 'Bob' }, { id: 'player4', name: 'Diana' }]
      };
      
      // Set individual scores
      game.scores = [
        { playerId: 'player1', name: 'Alice', score: 400 },
        { playerId: 'player2', name: 'Bob', score: 300 },
        { playerId: 'player3', name: 'Charlie', score: 350 },
        { playerId: 'player4', name: 'Diana', score: 250 }
      ];
      
      const teamScores = game.getTeamScores();
      expect(teamScores.teamA).toBe(750); // Alice + Charlie
      expect(teamScores.teamB).toBe(550); // Bob + Diana
    });

    test('should return zero scores for non-4-player games', () => {
      const game = new Game(mockPlayers, 3);
      
      const teamScores = game.getTeamScores();
      expect(teamScores.teamA).toBe(0);
      expect(teamScores.teamB).toBe(0);
    });

    test('should return zero scores when team assignments are missing', () => {
      const mockPlayers = [
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' },
        { id: 'player3', name: 'Charlie' },
        { id: 'player4', name: 'Diana' }
      ];
      
      const game = new Game(mockPlayers, 4);
      // Don't set team assignments
      
      const teamScores = game.getTeamScores();
      expect(teamScores.teamA).toBe(0);
      expect(teamScores.teamB).toBe(0);
    });
  });

  describe('endGame', () => {
    test('should set end time and winner information', () => {
      const game = new Game(mockPlayers, 3);
      
      game.endGame('player2', 'Bob');
      
      expect(game.endTime).toBe(mockDate);
      expect(game.winnerId).toBe('player2');
      expect(game.winnerName).toBe('Bob');
    });
  });

  describe('isCompleted', () => {
    test('should return false for ongoing game', () => {
      const game = new Game(mockPlayers, 3);
      expect(game.isCompleted()).toBe(false);
    });

    test('should return true for completed game', () => {
      const game = new Game(mockPlayers, 3);
      game.endGame('player1', 'Alice');
      expect(game.isCompleted()).toBe(true);
    });
  });

  describe('getDurationMinutes', () => {
    test('should calculate duration for ongoing game', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T13:30:00.000Z'));
      const game = new Game(mockPlayers, 3);
      game.startTime = '2023-01-01T12:00:00.000Z';
      expect(game.getDurationMinutes()).toBe(90); // 1.5 hours = 90 minutes
      jest.useRealTimers();
    });

    test('should calculate duration for completed game', () => {
      const game = new Game(mockPlayers, 3);
      game.startTime = '2023-01-01T12:00:00.000Z';
      game.endTime = '2023-01-01T14:15:00.000Z';
      
      expect(game.getDurationMinutes()).toBe(135); // 2.25 hours = 135 minutes
    });
  });
  
  describe('getStatus', () => {
    test('should return complete status information', () => {
      const game = new Game(mockPlayers, 3);
      game.scores = [
        { playerId: 'player1', name: 'Alice', score: 1200 },
        { playerId: 'player2', name: 'Bob', score: 1400 },
        { playerId: 'player3', name: 'Charlie', score: 1100 }
      ];
      game.hands = [{}]; // One hand played

      jest.spyOn(game, 'getDurationMinutes').mockReturnValue(45);

      const status = game.getStatus();

      expect(status).toEqual({
        currentHand: 2,
        gameType: 3,
        leader: 'Bob',
        leaderScore: 1400,
        targetScore: 1500,
        hasWinner: false,
        winner: null,
        winnerScore: null,
        winnerType: 'individual',
        duration: 45
      });
    });

    test('should include winner information when game has winner', () => {
      const game = new Game(mockPlayers, 3);
      game.scores = [
        { playerId: 'player1', name: 'Alice', score: 1700 },
        { playerId: 'player2', name: 'Bob', score: 1400 },
        { playerId: 'player3', name: 'Charlie', score: 1100 }
      ];

      const status = game.getStatus();

      expect(status.hasWinner).toBe(true);
      expect(status.winner).toBe('Alice');
      expect(status.winnerScore).toBe(1700);
    });
  });

  describe('fromData', () => {
    test('should create game from stored data', () => {
      const mockHandData = { handNumber: 1, dealerId: 'player1' };
      const mockHand = { fromData: jest.fn() };
      GameHand.fromData.mockReturnValue(mockHand);

      const data = {
        id: 'stored-game-id',
        gameType: 3,
        players: mockPlayers,
        hands: [mockHandData],
        scores: [
          { playerId: 'player1', name: 'Alice', score: 1200 },
          { playerId: 'player2', name: 'Bob', score: 1400 },
          { playerId: 'player3', name: 'Charlie', score: 1100 }
        ],
        startTime: '2023-01-01T10:00:00.000Z',
        endTime: '2023-01-01T12:00:00.000Z',
        targetScore: 1500,
        dealerIndex: 2,
        winnerId: 'player2',
        winnerName: 'Bob'
      };

      const game = Game.fromData(data);

      expect(game.id).toBe('stored-game-id');
      expect(game.gameType).toBe(3);
      expect(game.players).toBe(mockPlayers);
      expect(GameHand.fromData).toHaveBeenCalledWith(mockHandData);
      expect(game.scores).toEqual(data.scores);
      expect(game.startTime).toBe('2023-01-01T10:00:00.000Z');
      expect(game.endTime).toBe('2023-01-01T12:00:00.000Z');
      expect(game.targetScore).toBe(1500);
      expect(game.dealerIndex).toBe(2);
      expect(game.winnerId).toBe('player2');
      expect(game.winnerName).toBe('Bob');
    });
  });

  describe('toData', () => {
    test('should convert game to plain object', () => {
      // Mock Date.prototype.toISOString to return mockDate
      const mockDateValue = '2023-01-01T12:00:00.000Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDateValue);
      const game = new Game(mockPlayers, 3);
      const mockHand = { toData: jest.fn().mockReturnValue({ handNumber: 1 }) };
      game.hands = [mockHand];
      game.endGame('player1', 'Alice');

      const data = game.toData();

      expect(data).toEqual({
        id: '1234567890123',
        gameType: 3,
        players: mockPlayers,
        hands: [{ handNumber: 1 }],
        scores: [
          { playerId: 'player1', name: 'Alice', score: 0 },
          { playerId: 'player2', name: 'Bob', score: 0 },
          { playerId: 'player3', name: 'Charlie', score: 0 }
        ],
        startTime: mockDateValue,
        endTime: mockDateValue,
        targetScore: 1500,
        dealerIndex: 0,
        winnerId: 'player1',
        winnerName: 'Alice'
      });
      expect(mockHand.toData).toHaveBeenCalled();
      jest.restoreAllMocks();
    });
  });
});