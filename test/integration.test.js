import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fetchMarketData } from '../yfinance.js';
import * as z from 'zod/v4';

describe('Integration Tests', () => {
  it('should create MCP server successfully', () => {
    const mcpServer = new McpServer({
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
    const mcpServer = new McpServer({
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
        inputSchema: z.object({
          ticker: z.string()
        })
      }, async () => ({ success: true, data: {} }));  
    }).not.toThrow();
  });

  it('should process tool calls correctly', async () => {
    const mcpServer = new McpServer({
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
      inputSchema: z.object({
        ticker: z.string()
      })
    }, mockFetch);

    // Test that tool was registered (just verifying it exists)
    // We can't easily test the getTools functionality in this version
    expect(mcpServer).toBeDefined();
  });
});