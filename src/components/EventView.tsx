import { useEvent } from '@/hooks/useNostrEvent';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { NoteContent } from '@/components/NoteContent';
import { CommentsSection } from '@/components/comments/CommentsSection';
import NotFound from '@/pages/NotFound';

interface EventViewProps {
  eventId: string;
}

export function EventView({ eventId }: EventViewProps) {
  const { data: event, isLoading } = useEvent(eventId);
  const author = useAuthor(event?.pubkey);
  const metadata = author.data?.metadata;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return <NotFound />;
  }

  const displayName = metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const timestamp = new Date(event.created_at * 1000);

  // Check if it's a text-based event that can use NoteContent
  const isTextEvent = [1, 11, 1111].includes(event.kind);

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{displayName}</span>
                <Badge variant="secondary">Kind {event.kind}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {timestamp.toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isTextEvent ? (
            <div className="whitespace-pre-wrap break-words">
              <NoteContent event={event} />
            </div>
          ) : (
            <div className="space-y-4">
              {event.content && (
                <div className="whitespace-pre-wrap break-words text-sm">
                  {event.content}
                </div>
              )}
              {event.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-muted-foreground">Tags:</div>
                  <div className="space-y-1">
                    {event.tags.map((tag, i) => (
                      <div key={i} className="text-xs font-mono bg-muted p-2 rounded">
                        {JSON.stringify(tag)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CommentsSection root={event} />
    </div>
  );
}
