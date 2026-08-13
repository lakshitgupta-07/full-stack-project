import { getClient } from "../../../config/createClient.js";
import { retry } from "../../../utils/apiRetry.js";

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

export const generateDocumentEmbedding = async(
    text: string
): Promise<number[]> => {
    if(!text.trim()) {
        throw new Error("Cannot generate embedding for empty text");
    }

    const ai = getClient();
    const response = await retry(
        () =>
            ai.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: text,
                config: {
                    taskType: "RETRIEVAL_DOCUMENT",
                },
            }),
            {
                retries: 2,
                delay: 1000,
            }
    )
    const embedding = response.embeddings?.[0].values;
    if(!embedding?.length) {
        throw new Error("Gemini returned an empty embedding")
    }
    return embedding
}

export const generateQueryEmbedding = async(
    query: string
): Promise<number[]> => {
    if(!query.trim()) {
        throw new Error("Cannot generate embedding for empty query")
    }

    const ai = getClient();
    const response = await retry(
        () => 
            ai.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: query,
                config: {
                    taskType: "RETRIEVAL_QUERY",
                }
            }),
        {
            retries: 2,
            delay: 1000
        },
    )
    const embedding = response.embeddings?.[0]?.values;

    if(!embedding?.length) {
        throw new Error("Gemini returned an empty query embedding")
    }
    return embedding
}