import { chunkText } from "../ai/services/rag/chunk.service.js";

const text = `
Japan is a popular travel destination.

Tokyo is a large metropolitan city with many attractions.

Kyoto is known for its temples and traditional culture.

Osaka is famous for food and nightlife.

The best time to visit Japan depends on the region and activities.
`;

const chunks = chunkText(text, {
  chunkSize: 100,
  overlap: 20,
});

console.log(chunks);
console.log("Total chunks:", chunks.length);