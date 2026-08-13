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
    return KnowledgeDocument.aggregate(pipeline)
}