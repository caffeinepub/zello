import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { LogOut, Users, MessageSquare, Video, ExternalLink, Download, Image as ImageIcon, File } from 'lucide-react';
import { useSessionPolling } from '../hooks/useSessionPolling';
import { useTypingSignal } from '../hooks/useTypingSignal';
import ParticipantList from '../components/chat/ParticipantList';
import AttachmentComposer from '../components/chat/AttachmentComposer';
import { formatTimestamp } from '../lib/time';
import { linkify } from '../lib/linkify';
import { createBlobUrl, isImage, formatFileSize } from '../lib/attachments';
import InlineError from '../components/feedback/InlineError';
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
  const [videoCallUrl, setVideoCallUrl] = useState('');
  const [videoCallDialogOpen, setVideoCallDialogOpen] = useState(false);
  const [videoCallError, setVideoCallError] = useState('');
  const [isSettingVideoCall, setIsSettingVideoCall] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sessionData, isLoading, error, sendMessage, setVideoCallUrl: updateVideoCallUrl, isSending } = useSessionPolling(
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

  const handleSetVideoCall = async () => {
    setVideoCallError('');
    
    if (!videoCallUrl.trim()) {
      setVideoCallError('Please enter a video call URL');
      return;
    }

    if (!videoCallUrl.startsWith('http://') && !videoCallUrl.startsWith('https://')) {
      setVideoCallError('URL must start with http:// or https://');
      return;
    }

    setIsSettingVideoCall(true);
    try {
      await updateVideoCallUrl(videoCallUrl.trim());
      setVideoCallDialogOpen(false);
      setVideoCallUrl('');
    } catch (error) {
      setVideoCallError(error instanceof Error ? error.message : 'Failed to set video call URL');
    } finally {
      setIsSettingVideoCall(false);
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
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded border border-border">
                    <File className="h-8 w-8 text-primary shrink-0" />
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <InlineError message={error} />
          <Button onClick={onLeave} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg border-2 border-primary/30">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ZELLO
            </h1>
            <p className="text-xs text-muted-foreground">
              Session: <code className="font-mono font-semibold text-primary">{code}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Video Call Button */}
          {sessionData?.currentVideoCallUrl ? (
            <Button
              onClick={() => window.open(sessionData.currentVideoCallUrl, '_blank', 'noopener,noreferrer')}
              variant="default"
              size="sm"
              className="border-2"
            >
              <Video className="h-4 w-4 mr-2" />
              Join Video Call
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          ) : (
            <Dialog open={videoCallDialogOpen} onOpenChange={setVideoCallDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-2">
                  <Video className="h-4 w-4 mr-2" />
                  Set Video Call
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Video Call URL</DialogTitle>
                  <DialogDescription>
                    Enter a video call link (e.g., Zoom, Google Meet, etc.) for all participants to join
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-url">Video Call URL</Label>
                    <Input
                      id="video-url"
                      placeholder="https://meet.google.com/..."
                      value={videoCallUrl}
                      onChange={(e) => setVideoCallUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSetVideoCall()}
                    />
                  </div>
                  {videoCallError && <InlineError message={videoCallError} />}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSetVideoCall}
                    disabled={isSettingVideoCall}
                  >
                    {isSettingVideoCall ? 'Setting...' : 'Set Video Call'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={onLeave} variant="ghost" size="sm" className="border-2 border-transparent hover:border-primary/20">
            <LogOut className="h-4 w-4 mr-2" />
            Leave
          </Button>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
            {isLoading && !sessionData ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading messages...
              </div>
            ) : sessionData?.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                <div>
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t-2 border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 p-4">
            {sendError && (
              <div className="mb-2">
                <InlineError message={sendError} />
              </div>
            )}
            <AttachmentComposer
              messageInput={messageInput}
              onMessageInputChange={setMessageInput}
              onSend={handleSendMessage}
              disabled={isSending}
              onTyping={handleTyping}
              onClearTyping={clearTyping}
            />
          </div>
        </div>

        {/* Participants Sidebar */}
        <div className="w-64 border-l-2 border-primary/20 bg-gradient-to-b from-primary/5 to-secondary/5 hidden md:block">
          <ParticipantList
            participants={sessionData?.participants || []}
            currentUserId={participantId}
          />
        </div>
      </div>
    </div>
  );
}
