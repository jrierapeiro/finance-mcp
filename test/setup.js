// Mock the YahooFinance module to avoid actual API calls during tests
import { vi } from 'vitest';

// Mock the yahoo-finance2 library
const mockYahooFinance = {
  quote: vi.fn(),
  search: vi.fn()
};

vi.mock('yahoo-finance2', () => ({
  default: vi.fn().mockImplementation(() => mockYahooFinance)
}));

// Mock the config file
vi.mock('../server/config.js', () => ({
  default: {
    tickerMap: {
      'AAPL': 'AAPL',
      'GOOGL': 'GOOGL', 
      'MSFT': 'MSFT',
      'AMZN': 'AMZN',
      'TSLA': 'TSLA'
    }
  }
}));