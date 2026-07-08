#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { fetchMarketData, fetchMultipleMarketData, searchStocks, getMarketOverview, getCompanyInfo } from '../../yfinance.js';

async function main() {
  const mcpServer = new McpServer({
    name: "Financial Data MCP Server",
    version: "1.0.0"
  });

  mcpServer.registerTool("fetchMarketData", {
    description: "Fetch market data for a financial ticker",
    inputSchema: z.object({
      ticker: z.string().describe("Stock ticker symbol (e.g. AAPL, MSFT)")
    })
  }, async ({ ticker }) => {
    try {
      const result = await fetchMarketData(ticker);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  });

  mcpServer.registerTool("fetchMultipleMarketData", {
    description: "Fetch market data for multiple stock tickers",
    inputSchema: z.object({
      tickers: z.array(z.string()).describe("Array of stock ticker symbols (e.g. ['AAPL', 'MSFT'])")
    })
  }, async ({ tickers }) => {
    try {
      const results = await fetchMultipleMarketData(tickers);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  });

  mcpServer.registerTool("searchStocks", {
    description: "Search for stocks by name or symbol",
    inputSchema: z.object({
      query: z.string().describe("Search query for stock names or symbols")
    })
  }, async ({ query }) => {
    try {
      const results = await searchStocks(query);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  });

  mcpServer.registerTool("getMarketOverview", {
    description: "Fetch market overview for major indices",
    inputSchema: z.object({
      indices: z.array(z.string()).optional().describe("Optional list of indices to fetch (defaults to ['SP500', 'DJI', 'IXIC'])")
    })
  }, async ({ indices }) => {
    try {
      const results = await getMarketOverview(indices);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  });

  mcpServer.registerTool("getCompanyInfo", {
    description: "Fetch detailed company information including profile, officers, and financial metrics",
    inputSchema: z.object({
      ticker: z.string().describe("Stock ticker symbol (e.g. AAPL, MSFT)")
    })
  }, async ({ ticker }) => {
    try {
      const result = await getCompanyInfo(ticker);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  });

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch(console.error);