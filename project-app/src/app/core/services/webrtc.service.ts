import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private remoteStreamSubject = new Subject<MediaStream>();
  remoteStream$ = this.remoteStreamSubject.asObservable()

  private remoteTrackHandler: ((stream: MediaStream) => void) | null = null;

  onRemoteTrack(handler: (stream: MediaStream) => void): void {
    this.remoteTrackHandler = handler;
  }

  async getMicrophone(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    return this.localStream;
  }

  createPeerConnection(): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    });
    this.remoteStream = new MediaStream();
    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received', event.track);
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      if (this.remoteStream) {
        this.remoteStreamSubject.next(this.remoteStream);
      }
    };
    return this.peerConnection;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  close(): void {
    this.localStream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.peerConnection?.close();
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
  }
}
