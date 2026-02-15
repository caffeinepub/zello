import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Participant {
    id: string;
    displayName: string;
    lastTypingTimestamp?: bigint;
    isTyping: boolean;
}
export interface Message {
    displayName: string;
    sender: string;
    timestamp: bigint;
    attachment?: Attachment;
    textContent?: string;
}
export interface SessionData {
    participants: Array<Participant>;
    messages: Array<Message>;
    currentVideoCallUrl?: string;
}
export interface Attachment {
    data: Uint8Array;
    mimeType: string;
    filename: string;
}
export interface backendInterface {
    createSession(participantId: string, displayName: string): Promise<string>;
    getSessionData(code: string): Promise<SessionData>;
    joinSession(code: string, participantId: string, displayName: string): Promise<void>;
    sendMessage(code: string, participantId: string, content: string | null, displayName: string, attachment: Attachment | null): Promise<void>;
    setVideoCallUrl(code: string, url: string): Promise<void>;
    updateTypingIndicator(code: string, participantId: string): Promise<void>;
}
