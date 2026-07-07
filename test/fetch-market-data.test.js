import { describe, it, expect } from 'vitest';

describe('Basic Module Imports', () => {
  it('should import yfinance module without errors', async () => {
    // Just verify that the module exports exist
    const yfinanceModule = await import('../yfinance.js');
    expect(typeof yfinanceModule.fetchMarketData).toBe('function');
    expect(typeof yfinanceModule.fetchMultipleMarketData).toBe('function');
  });
});