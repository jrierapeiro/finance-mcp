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

## Configuration

Edit `server/config.js` to add more ticker mappings or modify settings.