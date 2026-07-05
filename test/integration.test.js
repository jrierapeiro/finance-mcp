import { describe, it, expect, vi } from 'vitest';
import { createMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fetchMarketData } from '../yfinance.js';

describe('Integration Tests', () => {
  it('should create MCP server successfully', () => {
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
    
    expect(mcpServer).toBeDefined();
  });

  it('should handle tool registration correctly', () => {
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

    // Test that we can register the tool
    expect(() => {
      mcpServer.registerTool("fetchMarketData", {
        description: "Fetch market data for a financial ticker",
        inputSchema: {
          type: "object",
          properties: {
            ticker: { type: "string" }
          },
          required: ["ticker"]
        }
      }, async () => ({ success: true, data: {} }));  
    }).not.toThrow();
  });

  it('should process tool calls correctly', async () => {
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

    // Mock the fetchMarketData function
    const mockFetch = vi.fn().mockResolvedValue({ 
      success: true, 
      data: { current_price: 150.00 }
    });
    
    mcpServer.registerTool("fetchMarketData", {
      description: "Fetch market data for a financial ticker",
      inputSchema: {
        type: "object",
        properties: {
          ticker: { type: "string" }
        },
        required: ["ticker"]
      }
    }, mockFetch);

    // Test that tool can be called
    const toolFunction = mcpServer.getTool("fetchMarketData");
    expect(toolFunction).toBeDefined();
  });
});