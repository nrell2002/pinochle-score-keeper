import storageService from '../../services/StorageService.js';

describe('StorageService', () => {
  describe('utility methods', () => {
    test('clearAll removes all keys', () => {
      const spy = jest.spyOn(storageService, 'remove');
      storageService.clearAll();
      expect(spy).toHaveBeenCalledWith(storageService.keys.PLAYERS);
      expect(spy).toHaveBeenCalledWith(storageService.keys.CURRENT_GAME);
      expect(spy).toHaveBeenCalledWith(storageService.keys.GAME_HISTORY);
      spy.mockRestore();
    });

    test('exportData returns all stored data', () => {
  const players = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
  const game = { id: 'game-1', players: ['Alice', 'Bob'] };
  const history = [{ id: 'game-1' }, { id: 'game-2' }];
  jest.spyOn(storageService, 'loadPlayers').mockReturnValue(players);
  jest.spyOn(storageService, 'loadCurrentGame').mockReturnValue(game);
  jest.spyOn(storageService, 'loadGameHistory').mockReturnValue(history);
  const data = storageService.exportData();
  expect(data.players).toEqual(players);
  expect(data.currentGame).toEqual(game);
  expect(data.gameHistory).toEqual(history);
  expect(typeof data.exportDate).toBe('string');
    });

    test('importData imports players, currentGame, and gameHistory', () => {
      const players = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
      const game = { id: 'game-1', players: ['Alice', 'Bob'] };
      const history = [{ id: 'game-1' }, { id: 'game-2' }];
      const spyPlayers = jest.spyOn(storageService, 'savePlayers');
      const spyGame = jest.spyOn(storageService, 'saveCurrentGame');
      const spyHistory = jest.spyOn(storageService, 'saveGameHistory');
      const result = storageService.importData({
        players,
        currentGame: game,
        gameHistory: history
      }, true);
      expect(spyPlayers).toHaveBeenCalledWith(players);
      expect(spyGame).toHaveBeenCalledWith(game);
      expect(spyHistory).toHaveBeenCalledWith(history);
      expect(result.success).toBe(true);
      spyPlayers.mockRestore();
      spyGame.mockRestore();
      spyHistory.mockRestore();
    });

    test('isAvailable returns true when localStorage works', () => {
      localStorage.setItem.mockImplementation(() => {});
      localStorage.removeItem.mockImplementation(() => {});
      expect(storageService.isAvailable()).toBe(true);
    });

    test('isAvailable returns false when localStorage throws', () => {
      localStorage.setItem.mockImplementation(() => { throw new Error('fail'); });
      expect(storageService.isAvailable()).toBe(false);
    });

    test('getStorageInfo returns usage info', () => {
  jest.spyOn(storageService, 'isAvailable').mockReturnValue(true);
  localStorage.getItem.mockReturnValueOnce('abc').mockReturnValueOnce('defg').mockReturnValueOnce(null);
  const info = storageService.getStorageInfo();
  expect(info.available).toBe(true);
  expect(info.usage.players).toBe(3);
  expect(info.usage.current_game).toBe(4);
  expect(info.usage.game_history).toBe(0);
  expect(info.totalSize).toBe(7);
  // Calculate expected KB value based on implementation
  const expectedKB = Math.round(7 / 1024 * 100) / 100;
  expect(info.totalSizeKB).toBeCloseTo(expectedKB, 2);
    });
  });
  beforeEach(() => {
    // Ensure localStorage methods are Jest mock functions
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        length: 0
      },
      configurable: true
    });
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('singleton behavior', () => {
    test('should export singleton instance', () => {
      expect(storageService).toBeInstanceOf(Object);
      expect(typeof storageService.save).toBe('function');
      expect(typeof storageService.load).toBe('function');
      expect(storageService.keys).toBeDefined();
    });
  });

  describe('basic functionality', () => {
    test('should save and load data', () => {
      const testData = { name: 'Test Player', score: 100 };
      
      storageService.save('test-key', testData);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData)
      );
      
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));
      const result = storageService.load('test-key');
      expect(result).toEqual(testData);
    });

    test('should return default value when key does not exist', () => {
      localStorage.getItem.mockReturnValue(null);
      const result = storageService.load('non-existent', 'default-value');
      expect(result).toBe('default-value');
    });

    test('should remove data', () => {
      storageService.remove('test-key');
      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('player data methods', () => {
    test('should save and load players', () => {
      const players = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
      
      storageService.savePlayers(players);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pinochle-players',
        JSON.stringify(players)
      );

      localStorage.getItem.mockReturnValue(JSON.stringify(players));
      const result = storageService.loadPlayers();
      expect(result).toEqual(players);
    });

    test('should return empty array for players by default', () => {
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
          key: jest.fn(),
          length: 0
        },
        configurable: true
      });
      const { StorageService } = require('../../services/StorageService.js');
      const isolatedService = new StorageService();
      const result = isolatedService.loadPlayers();
      expect(result).toEqual([]);
    });
  });

  describe('game data methods', () => {
    test('should save and load current game', () => {
      const game = { id: 'game-1', players: ['Alice', 'Bob'] };
      
      storageService.saveCurrentGame(game);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pinochle-current-game',
        JSON.stringify(game)
      );

      localStorage.getItem.mockReturnValue(JSON.stringify(game));
      const result = storageService.loadCurrentGame();
      expect(result).toEqual(game);
    });

    test('should return null for current game by default', () => {
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
          key: jest.fn(),
          length: 0
        },
        configurable: true
      });
      const { StorageService } = require('../../services/StorageService.js');
      const isolatedService = new StorageService();
      const result = isolatedService.loadCurrentGame();
      expect(result).toBeNull();
    });

    test('should remove current game', () => {
      storageService.removeCurrentGame();
      expect(localStorage.removeItem).toHaveBeenCalledWith('pinochle-current-game');
    });
  });

  describe('game history methods', () => {
    test('should save and load game history', () => {
      const history = [{ id: 'game-1' }, { id: 'game-2' }];
      
      storageService.saveGameHistory(history);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pinochle-game-history',
        JSON.stringify(history)
      );

      localStorage.getItem.mockReturnValue(JSON.stringify(history));
      const result = storageService.loadGameHistory();
      expect(result).toEqual(history);
    });

    test('should return empty array for game history by default', () => {
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
          key: jest.fn(),
          length: 0
        },
        configurable: true
      });
      const { StorageService } = require('../../services/StorageService.js');
      const isolatedService = new StorageService();
      const result = isolatedService.loadGameHistory();
      expect(result).toEqual([]);
    });

    test('should add game to history', () => {
      const existingHistory = [{ id: 'game-1' }];
      const newGame = { id: 'game-2' };
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn(() => JSON.stringify(existingHistory)),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
          key: jest.fn(),
          length: 0
        },
        configurable: true
      });
      const { StorageService } = require('../../services/StorageService.js');
      const isolatedService = new StorageService();
      isolatedService.addToGameHistory(newGame);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pinochle-game-history',
        JSON.stringify([{ id: 'game-1' }, { id: 'game-2' }])
      );
    });
  });

  describe('clearAll', () => {
    test('should remove all application data', () => {
      storageService.clearAll();

      expect(localStorage.removeItem).toHaveBeenCalledWith('pinochle-players');
      expect(localStorage.removeItem).toHaveBeenCalledWith('pinochle-current-game');
      expect(localStorage.removeItem).toHaveBeenCalledWith('pinochle-game-history');
      expect(localStorage.removeItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    test('should handle save errors', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        storageService.save('test-key', {});
      }).toThrow('Failed to save data');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save to localStorage:',
        expect.any(Error)
      );
    });

    test('should handle load errors', () => {
      localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = storageService.load('test-key', 'default-value');

      expect(result).toBe('default-value');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load from localStorage:',
        expect.any(Error)
      );
    });

    test('should handle JSON parse errors', () => {
      localStorage.getItem.mockReturnValue('invalid-json{');

      const result = storageService.load('test-key', 'default-value');

      expect(result).toBe('default-value');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load from localStorage:',
        expect.any(Error)
      );
    });
  });
});