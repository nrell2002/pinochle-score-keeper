import GameHand from '../../models/GameHand.js';

describe('GameHand', () => {
  let mockDate;
  
  beforeEach(() => {
    // Mock Date for consistent timestamps
    mockDate = '2023-01-01T12:00:00.000Z';
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create a new game hand with initial values', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      
      expect(hand.handNumber).toBe(1);
      expect(hand.dealerId).toBe('dealer-id');
      expect(hand.dealerName).toBe('John Dealer');
      expect(hand.winningBid).toBeNull();
      expect(hand.bidderId).toBeNull();
      expect(hand.bidderName).toBeNull();
      expect(hand.playerMeld).toEqual({});
      expect(hand.playerScores).toEqual({});
      expect(hand.timestamp).toBe(mockDate);
      expect(hand.thrownIn).toBe(false);
    });
  });

  describe('setWinningBid', () => {
    test('should set winning bid information', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setWinningBid(300, 'bidder-id', 'Jane Bidder');
      
      expect(hand.winningBid).toBe(300);
      expect(hand.bidderId).toBe('bidder-id');
      expect(hand.bidderName).toBe('Jane Bidder');
    });
  });

  describe('setPlayerMeld', () => {
    test('should set meld for a player', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerMeld('player1', 50);
      hand.setPlayerMeld('player2', 30);
      
      expect(hand.playerMeld).toEqual({
        'player1': 50,
        'player2': 30
      });
    });
  });

  describe('setPlayerScore', () => {
    test('should set score for a player', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerScore('player1', 140);
      hand.setPlayerScore('player2', 110);
      
      expect(hand.playerScores).toEqual({
        'player1': 140,
        'player2': 110
      });
    });
  });

  describe('throwIn', () => {
    test('should mark hand as thrown in and reset bid data', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      
      // Set some initial data
      hand.setWinningBid(300, 'bidder-id', 'Jane Bidder');
      hand.setPlayerMeld('player1', 50);
      hand.setPlayerScore('player1', 140);
      
      hand.throwIn();
      
      expect(hand.thrownIn).toBe(true);
      expect(hand.winningBid).toBeNull();
      expect(hand.bidderId).toBeNull();
      expect(hand.bidderName).toBeNull();
      expect(hand.playerMeld).toEqual({});
      expect(hand.playerScores).toEqual({});
    });
  });

  describe('isBidderSet', () => {
    test('should return false when no bidder is set', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      expect(hand.isBidderSet()).toBe(false);
    });

    test('should return false when no winning bid is set', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.bidderId = 'bidder-id';
      expect(hand.isBidderSet()).toBe(false);
    });

    test('should return true when bidder total is less than winning bid', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setWinningBid(300, 'bidder-id', 'Jane Bidder');
      hand.setPlayerMeld('bidder-id', 50);
      hand.setPlayerScore('bidder-id', 200);
      // Total: 250, Bid: 300 -> Set
      
      expect(hand.isBidderSet()).toBe(true);
    });

    test('should return false when bidder total equals winning bid', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setWinningBid(300, 'bidder-id', 'Jane Bidder');
      hand.setPlayerMeld('bidder-id', 50);
      hand.setPlayerScore('bidder-id', 250);
      // Total: 300, Bid: 300 -> Makes bid exactly
      
      expect(hand.isBidderSet()).toBe(false);
    });

    test('should return false when bidder total exceeds winning bid', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setWinningBid(300, 'bidder-id', 'Jane Bidder');
      hand.setPlayerMeld('bidder-id', 60);
      hand.setPlayerScore('bidder-id', 250);
      // Total: 310, Bid: 300 -> Makes bid
      
      expect(hand.isBidderSet()).toBe(false);
    });

    test('should handle missing meld or score data', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setWinningBid(300, 'bidder-id', 'Jane Bidder');
      // No meld or score set -> defaults to 0
      
      expect(hand.isBidderSet()).toBe(true);
    });
  });

  describe('getPlayerHandTotal', () => {
    test('should return sum of meld and score', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerMeld('player1', 50);
      hand.setPlayerScore('player1', 140);
      
      expect(hand.getPlayerHandTotal('player1')).toBe(190);
    });

    test('should return 0 for player with no data', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      expect(hand.getPlayerHandTotal('unknown-player')).toBe(0);
    });

    test('should handle missing meld data', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerScore('player1', 140);
      
      expect(hand.getPlayerHandTotal('player1')).toBe(140);
    });

    test('should handle missing score data', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerMeld('player1', 50);
      
      expect(hand.getPlayerHandTotal('player1')).toBe(50);
    });
  });

  describe('validate', () => {
    const mockPlayers = [
      { id: 'player1', name: 'Player One' },
      { id: 'player2', name: 'Player Two' }
    ];

    test('should pass validation for valid hand data', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerMeld('player1', 50); // Divisible by 10
      hand.setPlayerMeld('player2', 30); // Divisible by 10
      hand.setPlayerScore('player1', 140); // 14 tricks
      hand.setPlayerScore('player2', 110); // 11 tricks, total 25 tricks
      
      const result = hand.validate(mockPlayers);
      
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should fail validation for meld not divisible by 10', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerMeld('player1', 55); // Not divisible by 10
      hand.setPlayerScore('player1', 140);
      
      const result = hand.validate(mockPlayers);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Player One's meld must be divisible by 10");
    });

    test('should fail validation for total tricks exceeding 25', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerMeld('player1', 50);
      hand.setPlayerMeld('player2', 30);
      hand.setPlayerScore('player1', 150); // 15 tricks
      hand.setPlayerScore('player2', 120); // 12 tricks, total 27 tricks
      
      const result = hand.validate(mockPlayers);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Total tricks cannot exceed 25');
    });

    test('should handle multiple validation errors', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerMeld('player1', 55); // Not divisible by 10
      hand.setPlayerMeld('player2', 33); // Not divisible by 10
      hand.setPlayerScore('player1', 150); // 15 tricks
      hand.setPlayerScore('player2', 120); // 12 tricks, total 27 tricks
      
      const result = hand.validate(mockPlayers);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain("Player One's meld must be divisible by 10");
      expect(result.errors).toContain("Player Two's meld must be divisible by 10");
      expect(result.errors).toContain('Total tricks cannot exceed 25');
    });

    test('should handle unknown player gracefully', () => {
      const hand = new GameHand(1, 'dealer-id', 'John Dealer');
      hand.setPlayerMeld('unknown-player', 55);
      
      const result = hand.validate(mockPlayers);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Player's meld must be divisible by 10");
    });
  });

  describe('fromData', () => {
    test('should create hand from stored data with all properties', () => {
      const data = {
        handNumber: 3,
        winningBid: 350,
        bidderId: 'bidder-id',
        bidderName: 'Bidder Name',
        playerMeld: { 'player1': 50, 'player2': 30 },
        playerScores: { 'player1': 140, 'player2': 110 },
        timestamp: '2023-01-02T10:00:00.000Z',
        dealerId: 'dealer-id',
        dealerName: 'Dealer Name',
        thrownIn: false
      };
      
      const hand = GameHand.fromData(data);
      
      expect(hand.handNumber).toBe(3);
      expect(hand.winningBid).toBe(350);
      expect(hand.bidderId).toBe('bidder-id');
      expect(hand.bidderName).toBe('Bidder Name');
      expect(hand.playerMeld).toEqual({ 'player1': 50, 'player2': 30 });
      expect(hand.playerScores).toEqual({ 'player1': 140, 'player2': 110 });
      expect(hand.timestamp).toBe('2023-01-02T10:00:00.000Z');
      expect(hand.dealerId).toBe('dealer-id');
      expect(hand.dealerName).toBe('Dealer Name');
      expect(hand.thrownIn).toBe(false);
    });

    test('should handle missing optional properties with defaults', () => {
      const data = {
        handNumber: 1,
        dealerId: 'dealer-id',
        dealerName: 'Dealer Name',
        timestamp: '2023-01-01T12:00:00.000Z'
      };
      
      const hand = GameHand.fromData(data);
      
      expect(hand.handNumber).toBe(1);
      expect(hand.dealerId).toBe('dealer-id');
      expect(hand.dealerName).toBe('Dealer Name');
      expect(hand.playerMeld).toEqual({});
      expect(hand.playerScores).toEqual({});
      expect(hand.thrownIn).toBe(false);
    });
  });

  describe('toData', () => {
    test('should convert hand to plain object', () => {
      const hand = new GameHand(2, 'dealer-id', 'Dealer Name');
      hand.setWinningBid(280, 'bidder-id', 'Bidder Name');
      hand.setPlayerMeld('player1', 40);
      hand.setPlayerScore('player1', 160);
      
      const data = hand.toData();
      
      expect(data).toEqual({
        handNumber: 2,
        winningBid: 280,
        bidderId: 'bidder-id',
        bidderName: 'Bidder Name',
        playerMeld: { 'player1': 40 },
        playerScores: { 'player1': 160 },
        timestamp: mockDate,
        dealerId: 'dealer-id',
        dealerName: 'Dealer Name',
        thrownIn: false
      });
    });

    test('should create data object that can recreate identical hand', () => {
      const originalHand = new GameHand(3, 'dealer-id', 'Dealer Name');
      originalHand.setWinningBid(320, 'bidder-id', 'Bidder Name');
      originalHand.setPlayerMeld('player1', 60);
      originalHand.setPlayerMeld('player2', 40);
      originalHand.setPlayerScore('player1', 170);
      originalHand.setPlayerScore('player2', 80);
      
      const data = originalHand.toData();
      const recreatedHand = GameHand.fromData(data);
      
      expect(recreatedHand.handNumber).toBe(originalHand.handNumber);
      expect(recreatedHand.winningBid).toBe(originalHand.winningBid);
      expect(recreatedHand.bidderId).toBe(originalHand.bidderId);
      expect(recreatedHand.bidderName).toBe(originalHand.bidderName);
      expect(recreatedHand.playerMeld).toEqual(originalHand.playerMeld);
      expect(recreatedHand.playerScores).toEqual(originalHand.playerScores);
      expect(recreatedHand.timestamp).toBe(originalHand.timestamp);
      expect(recreatedHand.dealerId).toBe(originalHand.dealerId);
      expect(recreatedHand.dealerName).toBe(originalHand.dealerName);
      expect(recreatedHand.thrownIn).toBe(originalHand.thrownIn);
    });
  });
});