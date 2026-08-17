import { McpServer } from "@modelcontextprotocol/server"
import { serveStdio } from "@modelcontextprotocol/server/stdio"
import { weatherTool } from "./tools/weather.tool.js"

function createMcpServer() {
    const server = new McpServer({
        name: "travel-mcp-server",
        version: "1.0.0",
    });

    server.registerTool(
        weatherTool.name,
        {
            description: weatherTool.description,
            inputSchema: weatherTool.inputSchema
        },
        weatherTool.handler
    );
    return server
}

await serveStdio(createMcpServer)

console.error("Travel MCP server running")