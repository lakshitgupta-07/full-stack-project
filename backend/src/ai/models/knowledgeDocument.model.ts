import mongoose, { Schema, model } from "mongoose";
import type { KnowledgeMetaData } from "../types/rag.js";

export interface IKnowledgeDocument {
    documentId: string;
    text: string;
    metaData: KnowledgeMetaData;
    embedding?: number[];
    createdAt: Date;
    updatedAt: Date;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument> (
    {
        documentId: {
            type: String,
            required: true,
            index: true
        },
        text: {
            type: String,
            required: true
        },
        metaData: {
            title: {
                type: String,
                required: true
            },
            source: String,
            category: String,
            country: String,
            city: String
        },
        embedding: {
            type: [Number],
            default: undefined,
        },
    },
    {
        timestamps: true,
    },
);

export const KnowledgeDocument = model<IKnowledgeDocument>("KnowledgeDocument", KnowledgeDocumentSchema);