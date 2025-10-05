// Jest setup file for global test configuration


// Patch localStorage methods to always be mock functions
beforeAll(() => {
  if (typeof global.localStorage !== 'undefined') {
    global.localStorage.getItem = jest.fn();
    global.localStorage.setItem = jest.fn();
    global.localStorage.removeItem = jest.fn();
    global.localStorage.clear = jest.fn();
    global.localStorage.key = jest.fn();
  } else {
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    };
    global.localStorage = localStorageMock;
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment the line below to disable console.log in tests
  // log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock Date.now for consistent testing
const mockDateNow = jest.fn(() => 1234567890123);
global.Date.now = mockDateNow;

// Clean up mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  if (global.localStorage) {
    if (typeof global.localStorage.getItem === 'function' && global.localStorage.getItem.mockClear) global.localStorage.getItem.mockClear();
    if (typeof global.localStorage.setItem === 'function' && global.localStorage.setItem.mockClear) global.localStorage.setItem.mockClear();
    if (typeof global.localStorage.removeItem === 'function' && global.localStorage.removeItem.mockClear) global.localStorage.removeItem.mockClear();
    if (typeof global.localStorage.clear === 'function' && global.localStorage.clear.mockClear) global.localStorage.clear.mockClear();
    if (typeof global.localStorage.key === 'function' && global.localStorage.key.mockClear) global.localStorage.key.mockClear();
  }
});