import { Injectable, signal, computed } from '@angular/core';
import { Thread, ChatMessage } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  threads = signal<Thread[]>([]);

  selectedThread = signal<Thread | null>(null);

  messages = signal<ChatMessage[]>([]);

  search = signal('');

  typingUsers = signal<Record<string, string>>({})

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
}