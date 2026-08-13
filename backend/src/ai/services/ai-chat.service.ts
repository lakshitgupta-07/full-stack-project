import { User } from "../../models/user.model.js";
import { Message } from "../../models/message.model.js";
import { Thread } from "../../models/thread.model.js";
import { buildPrompt } from "./prompt.service.js";
import { GeminiProvider } from "../providers/gemini.provider.js";
import { updateTravelContext } from "./travel-context.service.js";
import { parsedIntent } from "./intent.service.js";
import { summarizeConversation } from "./conversation-summary.service.js";
import { saveAIUsage } from "./ai-usage.service.js";
import { buildRAGContext } from "./rag/rag-context.service.js";

const provider = new GeminiProvider();
function formatAITextToPlainText(rawText: string): string {
  if (!rawText) return "";

  let cleaned = rawText;
  cleaned = cleaned.replace(/\r\n/g, "\n");

  
  cleaned = cleaned.replace(/^\s*#{1,6}\s+(.*)$/gm, "\n\n$1\n\n");

 
  cleaned = cleaned.replace(/^[ \t]*(?:[-*+•]|\d+[.)])\s+/gm, "\n• ");

  const inlineListBoundaryRegex =
    /(?<=[.!?:;])\s+(?=(?:\d+[.)]|[A-Za-z]+\s+\d+:|[-*+•])\s+)/g;
  cleaned = cleaned.replace(inlineListBoundaryRegex, "\n\n");

  cleaned = cleaned
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") 
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") 
    .replace(/^\[([^\]]+)\]:\s*\S+.*$/gm, "") 
    .replace(/~~(.*?)~~/g, "$1") 
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1") 
    .replace(/\*\*(.*?)\*\*/g, "$1") 
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "$1") 
    .replace(/__(.*?)__/g, "$1") 
    .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, "$1")
    .replace(/```([\s\S]*?)```/g, "$1") 
    .replace(/`([^`]*)`/g, "$1") 
    .replace(/^\s*>\s?/gm, "") 
    .replace(/^\s*\|.*\|\s*$/gm, "") 
    .replace(/^\s*[-*_]{3,}\s*$/gm, "");
  cleaned = collapseBlankLines(cleaned);

  return cleaned.trim();
}

function collapseBlankLines(text: string): string {
  const lines = text.split("\n").map((line) => line.trim());
  const result: string[] = [];
  let prevWasEmpty = false;

  for (const line of lines) {
    if (line === "") {
      if (!prevWasEmpty && result.length > 0) {
        result.push("");
      }
      prevWasEmpty = true;
    } else {
      result.push(line);
      prevWasEmpty = false;
    }
  }

  if (result[0] === "") result.shift();
  if (result[result.length - 1] === "") result.pop();

  return result.join("\n");
}


export const reply = async (
  threadId: string,
  onChunk: (messageId: string, chunk: string) => void,
) => {
  const thread = await Thread.findById(threadId);
  if (!thread || !thread.isAI) {
    return null;
  }

  const messages = await Message.find({ threadId })
    .sort({ createdAt: 1 })
    .populate("sender", "username avatar isAI");

  const history = messages.map((message) => {
    const sender = message.sender as any;
    return {
      senderIsAI: Boolean(sender?.isAI),
      text: message.textMessage,
    };
  });
  const latestUserMessage = [...messages].reverse().find((message) => {
    const sender = message.sender as any;
    return !sender.isAI;
  });
  let latestIntent: string | null = null;
  if (latestUserMessage?.textMessage) {
    const intentResult = await parsedIntent(latestUserMessage.textMessage);
    latestIntent = intentResult.intent;
    latestUserMessage.intent = latestIntent;
    await updateTravelContext(threadId, latestUserMessage.textMessage);
    await latestUserMessage.save();
  }

  const updatedThread = await Thread.findById(threadId);
  if (!updatedThread) {
    throw new Error("Thread not found");
  }
  const RAG_INTENTS = new Set([
    "destination_recommendation",
    "general_travel",
    "itinerary_generation",
    "destination_comparison",
    "hotel_recommendation",
    "attraction_recommendation",
    "travel_question",
    //"weather_query",
    "visa_information",
    "packing_recommendation",
  ]);

  const shouldUseRAG = latestIntent !== null && RAG_INTENTS.has(latestIntent);

  const ragContext =
    shouldUseRAG && latestUserMessage?.textMessage
      ? await buildRAGContext(latestUserMessage.textMessage, updatedThread.travelContext ?? {})
      : "";
  console.log(ragContext);

  const prompt = buildPrompt(
    history,
    undefined,
    updatedThread.travelContext ?? {},
    updatedThread.conversationSummary,
    ragContext,
  );

  const aiUser = await User.findOne({ isAI: true });
  if (!aiUser) {
    throw new Error("AI User missing");
  }

  const userId = thread.participants.find(
    (id) => id.toString() !== aiUser._id.toString(),
  );
  if (!userId) {
    throw new Error("Thread participant missing");
  }

  const aiMessage = await Message.create({
    threadId,
    sender: aiUser._id,
    receiver: userId,
    textMessage: "",
  });

  const aiResult = await provider.generateStream(prompt, (chunk) => {
    onChunk(aiMessage._id.toString(), chunk);
  });
  const formattedResult = formatAITextToPlainText(aiResult.text)

  aiMessage.textMessage = formattedResult
  await aiMessage.save();

  // Save the AI usage
  // console.log(`[Token Usage Test] Preparing to save AI usage for thread: ${threadId}, message: ${aiMessage._id}`);
  // console.log(`[Token Usage Test] Token details - Input: ${aiResult.usage.inputToken}, Output: ${aiResult.usage.outputToken}, Total: ${aiResult.usage.totalToken}`);
  try {
    const savedUsage = await saveAIUsage({
      threadId,
      userId: userId.toString(),
      messageId: aiMessage._id.toString(),
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
      inputToken: aiResult.usage.inputToken,
      outputToken: aiResult.usage.outputToken,
      totalToken: aiResult.usage.totalToken,
    });
    // console.log(`[Token Usage Test] Successfully saved usage record in DB. ID: ${savedUsage._id}`);
  } catch (err) {
    console.error("[Token Usage Test] Failed to save AI usage to DB:", err);
  }

  thread.lastMessage = aiMessage._id;
  thread.lastMessageAt = new Date();
  await thread.save();

  return await Message.findById(aiMessage._id)
    .populate("sender", "username avatar isAI")
    .populate("receiver", "username avatar");
};
