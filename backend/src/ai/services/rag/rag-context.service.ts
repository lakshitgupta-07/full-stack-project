import { TravelContext, AIMessage } from "../../types/ai-message.js";
import { searchKnowledge } from "./vector-search.service.js";
import { addKnowledgeDocument } from "./knowledge.service.js";
import { GeminiProvider } from "../../providers/gemini.provider.js";
import { resolveLocation } from "./locationResolver.service.js";

const RAG_SIMILARITY_THRESHOLD = 0.65;
const provider = new GeminiProvider();

export const buildRAGContext = async (
  query: string,
  travelContext: TravelContext,
): Promise<string> => {
  // const destinations = travelContext.destination?.trim() || undefined;
  // const ragQuery = destinations ? `${destinations}. ${query}` : query;
  const extractedDestination = travelContext.destination?.trim() || undefined;

  let destinations: string | undefined;
  let locationResolved = false

  if (extractedDestination) {
    const resolvedDestination = await resolveLocation(extractedDestination);

    // destinations = resolvedDestination ?? extractedDestination;
    if(resolvedDestination.resolved && resolvedDestination.location) {
      locationResolved = true
      destinations = resolvedDestination.location
    }
  } else {
    destinations = extractedDestination;
  }
  const ragQuery = destinations ? `${destinations}. ${query}` : query;

  let results = await searchKnowledge(ragQuery, {
    limit: 5,
  });

  const filterResults = (items: any[]) => {
    return items.filter((result) => {
      if (
        typeof result.score !== "number" ||
        result.score < RAG_SIMILARITY_THRESHOLD
      ) {
        return false;
      }

      if (destinations) {
        const destLower = destinations.toLowerCase();

        if (result.metaData?.country) {
          const countryLower = result.metaData.country.toLowerCase();
          if (
            !destLower.includes(countryLower) &&
            !countryLower.includes(destLower)
          ) {
            return false;
          }
        }

        if (result.metaData?.city) {
          const cityLower = result.metaData.city.toLowerCase();
          if (
            !destLower.includes(cityLower) &&
            !cityLower.includes(destLower)
          ) {
            return false;
          }
        }
      }

      return true;
    });
  };

  let relevantResults = filterResults(results);

  // If no relevant results are found and a destination is specified, auto-generate and ingest guide
  if (!relevantResults.length && destinations && !locationResolved) {
    console.log(
      `[RAG Auto-Ingest] No results found. Ingesting new travel guide for: ${destinations}`,
    );
    const messages: AIMessage[] = [
      {
        role: "system",
        content:
          "You are a professional travel writer. Generate a detailed, comprehensive travel guide for the requested city or country. Include highlights, key attractions, weather, culture, food, and logistics/practical tips.",
      },
      {
        role: "user",
        content: `Create a detailed travel guide for: ${destinations}`,
      },
    ];
    try {
      const generatedText = await provider.generate(messages);
      if (generatedText && generatedText.trim()) {
        await addKnowledgeDocument({
          text: generatedText,
          metaData: {
            title: `${destinations} Travel Guide`,
            source: "auto-generated",
            category: "destination",
            country: destinations,
            city: destinations,
          },
        });
        console.log(
          `[RAG Auto-Ingest] Successfully ingested new travel guide for: ${destinations}`,
        );

        // Re-query vector search
        results = await searchKnowledge(ragQuery, { limit: 5 });
        relevantResults = filterResults(results);
      }
    } catch (err) {
      console.error(
        "[RAG Auto-Ingest] Failed to auto-generate travel guide:",
        err,
      );
    }
  }

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

  if (!relevantResults.length) return "";

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
