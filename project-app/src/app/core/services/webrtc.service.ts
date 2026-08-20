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
  remoteStream$ = this.remoteStreamSubject.asObservable();

  private iceCandidateSubject = new Subject<RTCIceCandidate>();
  iceCandidate$ = this.iceCandidateSubject.asObservable();

  private pendingIceCandidates: RTCIceCandidateInit[] = [];

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

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate generated');
        this.iceCandidateSubject.next(event.candidate);
      }
    };

    return this.peerConnection;
  }

  async createCallOffer(receiverId: string): Promise<RTCSessionDescriptionInit> {
    this.localStream = await this.getMicrophone();
    this.createPeerConnection();

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);
    return offer;
  }

  async handleCallAccepted(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(answer);
    for (const candidate of this.pendingIceCandidates) {
      await this.peerConnection.addIceCandidate(candidate);
    }
    this.pendingIceCandidates = [];
  }

  async handleIncomingCall(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    this.createPeerConnection();
    this.localStream = await this.getMicrophone();

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    await this.peerConnection!.setRemoteDescription(offer);
    for (const candidate of this.pendingIceCandidates) {
      await this.peerConnection!.addIceCandidate(candidate);
    }
    this.pendingIceCandidates = [];

    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    return answer;
  }

  async handleRemoteIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      this.pendingIceCandidates.push(candidate);
      return;
    }
    if (!this.peerConnection.remoteDescription) {
      this.pendingIceCandidates.push(candidate);
      console.log('ICE candidate queued');
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(candidate);
      console.log('Remote ICE candidate added');
    } catch (error) {
      console.error('Failed to add remote ICE candidate', error);
    }
  }
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  close(): void {
    this.localStream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.peerConnection?.close();
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.pendingIceCandidates = [];
  }
}
