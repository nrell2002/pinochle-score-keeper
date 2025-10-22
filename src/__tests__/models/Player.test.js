import Player from '../../models/Player.js';

describe('Player', () => {
  describe('constructor', () => {
    test('should create a player with name and auto-generated ID', () => {
      const player = new Player('John Doe');
      
      expect(player.name).toBe('John Doe');
      expect(player.id).toBe('1234567890123'); // Mocked Date.now()
      expect(player.gamesPlayed).toBe(0);
      expect(player.gamesWon).toBe(0);
      expect(player.totalScore).toBe(0);
      expect(player.highestHand).toBe(0);
      expect(player.highestBid).toBe(0);
      expect(player.totalMeld).toBe(0);
    });

    test('should create a player with custom ID', () => {
      const player = new Player('Jane Smith', 'custom-id-123');
      
      expect(player.name).toBe('Jane Smith');
      expect(player.id).toBe('custom-id-123');
    });
  });

  describe('getWinRate', () => {
    test('should return 0 when no games played', () => {
      const player = new Player('Test Player');
      expect(player.getWinRate()).toBe(0);
    });

    test('should calculate correct win rate', () => {
      const player = new Player('Test Player');
      player.gamesPlayed = 10;
      player.gamesWon = 3;
      
      expect(player.getWinRate()).toBe(30);
    });

    test('should round win rate to nearest integer', () => {
      const player = new Player('Test Player');
      player.gamesPlayed = 3;
      player.gamesWon = 1;
      
      expect(player.getWinRate()).toBe(33); // 33.33... rounded to 33
    });

    test('should handle 100% win rate', () => {
      const player = new Player('Test Player');
      player.gamesPlayed = 5;
      player.gamesWon = 5;
      
      expect(player.getWinRate()).toBe(100);
    });
  });

  describe('getAverageScore', () => {
    test('should return 0 when no games played', () => {
      const player = new Player('Test Player');
      expect(player.getAverageScore()).toBe(0);
    });

    test('should calculate correct average score', () => {
      const player = new Player('Test Player');
      player.gamesPlayed = 4;
      player.totalScore = 3600;
      
      expect(player.getAverageScore()).toBe(900);
    });

    test('should round average score to nearest integer', () => {
      const player = new Player('Test Player');
      player.gamesPlayed = 3;
      player.totalScore = 1000;
      
      expect(player.getAverageScore()).toBe(333); // 333.33... rounded to 333
    });
  });

  describe('getAverageMeldPerHand', () => {
    test('should return 0 when no hands played', () => {
      const player = new Player('Test Player');
      expect(player.getAverageMeldPerHand()).toBe(0);
    });

    test('should calculate correct average meld per hand', () => {
      const player = new Player('Test Player');
      player.handsPlayed = 5;
      player.totalMeld = 500;
      
      expect(player.getAverageMeldPerHand()).toBe(100);
    });

    test('should round average meld per hand to nearest integer', () => {
      const player = new Player('Test Player');
      player.handsPlayed = 3;
      player.totalMeld = 200;
      
      expect(player.getAverageMeldPerHand()).toBe(67); // 66.66... rounded to 67
    });
  });

  describe('getBiddingSuccessRate', () => {
    test('should return 0 when no bids made', () => {
      const player = new Player('Test Player');
      expect(player.getBiddingSuccessRate()).toBe(0);
    });

    test('should calculate correct bidding success rate', () => {
      const player = new Player('Test Player');
      player.totalBids = 10;
      player.successfulBids = 7;
      
      expect(player.getBiddingSuccessRate()).toBe(70);
    });

    test('should round bidding success rate to nearest integer', () => {
      const player = new Player('Test Player');
      player.totalBids = 3;
      player.successfulBids = 2;
      
      expect(player.getBiddingSuccessRate()).toBe(67); // 66.66... rounded to 67
    });
  });

  describe('getAverageTricksPerHand', () => {
    test('should return 0 when no hands played', () => {
      const player = new Player('Test Player');
      expect(player.getAverageTricksPerHand()).toBe(0);
    });

    test('should calculate correct average tricks per hand', () => {
      const player = new Player('Test Player');
      player.handsPlayed = 4;
      player.totalTricks = 50; // Total tricks taken
      
      expect(player.getAverageTricksPerHand()).toBe(12.5);
    });

    test('should round average tricks per hand to one decimal', () => {
      const player = new Player('Test Player');
      player.handsPlayed = 3;
      player.totalTricks = 38; // 38 / 3 = 12.666...
      
      expect(player.getAverageTricksPerHand()).toBe(12.7);
    });
  });

  describe('updateGameStats', () => {
    test('should update stats for a won game', () => {
      const player = new Player('Test Player');
      player.updateGameStats(true, 1200);
      
      expect(player.gamesPlayed).toBe(1);
      expect(player.gamesWon).toBe(1);
      expect(player.totalScore).toBe(1200);
    });

    test('should update stats for a lost game', () => {
      const player = new Player('Test Player');
      player.updateGameStats(false, 800);
      
      expect(player.gamesPlayed).toBe(1);
      expect(player.gamesWon).toBe(0);
      expect(player.totalScore).toBe(800);
    });

    test('should accumulate multiple games correctly', () => {
      const player = new Player('Test Player');
      player.updateGameStats(true, 1200);
      player.updateGameStats(false, 800);
      player.updateGameStats(true, 1100);
      
      expect(player.gamesPlayed).toBe(3);
      expect(player.gamesWon).toBe(2);
      expect(player.totalScore).toBe(3100);
    });
  });

  describe('updateHandStats', () => {
    test('should update meld and highest hand without bid', () => {
      const player = new Player('Test Player');
      player.updateHandStats(50, 180, 130); // meld, handScore, tricks
      
      expect(player.totalMeld).toBe(50);
      expect(player.highestHand).toBe(180);
      expect(player.highestBid).toBe(0);
      expect(player.handsPlayed).toBe(1);
      expect(player.totalTricks).toBe(13); // 130 / 10
    });

    test('should update bid when player is bidder', () => {
      const player = new Player('Test Player');
      player.updateHandStats(40, 200, 160, 300, true); // meld, handScore, tricks, bid, bidSuccessful
      
      expect(player.totalMeld).toBe(40);
      expect(player.highestHand).toBe(200);
      expect(player.highestBid).toBe(300);
      expect(player.totalBids).toBe(1);
      expect(player.successfulBids).toBe(1);
    });

    test('should only update highest hand when new hand is higher', () => {
      const player = new Player('Test Player');
      player.highestHand = 250;
      
      player.updateHandStats(30, 180, 150); // Lower than current highest
      expect(player.highestHand).toBe(250);
      
      player.updateHandStats(40, 280, 240); // Higher than current highest
      expect(player.highestHand).toBe(280);
    });

    test('should only update highest bid when new bid is higher', () => {
      const player = new Player('Test Player');
      player.highestBid = 350;
      
      player.updateHandStats(30, 180, 150, 300, false); // Lower bid
      expect(player.highestBid).toBe(350);
      
      player.updateHandStats(40, 180, 140, 400, true); // Higher bid
      expect(player.highestBid).toBe(400);
    });

    test('should accumulate meld correctly', () => {
      const player = new Player('Test Player');
      player.updateHandStats(50, 180, 130);
      player.updateHandStats(30, 160, 130);
      player.updateHandStats(70, 200, 130);
      
      expect(player.totalMeld).toBe(150);
      expect(player.handsPlayed).toBe(3);
    });
  });

  describe('fromData', () => {
    test('should create player from stored data with all properties', () => {
      const data = {
        id: 'stored-id',
        name: 'Stored Player',
        gamesPlayed: 5,
        gamesWon: 3,
        totalScore: 4500,
        highestHand: 280,
        highestBid: 420,
        totalMeld: 400,
        handsPlayed: 10,
        totalBids: 2,
        successfulBids: 1,
        totalTricks: 45
      };
      
      const player = Player.fromData(data);
      
      expect(player.id).toBe('stored-id');
      expect(player.name).toBe('Stored Player');
      expect(player.gamesPlayed).toBe(5);
      expect(player.gamesWon).toBe(3);
      expect(player.totalScore).toBe(4500);
      expect(player.highestHand).toBe(280);
      expect(player.highestBid).toBe(420);
      expect(player.totalMeld).toBe(400);
      expect(player.handsPlayed).toBe(10);
      expect(player.totalBids).toBe(2);
      expect(player.successfulBids).toBe(1);
      expect(player.totalTricks).toBe(45);
    });

    test('should handle missing properties with defaults', () => {
      const data = {
        id: 'minimal-id',
        name: 'Minimal Player'
      };
      
      const player = Player.fromData(data);
      
      expect(player.id).toBe('minimal-id');
      expect(player.name).toBe('Minimal Player');
      expect(player.gamesPlayed).toBe(0);
      expect(player.gamesWon).toBe(0);
      expect(player.totalScore).toBe(0);
      expect(player.highestHand).toBe(0);
      expect(player.highestBid).toBe(0);
      expect(player.totalMeld).toBe(0);
      expect(player.handsPlayed).toBe(0);
      expect(player.totalBids).toBe(0);
      expect(player.successfulBids).toBe(0);
      expect(player.totalTricks).toBe(0);
    });
  });

  describe('toData', () => {
    test('should convert player to plain object', () => {
      const player = new Player('Export Player', 'export-id');
      player.gamesPlayed = 2;
      player.gamesWon = 1;
      player.totalScore = 1800;
      player.highestHand = 240;
      player.highestBid = 360;
      player.totalMeld = 120;
      
      const data = player.toData();
      
      expect(data).toEqual({
        id: 'export-id',
        name: 'Export Player',
        gamesPlayed: 2,
        gamesWon: 1,
        totalScore: 1800,
        highestHand: 240,
        highestBid: 360,
        totalMeld: 120,
        handsPlayed: 0,
        totalBids: 0,
        successfulBids: 0,
        totalTricks: 0
      });
    });

    test('should create data object that can recreate identical player', () => {
      const originalPlayer = new Player('Round Trip');
      originalPlayer.updateGameStats(true, 1500);
      originalPlayer.updateHandStats(60, 220, 160, 380, true);
      
      const data = originalPlayer.toData();
      const recreatedPlayer = Player.fromData(data);
      
      expect(recreatedPlayer.id).toBe(originalPlayer.id);
      expect(recreatedPlayer.name).toBe(originalPlayer.name);
      expect(recreatedPlayer.gamesPlayed).toBe(originalPlayer.gamesPlayed);
      expect(recreatedPlayer.gamesWon).toBe(originalPlayer.gamesWon);
      expect(recreatedPlayer.totalScore).toBe(originalPlayer.totalScore);
      expect(recreatedPlayer.highestHand).toBe(originalPlayer.highestHand);
      expect(recreatedPlayer.highestBid).toBe(originalPlayer.highestBid);
      expect(recreatedPlayer.totalMeld).toBe(originalPlayer.totalMeld);
      expect(recreatedPlayer.handsPlayed).toBe(originalPlayer.handsPlayed);
      expect(recreatedPlayer.totalBids).toBe(originalPlayer.totalBids);
      expect(recreatedPlayer.successfulBids).toBe(originalPlayer.successfulBids);
      expect(recreatedPlayer.totalTricks).toBe(originalPlayer.totalTricks);
    });
  });
});