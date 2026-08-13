import { inject, Injectable, signal } from '@angular/core';
import { Thread, ChatMessage, ChatMedia } from '../models/chat.model';
import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  threads = signal<Thread[]>([]);

  selectedThread = signal<Thread | null>(null);

  messages = signal<ChatMessage[]>([]);

  search = signal('');

  typingUsers = signal<Record<string, string>>({})

  image = signal<ChatMedia>

  video = signal<ChatMedia>

  audio = signal<ChatMedia>
  
  private authState = inject(AuthStateService)

  setThread(threads: Thread[]) {
    this.threads.set(threads)
  }

  setTyping(threadId: string, username: string) {
    this.typingUsers.update(users => ({
      ...users,
      [threadId]: username
    }))
  }

  removeTyping(threadId: string) {
    this.typingUsers.update(users => {
      const updated = {...users};
      delete updated[threadId]
      return updated
    })
  }

  addThread(thread: Thread) {
    this.threads.update(current => {
      const exists = current.some(t => t._id === thread._id) 
      if(exists) {
        return current
      }
      return [thread, ...current];
    });
  }

  updateThread(updated: Thread) {
    this.threads.update(current => {
      const index = current.findIndex(
        thread=> thread._id === updated._id
      );
      if(index===-1) {
        return [
          updated, ...current
        ];
      };
      return current.map(t => t._id === updated._id ? updated : t);
    });
    if (this.selectedThread()?._id === updated._id) {
      this.selectedThread.set(updated);
    }
  }

  selectThread(thread: Thread) {
    this.selectedThread.set(thread)
  }
  
  setMessage(messages: ChatMessage[]) {
    this.messages.set(messages)
  }
  addMessage(message: ChatMessage) {
    this.messages.update(messages => {
      const exists = messages.some(m => m._id === message._id);
      if (exists) {
        return messages;
      }
      return [...messages, message];
    });
  }
  addTemporaryMessage(message: ChatMessage) {
    this.messages.update(messages => [...messages, message])
  }
  replaceTemporaryMessage(tempId: string, message: ChatMessage) {
    this.messages.update(messages => messages.map(m => m._id === tempId ? message : m))
  }
  markMessageSendFailed(tempId: string) {
    this.messages.update(messages => messages.map(m => m._id === tempId ? {
      ...m,
      status: "failed"
    }
    :
    m))
  }
  appendAiStream(
    messageId: string,
    threadId: string,
    chunk: string
  ) {
    this.messages.update(messages => {
      const existingMessage = messages.find(
        message => message._id === messageId
      );
      if(existingMessage) {
        return messages.map(message => 
          message._id === messageId ? {
            ...message,
            textMessage: (message.textMessage ?? "") + chunk
          }: message
        );
      }
      const currentUser = this.authState.user
      if(!currentUser) return messages;

      const aiMessage: ChatMessage = {
        _id: messageId,
        threadId, 
        sender: {
          _id: "ai",
          username: "Travel AI",
          avatar: {
            url: "",
            publicId: ""
          },
          isAI: true
        },
        receiver: {
          _id: currentUser._id,
          username: currentUser.username,
          avatar: {
            url: currentUser.avatar?.url ?? "",
            publicId: currentUser.avatar?.publicId ?? "",
          },
          isAI: true
        },
        textMessage: chunk,
        image: {
          url: "",
          publicId: ""
        },
        video: {
          url: "",
          publicId: ""
        },
        audio: {
          url: "",
          publicId: ""
        },
        isAI: true,
        status: "sent",
        createdAt: new Date()
      }
      return [...messages, aiMessage]
    })
  }
  finishAiStream(message: ChatMessage) {
    this.messages.update(messages => {
      const exists = messages.some(
        existing => existing._id === message._id
      );
      if(exists) {
        return messages.map(existing => 
          existing._id === message._id ? message : existing
        )
      }
      return [...messages, message]
    })
  }
  clearCurrentConversation(): void {
    this.messages.set([])
  }
}