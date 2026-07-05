import YahooFinance from 'yahoo-finance2';
import cfg from './config.js';

const yf = new YahooFinance({
  queue: { concurrency: 2, interval: 500 },
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
    return {};
  }
}
