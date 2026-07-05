#!/usr/bin/env node

// Import necessary modules
import { createMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createStdioServerTransport, createHttpServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fetchMarketData } from './yfinance.js';

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
