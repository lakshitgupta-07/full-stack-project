import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const client = new Client({
    name: "mcp-test-client",
    version: "1.0.0",
});

const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/ai/services/mcp/server.ts"],
});

await client.connect(transport);

const tools = await client.listTools();

console.log("Available MCP tools:");

for (const tool of tools.tools) {
    console.log(
        `- ${tool.name}: ${tool.description}`
    );
}

const result = await client.callTool({
    name: "get_weather",
    arguments: {
        location: "Kufri",
    },
});

console.log("\nWeather result:");
console.log(JSON.stringify(result, null, 2));

await client.close();