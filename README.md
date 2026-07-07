# Finance MCP Server

A Model Context Protocol (MCP) server that provides access to financial market data using the yfinance API.

## Features

- Fetches real-time financial market data for stock tickers
- Supports common stocks like AAPL, GOOGL, MSFT, AMZN, TSLA
- Provides current price, day change percentage, 52-week high/low, P/E ratio, market cap, and dividend yield
- Includes news headlines related to the requested ticker

## Running with Docker Compose

To start the MCP server using Docker Compose:

```bash
docker-compose up -d
```

The server will be accessible on port 3000.

## Development

To run in development mode with auto-restart:

```bash
docker-compose up
```

## Usage

The server implements the MCP protocol and can be used with MCP-compatible clients that support the `fetchMarketData` tool.

### Example Query

Example of how to query the server for Apple (AAPL) stock data using an MCP client:

```json
{
  "method": "tools/call",
  "params": {
    "name": "fetchMarketData",
    "arguments": {
      "ticker": "AAPL"
    }
  }
}
```

### Example Response

This query would return market data in the following format:
```json
{
  "success": true,
  "data": {
    "current_price": 172.35,
    "day_change_pct": 0.84,
    "52w_high": 198.23,
    "52w_low": 124.17,
    "pe_ratio": 28.5,
    "market_cap": 2700000000000,
    "dividend_yield_pct": 0.55,
    "currency": "USD",
    "news_headlines": [
      "Apple Report Shows Strong Growth in Services Segment",
      "AAPL Earnings Beat Estimates as iPhone Sales Surpass Expectations"
    ],
    "news": [
      {
        "title": "Apple Report Shows Strong Growth in Services Segment",
        "publisher": "Financial Times",
        "link": "https://example.com/news1",
        "time": "2023-06-15T10:30:00Z"
      }
    ]
  }
}
```

## Configuration

Edit `server/config.js` to add more ticker mappings or modify settings.

## Testing

This project now includes comprehensive test coverage using vitest:

### Running Tests
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode for development

### Test Structure
- Unit tests for yfinance module in `test/yfinance.test.js`
- Integration tests for MCP server functionality in `test/integration.test.js`

## Usage Examples

### 1. Fetch Single Stock Market Data
```json
{
  "method": "tools/call",
  "params": {
    "name": "fetchMarketData",
    "arguments": {
      "ticker": "AAPL"
    }
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "current_price": 172.35,
    "day_change_pct": 0.84,
    "52w_high": 198.23,
    "52w_low": 124.17,
    "pe_ratio": 28.5,
    "market_cap": 2700000000000,
    "dividend_yield_pct": 0.55,
    "currency": "USD",
    "news_headlines": [
      "Apple Report Shows Strong Growth in Services Segment",
      "AAPL Earnings Beat Estimates as iPhone Sales Surpass Expectations"
    ],
    "news": [
      {
        "title": "Apple Report Shows Strong Growth in Services Segment",
        "publisher": "Financial Times",
        "link": "https://example.com/news1",
        "time": "2023-06-15T10:30:00Z"
      }
    ]
  }
}
```

### 2. Fetch Multiple Stocks Market Data
```json
{
  "method": "tools/call",
  "params": {
    "name": "fetchMultipleMarketData",
    "arguments": {
      "tickers": ["AAPL", "MSFT", "GOOGL"]
    }
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ticker": "AAPL",
      "data": { /* similar to fetchMarketData response */ },
      "error": null
    },
    {
      "ticker": "MSFT",
      "data": { /* similar to fetchMarketData response */ },
      "error": null
    },
    {
      "ticker": "GOOGL", 
      "data": { /* similar to fetchMarketData response */ },
      "error": null
    }
  ]
}
```

### 3. Search Stocks by Query
```json
{
  "method": "tools/call",
  "params": {
    "name": "searchStocks",
    "arguments": {
      "query": "Apple"
    }
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NMS",
      "type": "EQUITY",
      "market_cap": 2700000000000,
      "price": 172.35
    }
  ]
}
```

### 4. Get Market Overview for Indices
```json
{
  "method": "tools/call",
  "params": {
    "name": "getMarketOverview",
    "arguments": {}
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "index": "SP500",
      "current_value": 4500.12,
      "change_amount": 50.34,
      "change_percentage": 1.13
    },
    {
      "index": "DJI",
      "current_value": 34000.56,
      "change_amount": -120.78,
      "change_percentage": -0.35
    },
    {
      "index": "IXIC",
      "current_value": 14000.33,
      "change_amount": 85.45,
      "change_percentage": 0.62
    }
  ]
}
```

## Running the Server

To run the MCP server locally and test tools:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server in development mode:
   ```bash
   npm run dev
   ```

3. The server will be accessible through MCP client implementations.