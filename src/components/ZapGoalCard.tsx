import { Link } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatSats } from '@/lib/zapGoals';
import type { ZapGoal, ZapGoalProgress } from '@/lib/zapGoals';
import { cn } from '@/lib/utils';

interface ZapGoalCardProps {
  goal: ZapGoal;
  progress: ZapGoalProgress;
  className?: string;
}

export function ZapGoalCard({ goal, progress, className }: ZapGoalCardProps) {
  const author = useAuthor(goal.pubkey);
  const metadata = author.data?.metadata;

  const displayName = metadata?.name || genUserName(goal.pubkey);
  const profileImage = metadata?.picture;

  const isCompleted = progress.percentage >= 100;
  const isAlmostThere = progress.percentage >= 80 && progress.percentage < 100;

  return (
    <Link to={`/goals/${goal.id}`}>
      <Card className={cn('h-full hover:shadow-lg transition-shadow cursor-pointer', className)}>
        {goal.image && (
          <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
            <img
              src={goal.image}
              alt={goal.summary || 'Goal image'}
              className="w-full h-full object-cover"
            />
            {progress.isClosed && (
              <Badge className="absolute top-2 right-2" variant="secondary">
                Closed
              </Badge>
            )}
            {isCompleted && !progress.isClosed && (
              <Badge className="absolute top-2 right-2 bg-green-600">
                Completed!
              </Badge>
            )}
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-2">
                {goal.summary || 'Zap Goal'}
              </h3>
              <p className="text-sm text-muted-foreground">by {displayName}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {goal.content && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {goal.content}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {formatSats(progress.raised)} raised
              </span>
              <span className="text-muted-foreground">
                of {formatSats(progress.target)}
              </span>
            </div>

            <Progress 
              value={Math.min(progress.percentage, 100)} 
              className={cn(
                'h-2',
                isCompleted && 'bg-green-100',
                isAlmostThere && 'bg-yellow-100'
              )}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.percentage.toFixed(1)}% funded</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {progress.zapCount} {progress.zapCount === 1 ? 'supporter' : 'supporters'}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {goal.closedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {progress.isClosed 
                  ? 'Closed' 
                  : `Closes ${new Date(goal.closedAt * 1000).toLocaleDateString()}`
                }
              </span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
