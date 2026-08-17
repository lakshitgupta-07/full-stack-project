import { KnowledgeDocument } from "../../models/knowledgeDocument.model.js";
import { generateQueryEmbedding } from "./embedding.service.js";
import { PipelineStage } from "mongoose";

const MIN_VECTOR_SCORE = 0.7;
export interface SearchKnowledgeOptions {
  limit?: number;
  country?: string;
  category?: string;
  city?: string;
}

export const searchKnowledge = async (
  query: string,
  options: SearchKnowledgeOptions = {},
) => {
  const { limit = 5, country, city, category } = options;
  const candidateMultiplier = 10;

  const numCandidates = Math.max(limit * candidateMultiplier, 50);
  const queryEmbedding = await generateQueryEmbedding(query);

  const filters: Record<string, unknown>[] = [];

  if (country) {
    filters.push({
      equals: {
        path: "metaData.country",
        value: country,
      },
    });
  }
  if (category) {
    filters.push({
      equals: {
        path: "metaData.category",
        value: category,
      },
    });
  }
  if (city) {
    filters.push({
      equals: {
        path: "metaData.city",
        value: city,
      },
    });
  }

  const pipeline: PipelineStage[] = [
    {
      $vectorSearch: {
        index: "knowledge_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates,
        limit,

        ...(filters.length > 0 && {
          filter:
            filters.length === 1
              ? filters[0]
              : {
                  compound: {
                    must: filters,
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
        source: {
          $literal: "vector",
        },
      },
    },
  ];
  let results = await KnowledgeDocument.aggregate(pipeline);

  results = results.filter((result) => result.score >= MIN_VECTOR_SCORE);
  if (!results || results.length === 0) {
    console.log(
      "[RAG Search] Vector search returned no results. Trying text fallback...",
    );

    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const queryParts = query
      .split(".")
      .map((part) => part.trim())
      .filter(Boolean);

    const searchText = queryParts.at(-1) || query;

    const searchRegex = new RegExp(escapeRegex(searchText), "i");

    const orConditions: Record<string, unknown>[] = [
      {
        text: {
          $regex: searchRegex,
        },
      },
    ];

    if (city) {
      const cityRegex = new RegExp(escapeRegex(city), "i");

      orConditions.push({
        "metaData.city": {
          $regex: cityRegex,
        },
      });
    }

    if (country) {
      const countryRegex = new RegExp(escapeRegex(country), "i");

      orConditions.push({
        "metaData.country": {
          $regex: countryRegex,
        },
      });
    }

    const fallbackFilter: Record<string, unknown> = {
      $or: orConditions,
    };

    if (country) {
      fallbackFilter["metaData.country"] = country;
    }

    if (city) {
      fallbackFilter["metaData.city"] = city;
    }

    if (category) {
      fallbackFilter["metaData.category"] = category;
    }

    const fallbackDocs = await KnowledgeDocument.find(fallbackFilter)
        .select({
        _id: 1,
        text: 1,
        metaData: 1,
        })
      .limit(limit)
      .lean();

    results = fallbackDocs.map((doc) => ({
      ...doc,
      score: 0,
      source: "keyword",
    }));
  }

  return results;
};
