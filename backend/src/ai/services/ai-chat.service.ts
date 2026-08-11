import { User } from "../../models/user.model.js";
import { Message } from "../../models/message.model.js";
import { Thread } from "../../models/thread.model.js";
import { buildPrompt } from "./prompt.service.js";
import { GeminiProvider } from "../providers/gemini.provider.js";
import { updateTravelContext } from "./travel-context.service.js";
import { parsedIntent } from "./intent.service.js";

const provider = new GeminiProvider();
function formatAITextToPlainText(rawText: string): string {
  if (!rawText) return "";

  let cleaned = rawText;

  cleaned = cleaned
    .replace(/\*{1,2}(.*?)\*{1,2}/g, "$1") // Bold (**text**) & Italics (*text*)
    .replace(/_{1,2}(.*?)_{1,2}/g, "$1")   // Underlines/Italics (_text_)
    .replace(/`{1,3}(.*?)(`{1,3}|$)/gs, "$1") // Inline/Block Code backticks
    .replace(/^#{1,6}\s*/gm, "")           // Header symbols (# Header -> Header)
    .replace(/^\s*>\s*/gm, "");            // Blockquotes (> text -> text)

  // 2. Insert line breaks before list items or numbered headers embedded in inline text
  // Pattern matches: " 1. ", " 1) ", " Step 1:", " Day 1:", " - ", " * "
  const listBoundaryRegex = /(?<=\S)\s+(?=(?:\d+[\.\)]|[A-Za-z]+\s+\d+:|[\-\*•])\s+)/g;
  cleaned = cleaned.replace(listBoundaryRegex, "\n\n");

  // 3. Normalize bullet points to a single consistent style
  cleaned = cleaned.replace(/^\s*[\*\-\•]\s+/gm, "• ");

  // 4. Split text into lines, trim each, and rebuild proper paragraph gaps
  const lines = cleaned.split("\n").map((line) => line.trim());
  
  const processedLines: string[] = [];
  let prevWasEmpty = false;

  for (const line of lines) {
    if (line === "") {
      if (!prevWasEmpty && processedLines.length > 0) {
        processedLines.push(""); // Add single empty line between sections
        prevWasEmpty = true;
      }
    } else {
      processedLines.push(line);
      prevWasEmpty = false;
    }
  }

  return processedLines.join("\n").trim();
}

export const reply = async (threadId: string, onChunk: (messageId: string, chunk: string) => void) => {
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
  const latestUserMessage = [...messages].reverse().find(message => {
    const sender = message.sender as any;
    return !sender.isAI;
  })
  if(latestUserMessage?.textMessage) {
    const intentResult = await parsedIntent(latestUserMessage.textMessage)
    latestUserMessage.intent = intentResult.intent
    await updateTravelContext(
      threadId,
      latestUserMessage.textMessage
    )
    await latestUserMessage.save()
  }

  //const travelContext = thread.travelContext ?? {};
  const updatedThread = await Thread.findById(threadId);
  if(!updatedThread) {
    throw new Error("Thread not found");
  }
  const prompt = buildPrompt(
    history,
    undefined,
    updatedThread.travelContext ?? {}
  )
  //const prompt = buildPrompt(history);
  //const aiText = await provider.generate(prompt);
  //const refinedAiText = formatAITextToPlainText(aiText);

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

  const aiText = await provider.generateStream(
    prompt, 
    (chunk) => {
      onChunk(
        aiMessage._id.toString(), 
        chunk
      )
    }
  )
  aiMessage.textMessage = formatAITextToPlainText(aiText)
  await aiMessage.save()

  thread.lastMessage = aiMessage._id;
  thread.lastMessageAt = new Date();
  await thread.save();

  return await Message.findById(aiMessage._id)
    .populate("sender", "username avatar isAI")
    .populate("receiver", "username avatar");
};
