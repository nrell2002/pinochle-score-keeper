// Jest setup file for global test configuration

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

global.localStorage = localStorageMock;

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
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});