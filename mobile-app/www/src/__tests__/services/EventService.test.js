import eventServiceSingleton, { EVENTS } from '../../services/EventService.js';

// Import the class separately for testing
import { EventService } from '../../services/EventService.js';

describe('EventService', () => {
  let eventService;

  beforeEach(() => {
    eventService = new EventService();
  });

  describe('constructor', () => {
    test('should initialize with empty listeners map', () => {
      expect(eventService.listeners).toBeInstanceOf(Map);
      expect(eventService.listeners.size).toBe(0);
    });
  });

  describe('on', () => {
    test('should subscribe to an event', () => {
      const callback = jest.fn();
      const unsubscribe = eventService.on('test-event', callback);

      expect(eventService.listeners.has('test-event')).toBe(true);
      expect(eventService.listeners.get('test-event')).toHaveLength(1);
      expect(typeof unsubscribe).toBe('function');
    });

    test('should add multiple listeners to same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventService.on('test-event', callback1);
      eventService.on('test-event', callback2);

      expect(eventService.listeners.get('test-event')).toHaveLength(2);
    });

    test('should store callback and context correctly', () => {
      const callback = jest.fn();
      const context = { name: 'test-context' };

      eventService.on('test-event', callback, context);

      const listeners = eventService.listeners.get('test-event');
      expect(listeners[0]).toEqual({ callback, context });
    });

    test('should default context to null', () => {
      const callback = jest.fn();

      eventService.on('test-event', callback);

      const listeners = eventService.listeners.get('test-event');
      expect(listeners[0].context).toBeNull();
    });

    test('should return unsubscribe function that removes listener', () => {
      const callback = jest.fn();
      const unsubscribe = eventService.on('test-event', callback);

      expect(eventService.listenerCount('test-event')).toBe(1);
      
      unsubscribe();
      
      expect(eventService.listenerCount('test-event')).toBe(0);
    });
  });

  describe('once', () => {
    test('should subscribe to event and auto-unsubscribe after first trigger', () => {
      const callback = jest.fn();
      eventService.once('test-event', callback);

      expect(eventService.listenerCount('test-event')).toBe(1);

      // First emit
      eventService.emit('test-event', 'arg1');
      expect(callback).toHaveBeenCalledWith('arg1');
      expect(eventService.listenerCount('test-event')).toBe(0);

      // Second emit should not trigger callback
      callback.mockClear();
      eventService.emit('test-event', 'arg2');
      expect(callback).not.toHaveBeenCalled();
    });

    test('should apply context correctly', () => {
      const context = { value: 42 };
      const callback = jest.fn(function() {
        expect(this).toBe(context);
      });

      eventService.once('test-event', callback, context);
      eventService.emit('test-event');

      expect(callback).toHaveBeenCalled();
    });

    test('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = eventService.once('test-event', callback);

      expect(typeof unsubscribe).toBe('function');
      expect(eventService.listenerCount('test-event')).toBe(1);

      unsubscribe();
      expect(eventService.listenerCount('test-event')).toBe(0);
    });
  });

  describe('off', () => {
    test('should remove specific callback from event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventService.on('test-event', callback1);
      eventService.on('test-event', callback2);

      expect(eventService.listenerCount('test-event')).toBe(2);

      eventService.off('test-event', callback1);
      expect(eventService.listenerCount('test-event')).toBe(1);

      eventService.emit('test-event');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('should do nothing for non-existent event', () => {
      const callback = jest.fn();
      
      expect(() => {
        eventService.off('non-existent', callback);
      }).not.toThrow();
    });

    test('should do nothing for non-existent callback', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventService.on('test-event', callback1);

      expect(() => {
        eventService.off('test-event', callback2);
      }).not.toThrow();

      expect(eventService.listenerCount('test-event')).toBe(1);
    });

    test('should clean up empty event arrays', () => {
      const callback = jest.fn();

      eventService.on('test-event', callback);
      expect(eventService.listeners.has('test-event')).toBe(true);

      eventService.off('test-event', callback);
      expect(eventService.listeners.has('test-event')).toBe(false);
    });
  });

  describe('emit', () => {
    test('should call all listeners for an event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventService.on('test-event', callback1);
      eventService.on('test-event', callback2);

      eventService.emit('test-event', 'arg1', 'arg2');

      expect(callback1).toHaveBeenCalledWith('arg1', 'arg2');
      expect(callback2).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should apply context correctly', () => {
      const context1 = { name: 'context1' };
      const context2 = { name: 'context2' };

      const callback1 = jest.fn(function() {
        expect(this).toBe(context1);
      });
      const callback2 = jest.fn(function() {
        expect(this).toBe(context2);
      });

      eventService.on('test-event', callback1, context1);
      eventService.on('test-event', callback2, context2);

      eventService.emit('test-event');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('should do nothing for non-existent event', () => {
      expect(() => {
        eventService.emit('non-existent');
      }).not.toThrow();
    });

    test('should handle errors in listeners gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();

      eventService.on('test-event', errorCallback);
      eventService.on('test-event', normalCallback);

      // Should not throw and should continue to call other listeners
      expect(() => {
        eventService.emit('test-event');
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        "Error in event listener for 'test-event':",
        expect.any(Error)
      );
    });

    test('should handle listeners being modified during iteration', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn(() => {
        // Remove callback1 during iteration
        eventService.off('test-event', callback1);
      });
      const callback3 = jest.fn();

      eventService.on('test-event', callback1);
      eventService.on('test-event', callback2);
      eventService.on('test-event', callback3);

      eventService.emit('test-event');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();
    });
  });

  describe('removeAllListeners', () => {
    test('should remove all listeners for specific event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventService.on('event1', callback1);
      eventService.on('event1', callback2);
      eventService.on('event2', callback1);

      eventService.removeAllListeners('event1');

      expect(eventService.listeners.has('event1')).toBe(false);
      expect(eventService.listeners.has('event2')).toBe(true);
    });

    test('should remove all listeners for all events when no event specified', () => {
      const callback = jest.fn();

      eventService.on('event1', callback);
      eventService.on('event2', callback);
      eventService.on('event3', callback);

      eventService.removeAllListeners();

      expect(eventService.listeners.size).toBe(0);
    });
  });

  describe('listenerCount', () => {
    test('should return correct count of listeners', () => {
      const callback = jest.fn();

      expect(eventService.listenerCount('test-event')).toBe(0);

      eventService.on('test-event', callback);
      expect(eventService.listenerCount('test-event')).toBe(1);

      eventService.on('test-event', callback);
      expect(eventService.listenerCount('test-event')).toBe(2);

      eventService.off('test-event', callback);
      expect(eventService.listenerCount('test-event')).toBe(1);
    });

    test('should return 0 for non-existent event', () => {
      expect(eventService.listenerCount('non-existent')).toBe(0);
    });
  });

  describe('eventNames', () => {
    test('should return array of event names with listeners', () => {
      const callback = jest.fn();

      expect(eventService.eventNames()).toEqual([]);

      eventService.on('event1', callback);
      eventService.on('event2', callback);
      eventService.on('event3', callback);

      const eventNames = eventService.eventNames();
      expect(eventNames).toHaveLength(3);
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
      expect(eventNames).toContain('event3');
    });

    test('should not include events with no listeners', () => {
      const callback = jest.fn();

      eventService.on('event1', callback);
      eventService.on('event2', callback);
      eventService.off('event2', callback); // This should clean up the event

      const eventNames = eventService.eventNames();
      expect(eventNames).toEqual(['event1']);
    });
  });

  describe('EVENTS constants', () => {
    test('should export standard event constants', () => {
      expect(EVENTS).toBeDefined();
      expect(typeof EVENTS).toBe('object');

      // Test a few key events to ensure they're defined
      expect(EVENTS.PLAYER_ADDED).toBe('player:added');
      expect(EVENTS.GAME_STARTED).toBe('game:started');
      expect(EVENTS.HAND_COMPLETED).toBe('hand:completed');
      expect(EVENTS.TAB_CHANGED).toBe('ui:tab-changed');
      expect(EVENTS.DATA_SAVED).toBe('data:saved');
    });

    test('should have all expected event categories', () => {
      const eventValues = Object.values(EVENTS);
      
      // Check that we have events from each category
      expect(eventValues.some(event => event.startsWith('player:'))).toBe(true);
      expect(eventValues.some(event => event.startsWith('game:'))).toBe(true);
      expect(eventValues.some(event => event.startsWith('hand:'))).toBe(true);
      expect(eventValues.some(event => event.startsWith('ui:'))).toBe(true);
      expect(eventValues.some(event => event.startsWith('data:'))).toBe(true);
      expect(eventValues.some(event => event.startsWith('validation:'))).toBe(true);
    });
  });

  describe('integration tests', () => {
    test('should support complex event workflows', () => {
      const playerAddedCallback = jest.fn();
      const gameStartedCallback = jest.fn();
      const anyEventCallback = jest.fn();

      // Subscribe to specific events
      eventService.on(EVENTS.PLAYER_ADDED, playerAddedCallback);
      eventService.on(EVENTS.GAME_STARTED, gameStartedCallback);

      // Subscribe to multiple events with same callback
      eventService.on(EVENTS.PLAYER_ADDED, anyEventCallback);
      eventService.on(EVENTS.GAME_STARTED, anyEventCallback);

      // Emit events
      eventService.emit(EVENTS.PLAYER_ADDED, { name: 'Alice' });
      eventService.emit(EVENTS.GAME_STARTED, { gameId: '123' });

      // Verify specific callbacks
      expect(playerAddedCallback).toHaveBeenCalledWith({ name: 'Alice' });
      expect(gameStartedCallback).toHaveBeenCalledWith({ gameId: '123' });

      // Verify general callback received both events
      expect(anyEventCallback).toHaveBeenCalledTimes(2);
      expect(anyEventCallback).toHaveBeenCalledWith({ name: 'Alice' });
      expect(anyEventCallback).toHaveBeenCalledWith({ gameId: '123' });
    });

    test('should handle unsubscription during event flow', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      let unsubscribe1;

      unsubscribe1 = eventService.on('test-event', callback1);
      eventService.on('test-event', callback2);

      // First emit - both should be called
      eventService.emit('test-event', 'first');
      expect(callback1).toHaveBeenCalledWith('first');
      expect(callback2).toHaveBeenCalledWith('first');

      // Unsubscribe first callback
      unsubscribe1();

      // Second emit - only callback2 should be called
      callback1.mockClear();
      callback2.mockClear();
      eventService.emit('test-event', 'second');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('second');
    });
  });
});