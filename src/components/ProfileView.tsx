import { useAuthor } from '@/hooks/useAuthor';
import { useAuthorZapGoalsWithProgress } from '@/hooks/useAuthorZapGoals';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ZapGoalCard } from '@/components/ZapGoalCard';
import { RelaySelector } from '@/components/RelaySelector';
import { Link as LinkIcon } from 'lucide-react';

interface ProfileViewProps {
  pubkey: string;
}

export function ProfileView({ pubkey }: ProfileViewProps) {
  const author = useAuthor(pubkey);
  const { data: goalsWithProgress, isLoading: isLoadingGoals } = useAuthorZapGoalsWithProgress(pubkey, 20);
  const metadata = author.data?.metadata;

  const displayName = metadata?.name || genUserName(pubkey);
  const profileImage = metadata?.picture;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Profile Header */}
      {author.isLoading ? (
        <Card className="mb-8">
          <CardHeader className="space-y-4">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback className="text-2xl">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{displayName}</h1>
                  {metadata?.display_name && metadata.display_name !== metadata.name && (
                    <p className="text-lg text-muted-foreground">{metadata.display_name}</p>
                  )}
                </div>

                {metadata?.about && (
                  <p className="text-muted-foreground whitespace-pre-wrap max-w-3xl">
                    {metadata.about}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {metadata?.website && (
                    <a 
                      href={metadata.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <LinkIcon className="h-4 w-4" />
                      {new URL(metadata.website).hostname}
                    </a>
                  )}
                  {metadata?.nip05 && (
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">{metadata.nip05}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Zap Goals Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Zap Goals</h2>
      </div>

      {isLoadingGoals ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-full">
              <div className="relative w-full h-48">
                <Skeleton className="w-full h-full rounded-t-lg" />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !goalsWithProgress || goalsWithProgress.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No zap goals found</h3>
                <p className="text-muted-foreground">
                  This user hasn't created any zap goals yet. Try another relay?
                </p>
              </div>
              <RelaySelector className="w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalsWithProgress.map(({ goal, progress }) => (
            <ZapGoalCard
              key={goal.id}
              goal={goal}
              progress={progress}
            />
          ))}
        </div>
      )}
    </div>
  );
}
