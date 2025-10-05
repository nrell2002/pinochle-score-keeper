import storageService from '../../services/StorageService.js';

describe('StorageService', () => {
  beforeEach(() => {
    // Clear localStorage mock
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
      localStorage.getItem.mockReturnValue(null);
      const result = storageService.loadPlayers();
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
      localStorage.getItem.mockReturnValue(null);
      const result = storageService.loadCurrentGame();
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
      localStorage.getItem.mockReturnValue(null);
      const result = storageService.loadGameHistory();
      expect(result).toEqual([]);
    });

    test('should add game to history', () => {
      const existingHistory = [{ id: 'game-1' }];
      const newGame = { id: 'game-2' };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(existingHistory));
      storageService.addToGameHistory(newGame);
      
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