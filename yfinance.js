import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({
  queue: { concurrency: 5, interval: 100 },
  suppressNotices: ['yahooSurvey'],
});

export async function fetchMarketData(ticker) {
  try {
    const quote = await yf.quote(ticker);
    const info = quote || {};

    const currentPrice = info.regularMarketPrice || info.regularMarketPreviousClose;
    if (currentPrice == null) return null;
    const prevClose = info.regularMarketPreviousClose;
    let dayChangePct = null;
    if (currentPrice && prevClose && prevClose !== 0) {
      dayChangePct = parseFloat(((currentPrice - prevClose) / prevClose * 100).toFixed(2));
    }

    const pe = info.trailingPE || info.forwardPE;
    let dividendYield = info.dividendYield;
    if (dividendYield) {
      dividendYield = parseFloat((dividendYield * 100).toFixed(2));
      if (dividendYield > 25) dividendYield = null;
    }

    let news = [];
    let newsDetailed = [];
    try {
      const searchResult = await yf.search(ticker, { newsCount: 5 });
      if (searchResult?.news?.length) {
        news = searchResult.news.map(n => n.title);
        newsDetailed = searchResult.news.map(n => ({
          title: n.title,
          publisher: n.publisher,
          link: n.link,
          time: n.providerPublishTime,
        }));
      }
    } catch (_) { /* news is non-critical */ }

    return {
      current_price: currentPrice,
      day_change_pct: dayChangePct,
      '52w_high': info.fiftyTwoWeekHigh,
      '52w_low': info.fiftyTwoWeekLow,
      pe_ratio: pe,
      market_cap: info.marketCap,
      dividend_yield_pct: dividendYield,
      currency: info.currency,
      news_headlines: news,
      news: newsDetailed,
    };
  } catch (e) {
    console.warn(`[yfinance] Error for ${ticker}: ${e.message}`);
    return null;
  }
}

export async function searchStocks(query) {
  try {
    const searchResult = await yf.search(query, { quotesCount: 20 });
    
    // Process search results into standardized format
    if (!searchResult?.quotes?.length) {
      return [];
    }

    // Filter out irrelevant or duplicate results (filtering on market cap and asset type)
    const filteredQuotes = searchResult.quotes
      .filter(quote => {
        // Only include stocks and ETFs (not indices, mutual funds, etc.)
        if (!quote?.symbol) return false;
        
        // Exclude quotes without proper market data
        if (quote.marketCap && quote.marketCap < 1000000) return false; // Skip small companies
        
        return true;
      })
      .map(quote => ({
        ticker: quote.symbol,
        name: quote.longName || quote.shortName,
        exchange: quote.exchange,
        type: quote.quoteType,
        market_cap: quote.marketCap,
        price: quote.regularMarketPrice
      }));

    // Remove duplicates by symbol (keeping first occurrence)
    const seen = new Set();
    return filteredQuotes.filter(item => {
      if (seen.has(item.ticker)) {
        return false;
      }
      seen.add(item.ticker);
      return true;
    });
  } catch (e) {
    console.warn(`[yfinance] Search error for query "${query}": ${e.message}`);
    return [];
  }
}

const INDEX_MAP = {
  'SP500': '^GSPC',
  'DJI': '^DJI',
  'IXIC': '^IXIC',
};
const DEFAULT_INDICES = ['SP500', 'DJI', 'IXIC'];

export async function getMarketOverview(indices) {
  const inputs = (indices && indices.length > 0) ? indices : DEFAULT_INDICES;

  try {
    const promises = inputs.map(async (input) => {
      try {
        const symbol = INDEX_MAP[input] || input;

        const quote = await yf.quote(symbol);
        if (quote && quote.regularMarketPrice && quote.regularMarketPreviousClose) {
          const currentPrice = quote.regularMarketPrice;
          const prevClose = quote.regularMarketPreviousClose;
          const change = currentPrice - prevClose;
          const changePct = ((change / prevClose) * 100).toFixed(2);

          return {
            index: input,
            current_value: currentPrice,
            change_amount: change,
            change_percentage: parseFloat(changePct),
          };
        }
      } catch (e) {
        console.warn(`[yfinance] Failed to fetch data for ${input}: ${e.message}`);
        return null;
      }
    });

    const results = await Promise.allSettled(promises);

    return results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value);
  } catch (e) {
    console.warn(`[yfinance] Failed to fetch market overview: ${e.message}`);
    return [];
  }
}

export async function getCompanyInfo(ticker) {
  try {
    const result = await yf.quoteSummary(ticker, {
      modules: ['assetProfile', 'financialData', 'defaultKeyStatistics'],
    });

    const profile = result.assetProfile || {};
    const financials = result.financialData || {};
    const stats = result.defaultKeyStatistics || {};

    return {
      ticker: ticker.toUpperCase(),
      name: profile.name || null,
      sector: profile.sector || null,
      industry: profile.industry || null,
      description: profile.longBusinessSummary || null,
      website: profile.website || null,
      country: profile.country || null,
      employees: profile.fullTimeEmployees || null,
      market_cap: financials.marketCap || null,
      enterprise_value: stats.enterpriseValue || null,
      pe_ratio: financials.currentPE || financials.trailingPE || null,
      forward_pe: stats.forwardPE || null,
      peg_ratio: financials.pegRatio || null,
      beta: stats.beta || null,
      profit_margins: financials.profitMargins || null,
      revenue: financials.totalRevenue || null,
      revenue_growth: financials.revenueGrowth || null,
      earnings_per_share: financials.earningsPerShare?.raw || null,
      dividend_yield: financials.dividendYield || null,
      dividend_rate: financials.dividendRate || null,
      payout_ratio: financials.payoutRatio || null,
      fifty_two_week_high: financials.fiftyTwoWeekHigh || null,
      fifty_two_week_low: financials.fiftyTwoWeekLow || null,
      price_to_book: financials.priceToBook || null,
      debt_to_equity: financials.debtToEquity || null,
      return_on_equity: financials.returnOnEquity || null,
      officers: (profile.companyOfficers || []).map(o => ({
        name: o.name,
        title: o.title,
        age: o.age || null,
        totalPay: o.totalPay || null,
      })),
    };
  } catch (e) {
    console.warn(`[yfinance] Error fetching company info for ${ticker}: ${e.message}`);
    return null;
  }
}

export async function fetchMultipleMarketData(tickers) {
  // Use Promise.allSettled to handle failed requests gracefully
  const promises = tickers.map(ticker => fetchMarketData(ticker));
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => ({
    ticker: tickers[index],
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));
}
