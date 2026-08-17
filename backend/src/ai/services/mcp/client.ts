import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import path from "node:path";

let client: Client | null = null;

export async function getMcpClient(): Promise<Client> {
  if (client) {
    return client;
  }

  client = new Client({
    name: "travel-ai-client",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: path.resolve("node_modules/.bin/tsx.cmd"),
    args: ["src/ai/services/mcp/server.ts"],
  });

  await client.connect(transport);

  return client;
}