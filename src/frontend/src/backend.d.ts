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
export type CreateSessionResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: BackendError;
};
export interface SessionData {
    participants: Array<Participant>;
    messages: Array<Message>;
}
export interface Attachment {
    data: Uint8Array;
    mimeType: string;
    filename: string;
}
export enum BackendError {
    participantIdEmpty = "participantIdEmpty",
    displayNameEmpty = "displayNameEmpty"
}
export interface backendInterface {
    createSession(participantId: string, displayName: string): Promise<CreateSessionResult>;
    getSessionData(code: string): Promise<SessionData>;
    joinSession(code: string, participantId: string, displayName: string): Promise<void>;
    sendMessage(code: string, participantId: string, content: string | null, displayName: string, attachment: Attachment | null): Promise<void>;
    updateTypingIndicator(code: string, participantId: string): Promise<void>;
}
