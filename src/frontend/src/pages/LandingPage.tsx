import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActor } from '../hooks/useActor';
import { storeSession, getOrCreateParticipantId } from '../lib/sessionStorage';
import { Loader2, MessageSquare, CheckCircle2 } from 'lucide-react';
import CopyCodeButton from '../components/actions/CopyCodeButton';
import InlineError from '../components/feedback/InlineError';

interface LandingPageProps {
  onSessionStart: (code: string, displayName: string, participantId: string) => void;
}

export default function LandingPage({ onSessionStart }: LandingPageProps) {
  const { actor } = useActor();
  
  // Create session state
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [sessionCreated, setSessionCreated] = useState(false);
  const [createdParticipantId, setCreatedParticipantId] = useState('');
  
  // Join session state
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleCreateSession = async () => {
    setCreateError('');
    
    if (!createName.trim()) {
      setCreateError('Please enter your name');
      return;
    }

    if (!actor) {
      setCreateError('Connection not ready. Please wait.');
      return;
    }

    setCreateLoading(true);
    try {
      const participantId = getOrCreateParticipantId();
      const code = await actor.createSession(participantId, createName.trim());
      setGeneratedCode(code);
      setCreatedParticipantId(participantId);
      setSessionCreated(true);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinCreatedSession = () => {
    if (generatedCode && createdParticipantId) {
      storeSession(generatedCode, createName.trim(), createdParticipantId);
      onSessionStart(generatedCode, createName.trim(), createdParticipantId);
    }
  };

  const handleJoinSession = async () => {
    setJoinError('');
    
    if (!joinName.trim()) {
      setJoinError('Please enter your name');
      return;
    }
    
    if (!joinCode.trim()) {
      setJoinError('Please enter a session code');
      return;
    }

    if (!actor) {
      setJoinError('Connection not ready. Please wait.');
      return;
    }

    setJoinLoading(true);
    try {
      const participantId = getOrCreateParticipantId();
      await actor.joinSession(joinCode.trim().toUpperCase(), participantId, joinName.trim());
      storeSession(joinCode.trim().toUpperCase(), joinName.trim(), participantId);
      onSessionStart(joinCode.trim().toUpperCase(), joinName.trim(), participantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join session';
      if (message.includes('not found')) {
        setJoinError('Session not found. Please check the code.');
      } else if (message.includes('full')) {
        setJoinError('Session is full (maximum 8 participants).');
      } else if (message.includes('already in session')) {
        setJoinError('You are already in this session.');
      } else {
        setJoinError(message);
      }
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border-2 border-primary/30">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                ZELLO
              </h1>
              <p className="text-muted-foreground mt-1">Simple group chat. No login required.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 max-w-7xl mx-auto">
          {/* Create Session */}
          <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Create Session
              </CardTitle>
              <CardDescription className="text-base">Start a new chat and invite others</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!sessionCreated ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="create-name" className="text-base">Your Name</Label>
                    <Input
                      id="create-name"
                      placeholder="Enter your name"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                      disabled={createLoading}
                      className="h-12 text-base"
                    />
                  </div>

                  {createError && <InlineError message={createError} />}

                  <Button
                    onClick={handleCreateSession}
                    disabled={createLoading || !actor}
                    className="w-full h-12 text-base font-semibold"
                    size="lg"
                  >
                    {createLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Session'
                    )}
                  </Button>
                </>
              ) : (
                <div className="space-y-5">
                  {/* Code Generated Section */}
                  <div className="space-y-4 p-5 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border-2 border-primary/30">
                    <p className="text-sm font-semibold text-primary">Code generated</p>
                    <div className="flex items-center gap-3">
                      <code className="text-3xl font-bold tracking-wider bg-background px-6 py-3 rounded-lg border-2 border-primary/40 flex-1 text-center shadow-inner">
                        {generatedCode}
                      </code>
                      <CopyCodeButton code={generatedCode} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this code with others to join your session
                    </p>
                  </div>

                  {/* Session Created Confirmation */}
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">Session created</p>
                      <p className="text-sm text-muted-foreground">Ready to start chatting</p>
                    </div>
                  </div>

                  {/* Join Session Button */}
                  <Button
                    onClick={handleJoinCreatedSession}
                    className="w-full h-12 text-base font-semibold"
                    size="lg"
                  >
                    Join Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Join Session */}
          <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-3xl bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                Join Session
              </CardTitle>
              <CardDescription className="text-base">Enter a code to join an existing chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="join-name" className="text-base">Your Name</Label>
                <Input
                  id="join-name"
                  placeholder="Enter your name"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  disabled={joinLoading}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="join-code" className="text-base">Session Code</Label>
                <Input
                  id="join-code"
                  placeholder="e.g., 1A2B"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinSession()}
                  disabled={joinLoading}
                  className="uppercase tracking-wider h-12 text-base font-mono"
                />
              </div>

              {joinError && <InlineError message={joinError} />}

              <Button
                onClick={handleJoinSession}
                disabled={joinLoading || !actor}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {joinLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Session'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} · Built with using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'zello-app'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline font-medium"
            >
              caffeine.ai
            </a>
            {' · '}by echu ❤️
          </p>
        </div>
      </footer>
    </div>
  );
}
