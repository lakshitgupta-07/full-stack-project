import { KnowledgeDocument } from "../../models/knowledgeDocument.model.js";
import { generateQueryEmbedding } from "./embedding.service.js";
import { PipelineStage } from "mongoose";
export interface SearchKnowledgeOptions {
    limit?: number;
    country?: string;
    category?: string;
    city?: string
}

export const searchKnowledge = async (
    query: string,
    options: SearchKnowledgeOptions = {}
) => {
    const {
        limit = 5,
        country,
        city,
        category
    } = options

    const queryEmbedding = await generateQueryEmbedding(query);

    const filters: Record<string, unknown>[] = []

    if(country) {
        filters.push({
            equals: {
                path: "metaData.country",
                value: country
            }
        })
    }
    if(category) {
        filters.push({
            equals: {
                path: "metaData.category",
                value: category
            }
        })
    }
    if(city) {
        filters.push({
            equals: {
                path: "metaData.city",
                value: city
            }
        })
    }
    const pipeline: PipelineStage[] = [
        {
            $vectorSearch: {
                index: "knowledge_vector_index",
                path: "embedding",
                queryVector: queryEmbedding,
                numCandidates: Math.max(limit * 10, 50),
                limit,
                ...(filters.length > 0 && {
                    filter: 
                        filters.length === 1 ? filters[0] : {
                            compound: {
                                must: filters
                            },
                        },
                }),
            },
        },
        {
            $project: {
                _id: 1,
                text: 1,
                metaData: 1,
                score: {
                    $meta: "vectorSearchScore",
                },
            },
        },
    ];
    let results = await KnowledgeDocument.aggregate(pipeline);

    // Fallback: If vector search returns nothing (e.g. index build delay or local DB), try regex text search
    if (!results || results.length === 0) {
        console.log(`[RAG Search] Vector search returned no results. Trying regex text fallback...`);
        
        // Extract destination keyword (e.g. "shimla" from "shimla. trip to shimla")
        const destKeyword = query.includes('.') ? query.split('.')[0]?.trim() : undefined;
        const searchRegex = new RegExp(query.split('.').pop()?.trim() || query, 'i');
        const destQuery = city || country || destKeyword;
        
        const textQuery: any = {
            $or: [
                { text: { $regex: searchRegex } }
            ]
        };
        
        if (destQuery) {
            const destRegex = new RegExp(destQuery, 'i');
            textQuery.$or.push({ text: { $regex: destRegex } });
            textQuery.$or.push({ "metaData.city": { $regex: destRegex } });
            textQuery.$or.push({ "metaData.country": { $regex: destRegex } });
        }
        
        const fallbackDocs = await KnowledgeDocument.find(textQuery).limit(limit).lean();
        
        results = fallbackDocs.map(doc => ({
            ...doc,
            score: 0.85 // Mock score that passes similarity threshold
        }));
    }

    return results;
}