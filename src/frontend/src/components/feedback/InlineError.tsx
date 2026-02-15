import { AlertCircle } from 'lucide-react';

interface InlineErrorProps {
  message: string;
}

export default function InlineError({ message }: InlineErrorProps) {
  return (
    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
