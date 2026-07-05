import { describe, it, expect } from 'vitest';
import { fetchMarketData, fetchMultipleMarketData } from '../yfinance.js';

describe('fetchMarketData', () => {
  it('should be a function', async () => {
    expect(typeof fetchMarketData).toBe('function');
    expect(typeof fetchMultipleMarketData).toBe('function');
  });
});

describe('fetchMultipleMarketData', () => {
  it('should be a function and return proper structure', async () => {
    // Test that the function exists
    expect(typeof fetchMultipleMarketData).toBe('function');
    
    // Test with mock data
    const tickers = ['AAPL', 'GOOGL'];
    const results = await fetchMultipleMarketData(tickers);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(2);
    expect(results[0].ticker).toBe('AAPL');
    expect(results[1].ticker).toBe('GOOGL');
  });

  it('should handle single ticker', async () => {
    const results = await fetchMultipleMarketData(['AAPL']);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('AAPL');
  });

  it('should handle error scenarios gracefully', async () => {
    // Test with invalid ticker
    const results = await fetchMultipleMarketData(['INVALID']);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('INVALID');
    expect(results[0].data).toBeNull();
    expect(results[0].error).toBeDefined();
  });

  it('should handle mixed valid and invalid tickers', async () => {
    const results = await fetchMultipleMarketData(['AAPL', 'INVALID', 'MSFT']);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(3);
    expect(results[0].ticker).toBe('AAPL');
    expect(results[1].ticker).toBe('INVALID');
    expect(results[2].ticker).toBe('MSFT');
    
    // First and third should have data, second should have error
    expect(results[0].data).not.toBeNull();
    expect(results[1].error).toBeDefined();
    expect(results[2].data).not.toBeNull();
  });

  it('should validate data format consistency', async () => {
    const results = await fetchMultipleMarketData(['AAPL', 'GOOGL']);
    expect(Array.isArray(results)).toBe(true);
    
    for (const result of results) {
      expect(result).toHaveProperty('ticker');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      
      // If there's data, it should have expected properties
      if (result.data) {
        expect(result.data).toHaveProperty('current_price');
        expect(result.data).toHaveProperty('day_change_pct');
        expect(result.data).toHaveProperty('52w_high');
        expect(result.data).toHaveProperty('52w_low');
        expect(result.data).toHaveProperty('pe_ratio');
        expect(result.data).toHaveProperty('market_cap');
        expect(result.data).toHaveProperty('dividend_yield_pct');
        expect(result.data).toHaveProperty('currency');
        expect(result.data).toHaveProperty('news_headlines');
        expect(result.data).toHaveProperty('news');
      }
    }
  });
});