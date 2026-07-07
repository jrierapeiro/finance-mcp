// Maps user-facing ticker symbols to Yahoo Finance symbols.
// Useful when a ticker contains characters that Yahoo Finance
// cannot resolve directly (e.g., 'BRK.B' → 'BRK-B').
// If a ticker has no mapping, the original value is passed through.
export default {
  tickerMap: {
    'AAPL': 'AAPL',
    'GOOGL': 'GOOGL', 
    'MSFT': 'MSFT',
    'AMZN': 'AMZN',
    'TSLA': 'TSLA'
  }
};