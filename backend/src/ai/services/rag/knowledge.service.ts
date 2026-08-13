import { KnowledgeDocument } from "../../models/knowledgeDocument.model.js";
import { chunkText } from "./chunk.service.js";
import { generateDocumentEmbedding } from "./embedding.service.js";
import crypto from "node:crypto"
import type { KnowledgeMetaData } from "../../types/rag.js";

interface AddKnowledgeDocumentParams {
    text: string;
    metaData: KnowledgeMetaData;
}

export const addKnowledgeDocument = async ({
    text,
    metaData,
}: AddKnowledgeDocumentParams) => {
    if(!text.trim()) {
        throw new Error("Knowledge document cannot be empty")
    }

    const chunks = chunkText(text, {
        chunkSize: 500,
        overlap: 100
    })

    if(!chunks.length) {
        throw new Error("No Chunks generated from document");
    }

    const documents = [];
    const documentId = crypto.randomUUID();
    for(const chunk of chunks) {
        const embedding = await generateDocumentEmbedding(chunk);

        documents.push({
            documentId,
            text: chunk,
            metaData,
            embedding
        })
    }
    const inserted = await KnowledgeDocument.insertMany(documents);
    return inserted
}