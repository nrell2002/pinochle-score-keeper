import { DOM, Validation, Format, Math as MathUtils, Arrays, Objects } from '../../utils/helpers.js';

// Mock DOM methods for testing
const mockElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn()
  },
  textContent: '',
  innerHTML: ''
};

describe('DOM Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock document methods
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
    jest.spyOn(document, 'getElementsByClassName').mockReturnValue([mockElement]);
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);
    jest.spyOn(document, 'querySelectorAll').mockReturnValue([mockElement]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getById', () => {
    test('should call document.getElementById', () => {
      document.getElementById.mockReturnValue(mockElement);
      
      const result = DOM.getById('test-id');
      
      expect(document.getElementById).toHaveBeenCalledWith('test-id');
      expect(result).toBe(mockElement);
    });
  });

  describe('getByClass', () => {
    test('should call document.getElementsByClassName', () => {
      const mockNodeList = [mockElement];
      document.getElementsByClassName.mockReturnValue(mockNodeList);
      
      const result = DOM.getByClass('test-class');
      
      expect(document.getElementsByClassName).toHaveBeenCalledWith('test-class');
      expect(result).toBe(mockNodeList);
    });
  });

  describe('query', () => {
    test('should call document.querySelector', () => {
      document.querySelector.mockReturnValue(mockElement);
      
      const result = DOM.query('.test-selector');
      
      expect(document.querySelector).toHaveBeenCalledWith('.test-selector');
      expect(result).toBe(mockElement);
    });
  });

  describe('queryAll', () => {
    test('should call document.querySelectorAll', () => {
      const mockNodeList = [mockElement];
      document.querySelectorAll.mockReturnValue(mockNodeList);
      
      const result = DOM.queryAll('.test-selector');
      
      expect(document.querySelectorAll).toHaveBeenCalledWith('.test-selector');
      expect(result).toBe(mockNodeList);
    });
  });

  describe('on', () => {
    test('should add event listener and return cleanup function', () => {
      const handler = jest.fn();
      const options = { passive: true };
      
      const cleanup = DOM.on(mockElement, 'click', handler, options);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', handler, options);
      expect(typeof cleanup).toBe('function');
      
      cleanup();
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', handler, options);
    });
  });

  describe('show', () => {
    test('should remove hidden class from element', () => {
      DOM.show(mockElement);
      expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
    });

    test('should handle null element gracefully', () => {
      expect(() => DOM.show(null)).not.toThrow();
    });
  });

  describe('hide', () => {
    test('should add hidden class to element', () => {
      DOM.hide(mockElement);
      expect(mockElement.classList.add).toHaveBeenCalledWith('hidden');
    });

    test('should handle null element gracefully', () => {
      expect(() => DOM.hide(null)).not.toThrow();
    });
  });

  describe('toggle', () => {
    test('should toggle hidden class on element', () => {
      DOM.toggle(mockElement);
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('hidden');
    });

    test('should handle null element gracefully', () => {
      expect(() => DOM.toggle(null)).not.toThrow();
    });
  });

  describe('setText', () => {
    test('should set text content', () => {
      const element = { textContent: '' };
      DOM.setText(element, 'Test text');
      expect(element.textContent).toBe('Test text');
    });

    test('should handle null element gracefully', () => {
      expect(() => DOM.setText(null, 'text')).not.toThrow();
    });
  });

  describe('setHTML', () => {
    test('should set innerHTML', () => {
      const element = { innerHTML: '' };
      DOM.setHTML(element, '<div>Test HTML</div>');
      expect(element.innerHTML).toBe('<div>Test HTML</div>');
    });

    test('should handle null element gracefully', () => {
      expect(() => DOM.setHTML(null, '<div>test</div>')).not.toThrow();
    });
  });

  describe('clear', () => {
    test('should clear innerHTML', () => {
      const element = { innerHTML: '<div>content</div>' };
      DOM.clear(element);
      expect(element.innerHTML).toBe('');
    });

    test('should handle null element gracefully', () => {
      expect(() => DOM.clear(null)).not.toThrow();
    });
  });
});

describe('Validation Utilities', () => {
  describe('playerName', () => {
    test('should validate correct player names', () => {
      const validNames = ['Alice', 'Bob Smith', 'Player-1', "O'Connor", 'Test_Player'];
      
      validNames.forEach(name => {
        const result = Validation.playerName(name);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(name.trim());
      });
    });

    test('should reject invalid player names', () => {
      const invalidCases = [
        { input: null, error: 'Name is required' },
        { input: '', error: 'Name is required' }, // Empty string is falsy
        { input: '   ', error: 'Name cannot be empty' },
        { input: 'a'.repeat(51), error: 'Name is too long (max 50 characters)' },
        { input: 'Player@123', error: 'Name contains invalid characters' },
        { input: 'Player#1', error: 'Name contains invalid characters' }
      ];

      invalidCases.forEach(({ input, error }) => {
        const result = Validation.playerName(input);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(error);
      });
    });

    test('should trim whitespace from valid names', () => {
      const result = Validation.playerName('  Alice  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Alice');
    });
  });

  describe('meld', () => {
    test('should validate correct meld values', () => {
      const validMelds = [0, 10, 50, 100, 500, 1000];
      
      validMelds.forEach(meld => {
        const result = Validation.meld(meld);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(meld);
      });
    });

    test('should reject invalid meld values', () => {
      const invalidCases = [
        { input: 'not a number', error: 'Meld must be a number' },
        { input: NaN, error: 'Meld must be a number' },
        { input: -10, error: 'Meld cannot be negative' },
        { input: 15, error: 'Meld must be divisible by 10' },
        { input: 1010, error: 'Meld value is too high' }, // 1010 is divisible by 10 but too high
      ];

      invalidCases.forEach(({ input, error }) => {
        const result = Validation.meld(input);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(error);
      });
    });
  });

  describe('tricks', () => {
    test('should validate correct trick counts', () => {
      const validTricks = [0, 5, 15, 25];
      
      validTricks.forEach(tricks => {
        const result = Validation.tricks(tricks);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(tricks);
      });
    });

    test('should reject invalid trick counts', () => {
      const invalidCases = [
        { input: 'not a number', error: 'Tricks must be a number' },
        { input: NaN, error: 'Tricks must be a number' },
        { input: -1, error: 'Tricks cannot be negative' },
        { input: 26, error: 'Tricks cannot exceed 25' }
      ];

      invalidCases.forEach(({ input, error }) => {
        const result = Validation.tricks(input);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(error);
      });
    });
  });

  describe('bid', () => {
    test('should validate correct bid amounts', () => {
      const validBids = [150, 200, 300, 500, 1000];
      
      validBids.forEach(bid => {
        const result = Validation.bid(bid);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(bid);
      });
    });

    test('should respect custom minimum bid', () => {
      const result = Validation.bid(250, 250);
      expect(result.valid).toBe(true);
      
      const resultTooLow = Validation.bid(240, 250);
      expect(resultTooLow.valid).toBe(false);
      expect(resultTooLow.error).toBe('Bid must be at least 250');
    });

    test('should reject invalid bid amounts', () => {
      const invalidCases = [
        { input: 'not a number', error: 'Bid must be a number' },
        { input: NaN, error: 'Bid must be a number' },
        { input: 140, error: 'Bid must be at least 150' },
        { input: 155, error: 'Bid must be divisible by 10' },
        { input: 2010, error: 'Bid is too high' } // 2010 is divisible by 10 but too high
      ];

      invalidCases.forEach(({ input, error }) => {
        const result = Validation.bid(input);
        expect(result.valid).toBe(false);
        expect(result.error).toBe(error);
      });
    });
  });

  describe('totalTricks', () => {
    test('should validate valid total trick counts', () => {
      const validCounts = [
        [10, 15],
        [5, 10, 10],
        [8, 8, 9],
        [25]
      ];
      
      validCounts.forEach(counts => {
        const result = Validation.totalTricks(counts);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(counts.reduce((sum, count) => sum + count, 0));
      });
    });

    test('should reject when total exceeds 25', () => {
      const invalidCounts = [15, 11]; // Total: 26
      const result = Validation.totalTricks(invalidCounts);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Total tricks (26) cannot exceed 25');
    });
  });
});

describe('Format Utilities', () => {
  describe('number', () => {
    test('should format numbers with commas', () => {
      expect(Format.number(1000)).toBe('1,000');
      expect(Format.number(1234567)).toBe('1,234,567');
      expect(Format.number(100)).toBe('100');
    });
  });

  describe('percentage', () => {
    test('should format percentages correctly', () => {
      expect(Format.percentage(75)).toBe('75%');
      expect(Format.percentage(75.5, 1)).toBe('75.5%');
      expect(Format.percentage(75.55, 2)).toBe('75.55%');
    });
  });
});

describe('Math Utilities', () => {
  describe('percentage', () => {
    test('should calculate percentage correctly', () => {
      expect(MathUtils.percentage(50, 100)).toBe(50);
      expect(MathUtils.percentage(1, 3)).toBeCloseTo(33.33, 2);
      expect(MathUtils.percentage(0, 100)).toBe(0);
    });

    test('should handle division by zero', () => {
      expect(MathUtils.percentage(10, 0)).toBe(0);
    });
  });

  describe('clamp', () => {
    test('should clamp values within bounds', () => {
      expect(MathUtils.clamp(5, 0, 10)).toBe(5);
      expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
      expect(MathUtils.clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('roundToMultiple', () => {
    test('should round to nearest multiple', () => {
      expect(MathUtils.roundToMultiple(23, 10)).toBe(20);
      expect(MathUtils.roundToMultiple(27, 10)).toBe(30);
      expect(MathUtils.roundToMultiple(25, 10)).toBe(30);
    });
  });
});

describe('Array Utilities', () => {
  describe('remove', () => {
    test('should remove item from array', () => {
      const array = ['a', 'b', 'c'];
      const result = Arrays.remove(array, 'b');
      
      expect(result).toEqual(['a', 'c']);
      expect(array).toEqual(['a', 'b', 'c']); // Original unchanged
    });

    test('should handle non-existent items', () => {
      const array = ['a', 'b', 'c'];
      const result = Arrays.remove(array, 'd');
      
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('removeAt', () => {
    test('should remove item at index', () => {
      const array = ['a', 'b', 'c'];
      const result = Arrays.removeAt(array, 1);
      
      expect(result).toEqual(['a', 'c']);
    });

    test('should handle invalid indices', () => {
      const array = ['a', 'b', 'c'];
      
      expect(Arrays.removeAt(array, -1)).toEqual(['a', 'b', 'c']);
      expect(Arrays.removeAt(array, 5)).toEqual(['a', 'b', 'c']);
    });
  });
});

describe('Object Utilities', () => {
  describe('deepClone', () => {
    test('should create deep copy of object', () => {
      const original = {
        name: 'Test',
        nested: { value: 42 },
        array: [1, 2, 3]
      };
      
      const cloned = Objects.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
    });
  });

  describe('isEmpty', () => {
    test('should detect empty objects', () => {
      expect(Objects.isEmpty({})).toBe(true);
      expect(Objects.isEmpty({ key: 'value' })).toBe(false);
    });
  });

  describe('pick', () => {
    test('should pick specified properties', () => {
      const object = { a: 1, b: 2, c: 3 };
      const result = Objects.pick(object, ['a', 'c']);
      
      expect(result).toEqual({ a: 1, c: 3 });
    });

    test('should handle non-existent keys', () => {
      const object = { a: 1, b: 2 };
      const result = Objects.pick(object, ['a', 'nonexistent']);
      
      expect(result).toEqual({ a: 1 });
    });
  });
});