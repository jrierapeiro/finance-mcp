import YahooFinance from 'yahoo-finance2';
import cfg from './server/config.js';

const yf = new YahooFinance({
  queue: { concurrency: 5, interval: 100 }, // Increased concurrency for batch requests
  suppressNotices: ['yahooSurvey'],
});

function resolveSymbol(ticker) {
  return cfg.tickerMap[ticker.toUpperCase()] || ticker;
}

export async function fetchMarketData(ticker) {
  try {
    const symbol = resolveSymbol(ticker);
    const quote = await yf.quote(symbol);
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

// Batch fetch function
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
