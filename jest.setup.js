// Load environment variables from .env.test
const { config } = require('dotenv');
config({ path: '.env.test' });

// Set environment to test
process.env.NODE_ENV = 'test';

// Import jest-dom for testing
require('@testing-library/jest-dom');

// Setup fetch mock
const { enableFetchMocks } = require('jest-fetch-mock');
enableFetchMocks();

// Add TextEncoder polyfill for jsdom environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Only setup browser mocks in jsdom environment
if (process.env.JEST_WORKER_ID && global.window) {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock window.scrollTo
  window.scrollTo = jest.fn();
}

// Reset all mocks before each test
beforeEach(() => {
  if (global.fetch) {
    fetchMock.resetMocks();
  }
  jest.clearAllMocks();
});