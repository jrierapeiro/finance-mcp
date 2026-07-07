import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuote = vi.fn();
const mockSearch = vi.fn();
const mockQuoteSummary = vi.fn();

vi.mock('yahoo-finance2', () => ({
  default: vi.fn().mockImplementation(function () {
    return { quote: mockQuote, search: mockSearch, quoteSummary: mockQuoteSummary };
  }),
}));

const yfinanceModule = await import('../yfinance.js');
const {
  fetchMarketData, fetchMultipleMarketData, searchStocks,
  getMarketOverview, getCompanyInfo,
} = yfinanceModule;

function makeQuote(overrides = {}) {
  return {
    regularMarketPrice: 172.35,
    regularMarketPreviousClose: 170.89,
    trailingPE: 28.5,
    forwardPE: null,
    dividendYield: 0.0055,
    fiftyTwoWeekHigh: 198.23,
    fiftyTwoWeekLow: 124.17,
    marketCap: 2700000000000,
    currency: 'USD',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchMarketData', () => {
  it('should be a function', () => {
    expect(typeof fetchMarketData).toBe('function');
  });

  it('should return structured market data for a valid ticker', async () => {
    mockQuote.mockResolvedValue(makeQuote());
    mockSearch.mockResolvedValue({
      news: [
        { title: 'Apple News', publisher: 'FT', link: 'https://x.com', providerPublishTime: '2025-01-01T00:00:00Z' },
      ],
    });

    const result = await fetchMarketData('AAPL');

    expect(result).toHaveProperty('current_price', 172.35);
    expect(result).toHaveProperty('day_change_pct');
    expect(result).toHaveProperty('52w_high', 198.23);
    expect(result).toHaveProperty('52w_low', 124.17);
    expect(result).toHaveProperty('pe_ratio', 28.5);
    expect(result).toHaveProperty('market_cap', 2700000000000);
    expect(result).toHaveProperty('dividend_yield_pct', 0.55);
    expect(result).toHaveProperty('currency', 'USD');
    expect(result).toHaveProperty('news_headlines');
    expect(result.news_headlines).toContain('Apple News');
    expect(result).toHaveProperty('news');
    expect(result.news).toHaveLength(1);
  });

  it('should handle missing quote data gracefully', async () => {
    mockQuote.mockResolvedValue({});
    mockSearch.mockResolvedValue({ news: [] });

    const result = await fetchMarketData('UNKNOWN');
    expect(result).toBeNull();
  });

  it('should handle quote error gracefully', async () => {
    mockQuote.mockRejectedValue(new Error('API error'));

    const result = await fetchMarketData('ERROR');
    expect(result).toBeNull();
  });

  it('should compute day_change_pct correctly', async () => {
    mockQuote.mockResolvedValue(makeQuote({ regularMarketPrice: 180, regularMarketPreviousClose: 150 }));
    mockSearch.mockResolvedValue({ news: [] });

    const result = await fetchMarketData('AAPL');
    expect(result.day_change_pct).toBe(20);
  });

  it('should return null dividend_yield_pct when yield > 25%', async () => {
    mockQuote.mockResolvedValue(makeQuote({ dividendYield: 0.5 }));
    mockSearch.mockResolvedValue({ news: [] });

    const result = await fetchMarketData('AAPL');
    expect(result.dividend_yield_pct).toBeNull();
  });
});

describe('fetchMultipleMarketData', () => {
  it('should handle empty array', async () => {
    const results = await fetchMultipleMarketData([]);
    expect(results).toEqual([]);
  });

  it('should return one result per ticker', async () => {
    mockQuote.mockResolvedValue(makeQuote());
    mockSearch.mockResolvedValue({ news: [] });

    const results = await fetchMultipleMarketData(['AAPL']);
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('AAPL');
    expect(results[0].data).not.toBeNull();
    expect(results[0].error).toBeNull();
  });

  it('should handle a mix of valid and invalid tickers', async () => {
    mockQuote
      .mockResolvedValueOnce(makeQuote())
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValueOnce(makeQuote({ current_price: 300 }));
    mockSearch.mockResolvedValue({ news: [] });

    const results = await fetchMultipleMarketData(['AAPL', 'INVALID', 'MSFT']);
    expect(results).toHaveLength(3);
    expect(results[0].error).toBeNull();
    expect(results[1].data).toBeNull();
    expect(results[1].error).toBeDefined();
    expect(results[2].error).toBeNull();
  });

  it('should return correct structure for each result', async () => {
    mockQuote.mockResolvedValue(makeQuote());
    mockSearch.mockResolvedValue({ news: [] });

    const results = await fetchMultipleMarketData(['AAPL']);
    expect(results[0]).toHaveProperty('ticker');
    expect(results[0]).toHaveProperty('data');
    expect(results[0]).toHaveProperty('error');
  });
});

describe('searchStocks', () => {
  it('should be a function', () => {
    expect(typeof searchStocks).toBe('function');
  });

  it('should return formatted search results', async () => {
    mockSearch.mockResolvedValue({
      quotes: [
        {
          symbol: 'AAPL',
          longName: 'Apple Inc.',
          exchange: 'NMS',
          quoteType: 'EQUITY',
          marketCap: 2700000000000,
          regularMarketPrice: 172.35,
        },
      ],
    });

    const results = await searchStocks('Apple');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      ticker: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NMS',
      type: 'EQUITY',
      market_cap: 2700000000000,
      price: 172.35,
    });
  });

  it('should deduplicate results by symbol', async () => {
    mockSearch.mockResolvedValue({
      quotes: [
        { symbol: 'AAPL', longName: 'Apple Inc.', exchange: 'NMS', quoteType: 'EQUITY', marketCap: 1e12, regularMarketPrice: 170 },
        { symbol: 'AAPL', longName: 'Apple Inc.', exchange: 'NMS', quoteType: 'EQUITY', marketCap: 1e12, regularMarketPrice: 172 },
      ],
    });

    const results = await searchStocks('Apple');
    expect(results).toHaveLength(1);
  });

  it('should filter out small market cap stocks', async () => {
    mockSearch.mockResolvedValue({
      quotes: [
        { symbol: 'TINY', longName: 'Tiny Co', exchange: 'PNK', quoteType: 'EQUITY', marketCap: 500000, regularMarketPrice: 0.01 },
        { symbol: 'BIG', longName: 'Big Co', exchange: 'NMS', quoteType: 'EQUITY', marketCap: 1e12, regularMarketPrice: 100 },
      ],
    });

    const results = await searchStocks('test');
    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('BIG');
  });

  it('should return empty array on search error', async () => {
    mockSearch.mockRejectedValue(new Error('Search failed'));

    const results = await searchStocks('error');
    expect(results).toEqual([]);
  });

  it('should return empty array when no quotes found', async () => {
    mockSearch.mockResolvedValue({ quotes: [] });

    const results = await searchStocks('Nothing');
    expect(results).toEqual([]);
  });
});

describe('getMarketOverview', () => {
  it('should be a function', () => {
    expect(typeof getMarketOverview).toBe('function');
  });

  it('should return market data for default indices when no argument given', async () => {
    mockQuote
      .mockResolvedValueOnce({ regularMarketPrice: 4500, regularMarketPreviousClose: 4450 })
      .mockResolvedValueOnce({ regularMarketPrice: 34000, regularMarketPreviousClose: 34100 })
      .mockResolvedValueOnce({ regularMarketPrice: 14000, regularMarketPreviousClose: 13900 });

    const results = await getMarketOverview();
    expect(results).toHaveLength(3);
    expect(results[0].index).toBe('SP500');
    expect(results[1].index).toBe('DJI');
    expect(results[2].index).toBe('IXIC');
  });

  it('should accept custom indices', async () => {
    mockQuote.mockResolvedValueOnce({ regularMarketPrice: 200, regularMarketPreviousClose: 190 });

    const results = await getMarketOverview(['^FTSE']);
    expect(results).toHaveLength(1);
    expect(results[0].index).toBe('^FTSE');
  });

  it('should map short index names to Yahoo symbols', async () => {
    mockQuote.mockResolvedValueOnce({ regularMarketPrice: 4500, regularMarketPreviousClose: 4450 });

    const results = await getMarketOverview(['SP500']);
    expect(results).toHaveLength(1);
    expect(results[0].index).toBe('SP500');
    expect(mockQuote).toHaveBeenCalledWith('^GSPC');
  });

  it('should compute change_amount and change_percentage', async () => {
    mockQuote.mockResolvedValueOnce({ regularMarketPrice: 200, regularMarketPreviousClose: 190 });

    const results = await getMarketOverview(['^GSPC']);
    expect(results[0].change_amount).toBe(10);
    expect(results[0].change_percentage).toBeCloseTo(5.26, 1);
  });

  it('should skip indices that fail to fetch', async () => {
    mockQuote
      .mockResolvedValueOnce({ regularMarketPrice: 4500, regularMarketPreviousClose: 4450 })
      .mockRejectedValueOnce(new Error('API error'));

    const results = await getMarketOverview(['SP500', 'BROKEN']);
    expect(results).toHaveLength(1);
    expect(results[0].index).toBe('SP500');
  });
});

describe('getCompanyInfo', () => {
  it('should be a function', () => {
    expect(typeof getCompanyInfo).toBe('function');
  });

  it('should return structured company info for a valid ticker', async () => {
    mockQuoteSummary.mockResolvedValue({
      assetProfile: {
        name: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        longBusinessSummary: 'Apple designs, manufactures, and markets smartphones.',
        website: 'https://apple.com',
        country: 'United States',
        fullTimeEmployees: 164000,
        companyOfficers: [
          { name: 'Tim Cook', title: 'CEO', age: 63, totalPay: 15000000 },
        ],
      },
      financialData: {
        marketCap: 2700000000000,
        currentPE: 28.5,
        trailingPE: 27.8,
        pegRatio: 2.1,
        profitMargins: 0.25,
        totalRevenue: 395000000000,
        revenueGrowth: 0.08,
        earningsPerShare: { raw: 6.44 },
        dividendYield: 0.0055,
        dividendRate: 0.96,
        payoutRatio: 0.15,
        fiftyTwoWeekHigh: 198.23,
        fiftyTwoWeekLow: 124.17,
        priceToBook: 45.0,
        debtToEquity: 150.0,
        returnOnEquity: 1.5,
      },
      defaultKeyStatistics: {
        enterpriseValue: 2750000000000,
        forwardPE: 30.1,
        beta: 1.2,
      },
    });

    const result = await getCompanyInfo('AAPL');
    expect(result).not.toBeNull();
    expect(result.ticker).toBe('AAPL');
    expect(result.name).toBe('Apple Inc.');
    expect(result.sector).toBe('Technology');
    expect(result.industry).toBe('Consumer Electronics');
    expect(result.description).toContain('smartphones');
    expect(result.website).toBe('https://apple.com');
    expect(result.employees).toBe(164000);
    expect(result.market_cap).toBe(2700000000000);
    expect(result.pe_ratio).toBe(28.5);
    expect(result.forward_pe).toBe(30.1);
    expect(result.beta).toBe(1.2);
    expect(result.revenue).toBe(395000000000);
    expect(result.earnings_per_share).toBe(6.44);
    expect(result.dividend_yield).toBe(0.0055);
    expect(result.officers).toHaveLength(1);
    expect(result.officers[0].name).toBe('Tim Cook');
    expect(result.officers[0].title).toBe('CEO');
  });

  it('should return null on api error', async () => {
    mockQuoteSummary.mockRejectedValue(new Error('API failure'));

    const result = await getCompanyInfo('ERROR');
    expect(result).toBeNull();
  });

  it('should handle missing optional fields gracefully', async () => {
    mockQuoteSummary.mockResolvedValue({
      assetProfile: {},
      financialData: {},
      defaultKeyStatistics: {},
    });

    const result = await getCompanyInfo('MINIMAL');
    expect(result).not.toBeNull();
    expect(result.name).toBeNull();
    expect(result.officers).toEqual([]);
  });
});
