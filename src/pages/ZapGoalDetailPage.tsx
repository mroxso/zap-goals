import { useParams, Link } from 'react-router-dom';
import { Calendar, Share2, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { useAuthor } from '@/hooks/useAuthor';
import { useZapGoal } from '@/hooks/useZapGoals';
import { genUserName } from '@/lib/genUserName';
import { formatSats } from '@/lib/zapGoals';
import { ZapButton } from '@/components/ZapButton';
import { nip19 } from 'nostr-tools';

export function ZapGoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useZapGoal(id);
  const { toast } = useToast();

  const author = useAuthor(data?.goal.pubkey || '');

  if (isLoading) {
    return <ZapGoalDetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-4xl text-center">
        <h2 className="text-2xl font-bold mb-4">Goal Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The zap goal you're looking for doesn't exist or couldn't be loaded.
        </p>
        <Button asChild>
          <Link to="/goals">Browse Goals</Link>
        </Button>
      </div>
    );
  }

  const { goal, zapReceipts, progress } = data;
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || genUserName(goal.pubkey);
  const profileImage = metadata?.picture;

  const isCompleted = progress.percentage >= 100;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: goal.summary || 'Zap Goal',
          text: goal.content,
          url,
        });
      } catch {
        // User cancelled or error occurred
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard!' });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/goals">← Back to Goals</Link>
        </Button>
      </div>

      {goal.image && (
        <div className="relative w-full h-80 mb-8 overflow-hidden rounded-lg">
          <img
            src={goal.image}
            alt={goal.summary || 'Goal image'}
            className="w-full h-full object-cover"
          />
          {progress.isClosed && (
            <Badge className="absolute top-4 right-4 text-base px-4 py-2" variant="secondary">
              Closed
            </Badge>
          )}
          {isCompleted && !progress.isClosed && (
            <Badge className="absolute top-4 right-4 text-base px-4 py-2 bg-green-600">
              Goal Reached! 🎉
            </Badge>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-4">{goal.summary || 'Zap Goal'}</h1>

            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Created by</p>
                <Link
                  to={`/${nip19.npubEncode(goal.pubkey)}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {displayName}
                </Link>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{goal.content}</p>
            </div>
          </div>

          {zapReceipts.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Recent Supporters</h2>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {zapReceipts.slice(0, 10).map((zap) => (
                      <SupporterRow key={zap.event.id} zap={zap} />
                    ))}
                  </div>
                  {zapReceipts.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      + {zapReceipts.length - 10} more supporters
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-3xl font-bold">
                    {formatSats(progress.raised)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    raised
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  of {formatSats(progress.target)} goal
                </div>

                <Progress
                  value={Math.min(progress.percentage, 100)}
                  className="h-3 mb-2"
                />

                <div className="text-sm font-medium text-center">
                  {progress.percentage.toFixed(1)}% funded
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Supporters
                  </span>
                  <span className="font-medium">{progress.zapCount}</span>
                </div>

                {goal.closedAt && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {progress.isClosed ? 'Closed' : 'Closes'}
                    </span>
                    <span className="font-medium">
                      {new Date(goal.closedAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Created
                  </span>
                  <span className="font-medium">
                    {new Date(goal.createdAt * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Separator />

              {!progress.isClosed && (
                <Button
                  className='w-full'>
                  <ZapButton
                    target={goal.event}
                    className="w-full"
                    showCount={false}
                  />
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Goal
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">About Zap Goals</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Zap Goals are fundraising campaigns on Nostr using Lightning Network payments.
              </p>
              <p>
                Support this goal by zapping with your Lightning wallet!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SupporterRow({ zap }: { zap: { sender?: string; timestamp: number; amount: number; event: { id: string } } }) {
  const sender = zap.sender;
  const author = useAuthor(sender);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || (sender ? genUserName(sender) : 'Anonymous');
  const profileImage = metadata?.picture;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {sender ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(zap.timestamp * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-sm font-semibold">
        {formatSats(zap.amount)}
      </div>
    </div>
  );
}

function ZapGoalDetailSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Skeleton className="h-10 w-32 mb-6" />
      <Skeleton className="w-full h-80 mb-8 rounded-lg" />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
