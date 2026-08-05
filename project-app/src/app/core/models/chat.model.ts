export interface ChatAvatar {
    url: string;
    publicId: string;
}

export interface ChatUser {
    _id: string;
    username: string;
    avatar: ChatAvatar;
}

export interface Thread {
  _id: string;
  participants: ChatUser[];
  createdBy: ChatUser;
  status: "pending" | "active";
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMedia {
  url: string;
  publicId: string;
}

export interface ChatMessage {
  _id: string;
  sender: ChatUser;
  receiver: ChatUser;
  textMessage: string;
  image: ChatMedia | null;
  video?: ChatMedia | null;
  audio?: ChatMedia | null
  threadId: string;
  createdAt: string;
  status: | "sending" | "sent" | "delivered" | "read" | "failed"
}