import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, X, File, Send, Mic, Square, Play, Trash2 } from 'lucide-react';
import { MAX_ATTACHMENT_SIZE, formatFileSize } from '@/lib/attachments';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface AttachmentComposerProps {
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSend: (text: string, file: File | null) => void;
  disabled: boolean;
  onTyping: () => void;
  onClearTyping: () => void;
}

export default function AttachmentComposer({
  messageInput,
  onMessageInputChange,
  onSend,
  disabled,
  onTyping,
  onClearTyping,
}: AttachmentComposerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  const {
    recordingState,
    recordingDuration,
    recordedBlob,
    error: recorderError,
    isSupported: isRecorderSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: clearRecorderError,
  } = useVoiceRecorder();

  // Format recording duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Create preview URL for recorded audio
  useEffect(() => {
    if (recordedBlob && recordingState === 'stopped') {
      const url = URL.createObjectURL(recordedBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [recordedBlob, recordingState]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setFileError(`File too large. Maximum size is ${formatFileSize(MAX_ATTACHMENT_SIZE)}`);
      return;
    }

    setSelectedFile(file);

    // Create preview for images and audio
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError('');
  };

  const handleStartRecording = async () => {
    setFileError('');
    clearRecorderError();
    // Clear any existing file attachment
    if (selectedFile) {
      handleRemoveFile();
    }
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleCancelRecording = () => {
    cancelRecording();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSendRecording = () => {
    if (!recordedBlob) return;

    // Check size
    if (recordedBlob.size > MAX_ATTACHMENT_SIZE) {
      setFileError(`Recording too large. Maximum size is ${formatFileSize(MAX_ATTACHMENT_SIZE)}`);
      return;
    }

    // Convert blob to File - create a proper File object
    const timestamp = Date.now();
    const extension = recordedBlob.type.includes('webm') ? 'webm' : 'ogg';
    const filename = `voice-message-${timestamp}.${extension}`;
    
    // Create File using Object.create to ensure proper File type
    const file = new Blob([recordedBlob], { type: recordedBlob.type }) as File;
    // Add File-specific properties
    Object.defineProperty(file, 'name', {
      value: filename,
      writable: false
    });
    Object.defineProperty(file, 'lastModified', {
      value: timestamp,
      writable: false
    });

    onSend('', file);

    // Clean up
    handleCancelRecording();
  };

  const handleDiscardRecording = () => {
    handleCancelRecording();
  };

  const handleSend = () => {
    if ((!messageInput.trim() && !selectedFile) || disabled) return;
    
    onSend(messageInput.trim(), selectedFile);
    
    // Clean up
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    onMessageInputChange(value);
    if (value.trim()) {
      onTyping();
    } else {
      onClearTyping();
    }
  };

  // Show recording UI when recording or stopped
  if (recordingState === 'recording' || recordingState === 'stopped') {
    return (
      <div className="space-y-2">
        {/* Recording Preview */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border-2 border-primary/30">
          <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center border-2 border-primary/30 shrink-0">
            {recordingState === 'recording' ? (
              <div className="relative">
                <Mic className="h-8 w-8 text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
              </div>
            ) : (
              <Play className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {recordingState === 'recording' ? 'Recording...' : 'Voice Message'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDuration(recordingDuration)}
              {recordedBlob && ` • ${formatFileSize(recordedBlob.size)}`}
            </p>
          </div>
          {recordingState === 'recording' ? (
            <>
              <Button
                onClick={handleCancelRecording}
                variant="ghost"
                size="icon"
                className="shrink-0"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleStopRecording}
                variant="default"
                size="icon"
                className="shrink-0"
                title="Stop recording"
              >
                <Square className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleDiscardRecording}
                variant="ghost"
                size="icon"
                className="shrink-0"
                title="Discard"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSendRecording}
                variant="default"
                size="icon"
                className="shrink-0"
                title="Send voice message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Audio Preview (when stopped) */}
        {recordingState === 'stopped' && previewUrl && (
          <div className="p-2 bg-muted/50 rounded border border-border">
            <audio
              ref={audioPreviewRef}
              src={previewUrl}
              controls
              className="w-full h-8"
            />
          </div>
        )}

        {/* Error Message */}
        {(fileError || recorderError) && (
          <div className="text-sm text-destructive p-2 bg-destructive/10 rounded border border-destructive/30">
            {fileError || recorderError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* File Preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border-2 border-border">
          {previewUrl && selectedFile.type.startsWith('image/') ? (
            <div className="relative w-16 h-16 rounded overflow-hidden border-2 border-border shrink-0">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : previewUrl && selectedFile.type.startsWith('audio/') ? (
            <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center border-2 border-primary/30 shrink-0">
              <Play className="h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center border-2 border-primary/30 shrink-0">
              <File className="h-8 w-8 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            {previewUrl && selectedFile.type.startsWith('audio/') && (
              <audio src={previewUrl} controls className="w-full h-6 mt-1" />
            )}
          </div>
          <Button
            onClick={handleRemoveFile}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Error Message */}
      {(fileError || recorderError) && (
        <div className="text-sm text-destructive p-2 bg-destructive/10 rounded border border-destructive/30">
          {fileError || recorderError}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,audio/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          disabled={disabled}
          className="shrink-0"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        {isRecorderSupported && (
          <Button
            onClick={handleStartRecording}
            variant="outline"
            size="icon"
            disabled={disabled}
            className="shrink-0"
            title="Record voice message"
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
        <Input
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 border-2 focus-visible:ring-2"
        />
        <Button
          onClick={handleSend}
          disabled={(!messageInput.trim() && !selectedFile) || disabled}
          size="icon"
          className="h-10 w-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
