export type CallType = 'audio' | 'video'

export interface IncomingCall {
    callId: string;
    threadId: string;
    callerId: string;
    callerName: string;
    callType: CallType
}