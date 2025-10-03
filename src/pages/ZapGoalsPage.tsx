import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { ZapGoalCard } from '@/components/ZapGoalCard';
import { useZapGoalsWithProgress } from '@/hooks/useZapGoals';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { SortOrder } from '@/hooks/useZapGoals';

export function ZapGoalsPage() {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const { data: goalsWithProgress, isLoading } = useZapGoalsWithProgress(sortOrder, 20);
  const { user } = useCurrentUser();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Zap Goals</h1>
          <p className="text-muted-foreground">
            Discover and support fundraising campaigns on Nostr
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link to="/goals/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Link>
          </Button>
        )}
      </div>

      <Tabs value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)} className="mb-8">
        <TabsList>
          <TabsTrigger value="newest">Newest</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="newest" className="mt-6">
          <GoalsGrid goalsWithProgress={goalsWithProgress} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <GoalsGrid goalsWithProgress={goalsWithProgress} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import type { ZapGoal, ZapGoalProgress } from '@/lib/zapGoals';

interface GoalsGridProps {
  goalsWithProgress: Array<{ goal: ZapGoal; progress: ZapGoalProgress }> | undefined;
  isLoading: boolean;
}

function GoalsGrid({ goalsWithProgress, isLoading }: GoalsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
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
    );
  }

  if (!goalsWithProgress || goalsWithProgress.length === 0) {
    return (
      <div className="col-span-full">
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No goals found</h3>
                <p className="text-muted-foreground">
                  No fundraising goals were found on this relay. Try switching to another relay to discover more goals.
                </p>
              </div>
              <RelaySelector className="w-full" />
              <Link to="/goals/create">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goalsWithProgress.map(({ goal, progress }) => (
        <ZapGoalCard key={goal.id} goal={goal} progress={progress} />
      ))}
    </div>
  );
}
