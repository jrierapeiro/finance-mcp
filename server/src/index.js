#!/usr/bin/env node

// Import necessary modules
import { createMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createStdioServerTransport, createHttpServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fetchMarketData, fetchMultipleMarketData, searchStocks, getMarketOverview } from '../../yfinance.js';

async function main() {
  // Create an MCP server instance
  const mcpServer = createMcpServer({
    name: "Financial Data MCP Server",
    version: "1.0.0",
    capabilities: {
      tools: {
        list: [
          {
            name: "fetchMarketData",
            description: "Fetches market data for a given stock ticker"
          },
          {
            name: "searchStocks",
            description: "Search for stocks by name or symbol"
          },
          {
            name: "getMarketOverview",
            description: "Fetch market overview for major indices"
          }
        ]
      }
    }
  });

  // Register tool function
  mcpServer.registerTool("fetchMarketData", {
    description: "Fetch market data for a financial ticker",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Stock ticker symbol (e.g. AAPL, MSFT)"
        }
      },
      required: ["ticker"]
    }
  }, async ({ ticker }) => {
    try {
      const result = await fetchMarketData(ticker);
      return { 
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Register fetchMultipleMarketData tool function
  mcpServer.registerTool("fetchMultipleMarketData", {
    description: "Fetch market data for multiple stock tickers",
    inputSchema: {
      type: "object",
      properties: {
        tickers: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of stock ticker symbols (e.g. ['AAPL', 'MSFT'])"
        }
      },
      required: ["tickers"]
    }
  }, async ({ tickers }) => {
    try {
      const results = await fetchMultipleMarketData(tickers);
      return { 
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Register searchStocks tool function
  mcpServer.registerTool("searchStocks", {
    description: "Search for stocks by name or symbol",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for stock names or symbols"
        }
      },
      required: ["query"]
    }
  }, async ({ query }) => {
    try {
      const results = await searchStocks(query);
      return { 
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Register getMarketOverview tool function
  mcpServer.registerTool("getMarketOverview", {
    description: "Fetch market overview for major indices",
    inputSchema: {
      type: "object",
      properties: {
        indices: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Optional list of indices to fetch (defaults to ['SP500', 'DJI', 'IXIC'])"
        }
      }
    }
  }, async ({ indices }) => {
    try {
      const results = await getMarketOverview(indices);
      return { 
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Check command line arguments to determine transport mode
  const args = process.argv.slice(2);
  if (args.includes('--http')) {
    // HTTP transport mode
    const port = args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1]) : 3000;
    const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : '127.0.0.1';
    
    console.log(`Starting HTTP MCP server on ${host}:${port}`);
    
    // This would use the standard Node.js HTTP server with MCP transport
    // We'll need to handle this appropriately in the actual implementation
  } else {
    // Default stdio transport mode  
    const transport = createStdioServerTransport();
    await mcpServer.connect(transport);
  }
}

main().catch(console.error);