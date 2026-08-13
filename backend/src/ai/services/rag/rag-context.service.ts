import { TravelContext } from "../../types/ai-message.js";
import { searchKnowledge } from "./vector-search.service.js";

const RAG_SIMILARITY_THRESHOLD = 0.65

export const buildRAGContext = async (query: string, travelContext: TravelContext): Promise<string> => {
  const destinations = travelContext.destination?.trim() || undefined;
  const ragQuery = destinations ? `${destinations}. ${query}` : query
  const results = await searchKnowledge(ragQuery, {
    limit: 5,
    city: destinations
  });

  const relevantResults = results.filter(
    (results) => typeof results.score === "number" && results.score >= RAG_SIMILARITY_THRESHOLD,
  )
  console.log("[RAG]", {
    query,
    destinations,
    ragQuery,
    results: results.map((result) => ({
      score: result.score,
      city: result.metaData?.city,
      country: result.metaData?.country,
    })),
    relevantResults: relevantResults.length,
  });

  if(!relevantResults.length) return ""

  if (!results.length) {
    return "";
  }

  return relevantResults
    .map(
      (result, index) => ` 
      [Knowledge Source ${index + 1}] 
      Location: ${result.metaData?.city ?? "Unknown"}
      Country: ${result.metaData?.country ?? "Unknown"}
      ${result.text} `,
    )
    .join("\n");
};
