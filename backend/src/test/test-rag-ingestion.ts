import "dotenv/config";

import connectDB from "../db/index.js";
import { addKnowledgeDocument } from "../ai/services/rag/knowledge.service.js";

const run = async () => {
  await connectDB();

  console.log("Starting RAG ingestion...");

  const documents = await addKnowledgeDocument({
    text: `
Japan is one of the most popular travel destinations in Asia.

Tokyo is the capital of Japan and is known for its modern
architecture, shopping districts, restaurants, and nightlife.

Kyoto is known for its traditional Japanese culture,
temples, shrines, gardens, and historic neighborhoods.

Osaka is famous for its food, nightlife, and friendly
atmosphere. Popular foods include takoyaki and okonomiyaki.

Spring is a popular time to visit Japan because of the
cherry blossoms. Autumn is also popular because of the
pleasant weather and fall colors.

Japan has an extensive railway network. The Shinkansen
bullet trains connect major cities such as Tokyo, Kyoto,
and Osaka.

Travelers should consider regional weather, transportation,
accommodation prices, and seasonal crowds when planning
a trip to Japan.
`,
    metaData: {
      title: "Japan Travel Guide",
      source: "internal",
      category: "destination",
      country: "Japan",
    },
  });

  console.log(
    `Inserted ${documents.length} knowledge chunks`,
  );

  for (const document of documents) {
    console.log({
      id: document._id,
      text: document.text,
      embeddingDimensions: (await document.embedding)?.length,
    });
  }

  process.exit(0);
};

run().catch((error) => {
  console.error("RAG ingestion failed:", error);
  process.exit(1);
});