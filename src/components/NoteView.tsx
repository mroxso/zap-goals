import { useNote } from '@/hooks/useNostrEvent';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteContent } from '@/components/NoteContent';
import { CommentsSection } from '@/components/comments/CommentsSection';
import NotFound from '@/pages/NotFound';

interface NoteViewProps {
  eventId: string;
}

export function NoteView({ eventId }: NoteViewProps) {
  const { data: note, isLoading } = useNote(eventId);
  const author = useAuthor(note?.pubkey);
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

  if (!note) {
    return <NotFound />;
  }

  const displayName = metadata?.name || genUserName(note.pubkey);
  const profileImage = metadata?.picture;
  const timestamp = new Date(note.created_at * 1000);

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
              <div className="font-semibold">{displayName}</div>
              <div className="text-sm text-muted-foreground">
                {timestamp.toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap break-words">
            <NoteContent event={note} />
          </div>
        </CardContent>
      </Card>

      <CommentsSection root={note} />
    </div>
  );
}
