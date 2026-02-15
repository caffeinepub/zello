import { Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import TypingDots from './TypingDots';
import type { Participant } from '../../backend';

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string;
  compact?: boolean;
}

export default function ParticipantList({
  participants,
  currentUserId,
  compact = false,
}: ParticipantListProps) {
  if (compact) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {participants.length} / 8 participants
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b-2 border-primary/20">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">
            Participants ({participants.length}/8)
          </h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {participants.map((participant) => {
            const isCurrentUser = participant.id === currentUserId;
            return (
              <div
                key={participant.id}
                className={`flex flex-col gap-1 p-2 rounded-lg transition-colors ${
                  isCurrentUser 
                    ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30' 
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                  <span className="text-sm font-medium truncate">
                    {participant.displayName}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground ml-1">(you)</span>
                    )}
                  </span>
                </div>
                {participant.isTyping && !isCurrentUser && (
                  <div className="ml-4">
                    <TypingDots />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
