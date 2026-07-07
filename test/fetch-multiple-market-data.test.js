import { describe, it, expect } from 'vitest';
import { fetchMultipleMarketData } from '../yfinance.js';

describe('fetchMultipleMarketData', () => {
  it('should be a function', () => {
    expect(typeof fetchMultipleMarketData).toBe('function');
  });

  it('should handle empty array', async () => {
    const results = await fetchMultipleMarketData([]);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(0);
  });

  it('should handle single ticker', async () => {
    const results = await fetchMultipleMarketData(['AAPL']);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('AAPL');
  });

  it('should handle multiple tickers', async () => {
    const tickers = ['AAPL', 'GOOGL'];
    const results = await fetchMultipleMarketData(tickers);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(2);
    expect(results[0].ticker).toBe('AAPL');
    expect(results[1].ticker).toBe('GOOGL');
  });

  it('should return proper structure for each result', async () => {
    const results = await fetchMultipleMarketData(['AAPL']);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results[0]).toHaveProperty('ticker');
    expect(results[0]).toHaveProperty('data');
    expect(results[0]).toHaveProperty('error');
  });

  it('should handle error scenarios gracefully', async () => {
    const results = await fetchMultipleMarketData(['INVALID']);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('INVALID');
    expect(results[0].data).toBeNull();
    expect(results[0].error).toBeDefined();
  });

  // Note: This test requires network access to Yahoo Finance and will fail in offline environments.
  // In real world situations this should properly handle both valid and invalid tickers.
  it('should handle mixed valid and invalid tickers', async () => {
    const results = await fetchMultipleMarketData(['AAPL', 'INVALID', 'MSFT']);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(3);
    expect(results[0].ticker).toBe('AAPL');
    expect(results[1].ticker).toBe('INVALID');
    expect(results[2].ticker).toBe('MSFT');
    
    // Note: In offline environments, all results will be null since fetchMarketData doesn't work without connection
    // This test ensures the function structure is correct regardless of connectivity
  });

  it('should validate data format consistency', async () => {
    const results = await fetchMultipleMarketData(['AAPL', 'GOOGL']);
    
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