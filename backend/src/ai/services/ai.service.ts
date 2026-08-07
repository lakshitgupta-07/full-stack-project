import { Message } from "../../models/message.model.js";
import { buildPrompt } from "./prompt.service.js";
import { dispatcher } from "../index.js";
import { IUser } from "../../models/user.model.js";

export const generateResponse = async (
  threadId: string,
  latestMessage: string,
) => {
  const history = await Message.find({
    threadId,
  })
    .populate<{ sender: IUser }>("sender")
    .sort({
      createdAt: 1,
    })
    .limit(20)
    .populate("sender");

  const prompt = buildPrompt(
    history.map((message) => ({
      senderIsAI: message.sender.isAI,
      text: message.textMessage,
    })),
    latestMessage,
  );
  return dispatcher.ask(prompt);
};
