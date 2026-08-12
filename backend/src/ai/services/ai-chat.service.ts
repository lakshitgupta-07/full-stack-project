import { User } from "../../models/user.model.js";
import { Message } from "../../models/message.model.js";
import { Thread } from "../../models/thread.model.js";
import { buildPrompt } from "./prompt.service.js";
import { GeminiProvider } from "../providers/gemini.provider.js";
import { updateTravelContext } from "./travel-context.service.js";
import { parsedIntent } from "./intent.service.js";
import { summarizeConversation } from "./conversation-summary.service.js";

const provider = new GeminiProvider();
function formatAITextToPlainText(rawText: string): string {
  if (!rawText) return "";

  let cleaned = rawText;

  // 1. Strip markdown syntax, keeping only the underlying text
  cleaned = cleaned
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")   // Images: ![alt](url) -> alt
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")    // Links: [text](url) -> text
    .replace(/~~(.*?)~~/g, "$1")                // Strikethrough: ~~text~~
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1")        // Bold+italic: ***text***
    .replace(/\*\*(.*?)\*\*/g, "$1")            // Bold: **text**
    .replace(/\*(.*?)\*/g, "$1")                // Italics: *text*
    .replace(/__(.*?)__/g, "$1")                // Bold underline: __text__
    .replace(/_(.*?)_/g, "$1")                  // Italics underline: _text_
    .replace(/```([\s\S]*?)```/g, "$1")         // Fenced code blocks
    .replace(/`([^`]*)`/g, "$1")                // Inline code
    .replace(/^#{1,6}\s+/gm, "")                // Headers: # Header -> Header
    .replace(/^\s*>\s?/gm, "")                  // Blockquotes
    .replace(/^\s*[-*_]{3,}\s*$/gm, "");        // Horizontal rules: ---, ***, ___

  // 2. Insert line breaks before list items / step markers embedded inline
  //    Matches: " 1. ", " 1) ", " Step 1:", " Day 1:", " - ", " * ", " • "
  const listBoundaryRegex =
    /(?<=\S)\s+(?=(?:\d+[.)]|[A-Za-z]+\s+\d+:|[-*•])\s+)/g;
  cleaned = cleaned.replace(listBoundaryRegex, "\n\n");

  // 3. Normalize all bullet markers to a single style
  cleaned = cleaned.replace(/^\s*[*\-•]\s+/gm, "• ");

  // 4. Collapse excess blank lines and trim each line
  cleaned = collapseBlankLines(cleaned);

  return cleaned.trim();
}

/**
 * Trims each line and collapses runs of blank lines down to a single
 * blank line, so paragraphs are separated consistently.
 */
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

  return result.join("\n");
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
  if (latestUserMessage?.textMessage) {
    const intentResult = await parsedIntent(latestUserMessage.textMessage)
    latestUserMessage.intent = intentResult.intent
    await updateTravelContext(
      threadId,
      latestUserMessage.textMessage
    )
    await latestUserMessage.save()
  }

  const updatedThread = await Thread.findById(threadId);
  if (!updatedThread) {
    throw new Error("Thread not found");
  }
  const prompt = buildPrompt(
    history,
    undefined,
    updatedThread.travelContext ?? {}
  )

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
  const formattedText = formatAITextToPlainText(aiText)
  aiMessage.textMessage = formattedText
  await aiMessage.save()

  thread.lastMessage = aiMessage._id;
  thread.lastMessageAt = new Date();
  await thread.save();

  return await Message.findById(aiMessage._id)
    .populate("sender", "username avatar isAI")
    .populate("receiver", "username avatar");
};
