import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, X, Image as ImageIcon, File, Send } from 'lucide-react';
import { MAX_ATTACHMENT_SIZE, formatFileSize } from '@/lib/attachments';

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setFileError(`File too large. Maximum size is ${formatFileSize(MAX_ATTACHMENT_SIZE)}`);
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
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

  return (
    <div className="space-y-2">
      {/* File Preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border-2 border-border">
          {previewUrl ? (
            <div className="relative w-16 h-16 rounded overflow-hidden border-2 border-border shrink-0">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center border-2 border-primary/30 shrink-0">
              <File className="h-8 w-8 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
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
      {fileError && (
        <div className="text-sm text-destructive p-2 bg-destructive/10 rounded border border-destructive/30">
          {fileError}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          disabled={disabled}
          className="shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
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
