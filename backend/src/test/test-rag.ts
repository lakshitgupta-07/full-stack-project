import "dotenv/config";

import connectDB from "../db/index.js";
import { searchKnowledge } from "../ai/services/rag/vector-search.service.js";

const run = async () => {
  await connectDB();

  console.log("Searching knowledge...");

  const results = await searchKnowledge(
    "What is the best time to visit Japan?",
    {
      limit: 3,
    },
  );

  console.dir(results, {
    depth: null,
  });

  process.exit(0);
};

run().catch((error) => {
  console.error("RAG search failed:", error);
  process.exit(1);
});