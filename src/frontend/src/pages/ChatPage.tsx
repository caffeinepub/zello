import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Users, MessageSquare, Download, File } from 'lucide-react';
import { useSessionPolling } from '../hooks/useSessionPolling';
import { useTypingSignal } from '../hooks/useTypingSignal';
import ParticipantList from '../components/chat/ParticipantList';
import AttachmentComposer from '../components/chat/AttachmentComposer';
import { formatTimestamp } from '../lib/time';
import { linkify } from '../lib/linkify';
import { createBlobUrl, isImage, isAudio, formatFileSize } from '../lib/attachments';
import InlineError from '../components/feedback/InlineError';
import ThemeToggle from '../components/theme/ThemeToggle';
import type { Message } from '../backend';

interface ChatPageProps {
  code: string;
  displayName: string;
  participantId: string;
  onLeave: () => void;
}

export default function ChatPage({ code, displayName, participantId, onLeave }: ChatPageProps) {
  const [messageInput, setMessageInput] = useState('');
  const [sendError, setSendError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sessionData, isLoading, error, sendMessage, isSending } = useSessionPolling(
    code,
    participantId,
    displayName
  );

  const { handleTyping, clearTyping } = useTypingSignal(code, participantId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionData?.messages]);

  const handleSendMessage = async (text: string, file: File | null) => {
    setSendError('');
    clearTyping();

    try {
      await sendMessage(text || null, file);
      setMessageInput('');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send message');
      // Keep the text input if it failed
      if (text) {
        setMessageInput(text);
      }
    }
  };

  const handleDownloadAttachment = (data: Uint8Array, filename: string, mimeType: string) => {
    // Convert to a new Uint8Array to ensure compatibility with Blob constructor
    const blob = new Blob([new Uint8Array(data)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Group messages with join events
  const renderMessages = () => {
    if (!sessionData?.messages) return null;

    const messages = sessionData.messages;
    const renderedMessages: React.ReactElement[] = [];
    const seenParticipants = new Set<string>();

    messages.forEach((msg: Message, index: number) => {
      // Check if this is a new participant (first message from them)
      if (!seenParticipants.has(msg.sender)) {
        seenParticipants.add(msg.sender);
        
        // Add join notification (except for the first participant)
        if (seenParticipants.size > 1) {
          renderedMessages.push(
            <div key={`join-${msg.sender}`} className="flex justify-center my-4">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 rounded-full text-xs text-muted-foreground border-2 border-primary/20">
                <Users className="inline h-3 w-3 mr-1" />
                {msg.displayName} joined the session
              </div>
            </div>
          );
        }
      }

      // Add the message
      const isCurrentUser = msg.sender === participantId;
      const hasAttachment = !!msg.attachment;
      const hasText = !!msg.textContent;

      renderedMessages.push(
        <div key={`msg-${index}`} className="mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm">
              {msg.displayName}
              {isCurrentUser && (
                <span className="text-xs text-muted-foreground ml-1">(you)</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(msg.timestamp)}
            </span>
          </div>
          <div className={`border-2 rounded-lg px-4 py-2 inline-block max-w-[80%] ${
            isCurrentUser 
              ? 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30' 
              : 'bg-card border-border'
          }`}>
            {hasText && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {linkify(msg.textContent!)}
              </p>
            )}
            {hasAttachment && (
              <div className={hasText ? 'mt-2' : ''}>
                {isImage(msg.attachment!.mimeType) ? (
                  <div className="space-y-2">
                    <img
                      src={createBlobUrl(msg.attachment!.data, msg.attachment!.mimeType)}
                      alt={msg.attachment!.filename}
                      className="max-w-full max-h-64 rounded border-2 border-border"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{msg.attachment!.filename}</span>
                      <Button
                        onClick={() => handleDownloadAttachment(
                          msg.attachment!.data,
                          msg.attachment!.filename,
                          msg.attachment!.mimeType
                        )}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : isAudio(msg.attachment!.mimeType) ? (
                  <div className="space-y-2">
                    <audio
                      src={createBlobUrl(msg.attachment!.data, msg.attachment!.mimeType)}
                      controls
                      className="w-full max-w-sm"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{msg.attachment!.filename}</span>
                      <Button
                        onClick={() => handleDownloadAttachment(
                          msg.attachment!.data,
                          msg.attachment!.filename,
                          msg.attachment!.mimeType
                        )}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded border-2 border-border">
                    <File className="h-8 w-8 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{msg.attachment!.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(msg.attachment!.data.length)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDownloadAttachment(
                        msg.attachment!.data,
                        msg.attachment!.filename,
                        msg.attachment!.mimeType
                      )}
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    });

    return renderedMessages;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border-2 border-primary/30">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                ZELLO
              </h1>
              <p className="text-xs text-muted-foreground">Session: {code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={onLeave}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Leave
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {error && (
            <div className="p-4 border-b-2 border-destructive/20 bg-destructive/5">
              <InlineError message={error} />
            </div>
          )}

          <ScrollArea className="flex-1 px-6 py-4">
            {isLoading && !sessionData ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading messages...
              </div>
            ) : (
              <div>
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t-2 border-primary/20 p-4 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
            {sendError && (
              <div className="mb-3">
                <InlineError message={sendError} />
              </div>
            )}
            <AttachmentComposer
              messageInput={messageInput}
              onMessageInputChange={setMessageInput}
              onSend={handleSendMessage}
              onTyping={handleTyping}
              onClearTyping={clearTyping}
              disabled={isSending}
            />
          </div>
        </div>

        {/* Participants Sidebar */}
        <aside className="w-64 border-l-2 border-primary/20 bg-gradient-to-b from-primary/5 via-secondary/5 to-accent/5 flex flex-col">
          <div className="p-4 border-b-2 border-primary/20">
            <h2 className="font-semibold flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Participants ({sessionData?.participants.length || 0})
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <ParticipantList
              participants={sessionData?.participants || []}
              currentUserId={participantId}
            />
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
