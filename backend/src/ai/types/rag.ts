export interface KnowledgeMetaData {
    title: string;
    source?: string;
    category?: string;
    country?: string;
    city?: string
}

export interface KnowledgeChunk {
    text: string;
    metaData: KnowledgeMetaData;
}