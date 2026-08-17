import type { Client } from "@modelcontextprotocol/client";

export async function getGeminiMcpTools(client: Client) {
    const response = await client.listTools();

    return response.tools.map((tool) => ({
        name: tool.name,
        description: tool.description ?? "",
        parametersJsonSchema: tool.inputSchema,
    }));
}