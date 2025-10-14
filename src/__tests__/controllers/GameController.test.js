// Mock modules first, before importing
jest.mock('../../utils/helpers.js', () => ({
    DOM: {
        getById: jest.fn(),
        setHTML: jest.fn(),
        query: jest.fn(),
        on: jest.fn()
    },
    Validation: {}
}));

jest.mock('../../services/NotificationService.js', () => ({
    warning: jest.fn(),
    success: jest.fn(),
    error: jest.fn()
}));

jest.mock('../../services/StorageService.js', () => ({
    saveCurrentGame: jest.fn()
}));

jest.mock('../../services/EventService.js', () => ({
    default: { 
        emit: jest.fn(),
        on: jest.fn()
    },
    EVENTS: {
        PLAYERS_LOADED: 'players_loaded',
        PLAYER_ADDED: 'player_added',
        PLAYER_REMOVED: 'player_removed'
    }
}));

jest.mock('../../controllers/TableSetupController.js', () => {
    return class MockTableSetupController {};
});
jest.mock('../../utils/config.js', () => ({
    getGameConfig: jest.fn(() => ({})),
    getMinBid: jest.fn(() => 250)
}));

import GameController from '../../controllers/GameController.js';
import Game from '../../models/Game.js';
import GameHand from '../../models/GameHand.js';
import Player from '../../models/Player.js';
import { DOM } from '../../utils/helpers.js';
import notificationService from '../../services/NotificationService.js';
import storageService from '../../services/StorageService.js';

describe('GameController - Edit Hands Functionality', () => {
    let gameController;
    let mockGame;
    let mockPlayers;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create mock players
        mockPlayers = [
            new Player('player1', 'Alice'),
            new Player('player2', 'Bob')
        ];
        
        // Create mock game
        mockGame = new Game(mockPlayers, 2);
        
        // Create controller instance
        gameController = new GameController();
        gameController.currentGame = mockGame;
        
        // Mock DOM elements
        const mockFieldsContainer = { innerHTML: '' };
        DOM.getById.mockImplementation((id) => {
            if (id === 'edit-round-fields') return mockFieldsContainer;
            return null;
        });
    });

    describe('renderRoundFields', () => {
        test('should render editable fields for regular hands', () => {
            // Create a regular hand (not thrown-in)
            const regularHand = new GameHand(1, 'player1', 'Alice');
            regularHand.setWinningBid(300, 'player1', 'Alice');
            regularHand.setPlayerMeld('player1', 50);
            regularHand.setPlayerScore('player1', 140);
            
            mockGame.hands = [regularHand];
            
            // Call the method
            gameController.renderRoundFields(0);
            
            // Verify that setHTML was called with editable content
            expect(DOM.setHTML).toHaveBeenCalledWith(
                expect.any(Object),
                expect.stringContaining('<input type="number"')
            );
            
            // Verify it doesn't contain the "thrown in" message
            const htmlContent = DOM.setHTML.mock.calls[0][1];
            expect(htmlContent).not.toContain('thrown in (no bids)');
            expect(htmlContent).not.toContain('Cannot be edited');
        });

        test('should render read-only message for thrown-in hands', () => {
            // Create a thrown-in hand
            const thrownHand = new GameHand(1, 'player1', 'Alice');
            thrownHand.throwIn(); // This sets thrownIn = true
            
            mockGame.hands = [thrownHand];
            
            // Call the method
            gameController.renderRoundFields(0);
            
            // Verify that setHTML was called with read-only content
            expect(DOM.setHTML).toHaveBeenCalledWith(
                expect.any(Object),
                expect.stringContaining('thrown in (no bids) - Cannot be edited')
            );
            
            // Verify it doesn't contain editable input fields
            const htmlContent = DOM.setHTML.mock.calls[0][1];
            expect(htmlContent).not.toContain('<input type="number"');
            expect(htmlContent).not.toContain('name="winning-bid-');
            expect(htmlContent).not.toContain('name="meld-');
            expect(htmlContent).not.toContain('name="tricks-');
        });

        test('should handle missing hand gracefully', () => {
            mockGame.hands = [];
            
            // Call the method with invalid index
            gameController.renderRoundFields(0);
            
            // Should not call setHTML when hand doesn't exist
            expect(DOM.setHTML).not.toHaveBeenCalled();
        });
    });

    describe('saveEditedScores', () => {
        let mockModal;
        let mockRoundSelect;

        beforeEach(() => {
            mockModal = { remove: jest.fn() };
            mockRoundSelect = { value: '0' };
            
            DOM.getById.mockImplementation((id) => {
                if (id === 'edit-round-select') return mockRoundSelect;
                if (id === 'edit-round-fields') return { innerHTML: '' };
                return null;
            });
        });

        test('should prevent saving changes for thrown-in hands', () => {
            // Create a thrown-in hand
            const thrownHand = new GameHand(1, 'player1', 'Alice');
            thrownHand.throwIn();
            
            mockGame.hands = [thrownHand];
            
            // Call saveEditedScores
            gameController.saveEditedScores(mockModal);
            
            // Should show warning and return early
            expect(notificationService.warning).toHaveBeenCalledWith('Cannot edit thrown-in hands');
            expect(storageService.saveCurrentGame).not.toHaveBeenCalled();
            expect(mockModal.remove).not.toHaveBeenCalled();
        });

        test('should allow saving changes for regular hands', () => {
            // Create a regular hand
            const regularHand = new GameHand(1, 'player1', 'Alice');
            regularHand.setWinningBid(300, 'player1', 'Alice');
            
            mockGame.hands = [regularHand];
            mockGame.recalculateScores = jest.fn();
            gameController.updateScoreboard = jest.fn();
            
            // Mock input elements
            const mockBidInput = { value: '320' };
            DOM.query.mockImplementation((selector) => {
                if (selector.includes('winning-bid-')) return mockBidInput;
                return null;
            });
            
            // Call saveEditedScores
            gameController.saveEditedScores(mockModal);
            
            // Should process normally
            expect(notificationService.warning).not.toHaveBeenCalledWith('Cannot edit thrown-in hands');
            expect(storageService.saveCurrentGame).toHaveBeenCalled();
            expect(mockModal.remove).toHaveBeenCalled();
            expect(notificationService.success).toHaveBeenCalledWith('Scores updated successfully');
        });
    });
});