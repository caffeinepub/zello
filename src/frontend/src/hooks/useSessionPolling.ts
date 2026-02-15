import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { fileToUint8Array } from '../lib/attachments';
import type { SessionData, Attachment } from '../backend';

const POLL_INTERVAL = 2000; // 2 seconds

export function useSessionPolling(code: string, participantId: string, displayName: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const lastMessageCountRef = useRef(0);

  const {
    data: sessionData,
    isLoading,
    error,
  } = useQuery<SessionData>({
    queryKey: ['session', code],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getSessionData(code);
    },
    enabled: !!actor && !!code,
    refetchInterval: POLL_INTERVAL,
    retry: 2,
  });

  // Track message count changes
  useEffect(() => {
    if (sessionData?.messages) {
      const currentCount = sessionData.messages.length;
      if (currentCount > lastMessageCountRef.current) {
        lastMessageCountRef.current = currentCount;
      }
    }
  }, [sessionData?.messages]);

  const sendMessage = async (content: string | null, file: File | null = null) => {
    if (!actor) throw new Error('Not connected');
    if (!content && !file) throw new Error('Message must contain text or an attachment');
    
    setIsSending(true);
    try {
      let attachment: Attachment | null = null;
      
      if (file) {
        const data = await fileToUint8Array(file);
        attachment = {
          filename: file.name,
          mimeType: file.type,
          data,
        };
      }

      await actor.sendMessage(
        code,
        participantId,
        content || null,
        displayName,
        attachment
      );
      
      // Immediately refetch to show the new message
      await queryClient.invalidateQueries({ queryKey: ['session', code] });
    } finally {
      setIsSending(false);
    }
  };

  return {
    sessionData,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to load session') : null,
    sendMessage,
    isSending,
  };
}
