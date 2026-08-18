import { Injectable } from '@angular/core';

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start(): void;
  stop(): void;
  abort(): void;

  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

@Injectable({
  providedIn: 'root',
})
export class SpeechRecognitionService {
  private recognition: SpeechRecognitionLike | null = null;

  private readonly SpeechRecognition: SpeechRecognitionConstructor | undefined =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  get isSupported(): boolean {
    return !!this.SpeechRecognition;
  }

  start(
    onTranscript: (text: string) => void,
    onEnd?: () => void,
    onError?: (error: string) => void,
  ): void {
    if (!this.SpeechRecognition) {
      onError?.('Speech recognition is not supported by this browser.');
      return;
    }

    this.stop();

    this.recognition = new this.SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN';

    this.recognition.onresult = (event) => {
      let transcript = '';

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript += event.results[i][0].transcript;
      }

      onTranscript(transcript.trim());
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event);

      onError?.(event.error);
    };

    this.recognition.onend = () => {
      onEnd?.();
    };

    this.recognition.start();
  }

  stop(): void {
    if (!this.recognition) {
      return;
    }

    this.recognition.stop();
    this.recognition = null;
  }

  abort(): void {
    if (!this.recognition) {
      return;
    }

    this.recognition.abort();
    this.recognition = null;
  }
}