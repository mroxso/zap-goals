import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import {
  parseZapGoal,
  parseZapReceipt,
  calculateGoalProgress,
  calculateTrendingScore,
  type ZapGoal,
  type ZapReceipt,
} from '@/lib/zapGoals';

export type SortOrder = 'newest' | 'trending';

/**
 * Hook to fetch multiple Zap Goals with sorting
 */
export function useZapGoals(sortOrder: SortOrder = 'newest', limit = 20) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['zapGoals', sortOrder, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      // Fetch zap goal events
      const events = await nostr.query(
        [{ kinds: [9041], limit: limit * 2 }],
        { signal }
      );

      // Parse and filter valid goals
      const goals = events
        .map(parseZapGoal)
        .filter((goal): goal is ZapGoal => goal !== null);

      if (sortOrder === 'newest') {
        // Sort by creation time (newest first)
        return goals.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
      } else {
        // For trending, we need to fetch zap receipts for each goal
        const goalIds = goals.map(g => g.id);
        
        const zapEvents = await nostr.query(
          [{ kinds: [9735], '#e': goalIds, limit: 500 }],
          { signal }
        );

        const zapReceipts = zapEvents
          .map(parseZapReceipt)
          .filter((zap): zap is ZapReceipt => zap !== null);

        // Group zaps by goal
        const zapsByGoal = new Map<string, ZapReceipt[]>();
        for (const zap of zapReceipts) {
          const eTag = zap.event.tags.find(([name]) => name === 'e');
          if (eTag && eTag[1]) {
            const goalId = eTag[1];
            if (!zapsByGoal.has(goalId)) {
              zapsByGoal.set(goalId, []);
            }
            zapsByGoal.get(goalId)!.push(zap);
          }
        }

        // Calculate trending scores and sort
        const goalsWithScores = goals.map(goal => {
          const zaps = zapsByGoal.get(goal.id) || [];
          const progress = calculateGoalProgress(goal, zaps);
          const score = calculateTrendingScore(goal, progress, zaps);
          return { goal, score };
        });

        return goalsWithScores
          .sort((a, b) => b.score - a.score)
          .map(({ goal }) => goal)
          .slice(0, limit);
      }
    },
  });
}

/**
 * Hook to fetch a single Zap Goal by ID with its zap receipts
 */
export function useZapGoal(goalId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['zapGoal', goalId],
    queryFn: async (c) => {
      if (!goalId) throw new Error('Goal ID is required');

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      // Fetch the goal event
      const [goalEvent] = await nostr.query(
        [{ kinds: [9041], ids: [goalId] }],
        { signal }
      );

      if (!goalEvent) {
        throw new Error('Goal not found');
      }

      const goal = parseZapGoal(goalEvent);
      if (!goal) {
        throw new Error('Invalid goal event');
      }

      // Fetch zap receipts for this goal
      const zapEvents = await nostr.query(
        [{ kinds: [9735], '#e': [goalId], limit: 500 }],
        { signal }
      );

      const zapReceipts = zapEvents
        .map(parseZapReceipt)
        .filter((zap): zap is ZapReceipt => zap !== null)
        .sort((a, b) => b.timestamp - a.timestamp);

      const progress = calculateGoalProgress(goal, zapReceipts);

      return {
        goal,
        zapReceipts,
        progress,
      };
    },
    enabled: !!goalId,
  });
}

/**
 * Hook to fetch Zap Goals with their progress (for display with progress bars)
 */
export function useZapGoalsWithProgress(sortOrder: SortOrder = 'newest', limit = 20) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['zapGoalsWithProgress', sortOrder, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      // Fetch zap goal events
      const events = await nostr.query(
        [{ kinds: [9041], limit: limit * 2 }],
        { signal }
      );

      // Parse and filter valid goals
      const goals = events
        .map(parseZapGoal)
        .filter((goal): goal is ZapGoal => goal !== null);

      // Fetch all zap receipts for these goals
      const goalIds = goals.map(g => g.id);
      
      const zapEvents = await nostr.query(
        [{ kinds: [9735], '#e': goalIds, limit: 500 }],
        { signal }
      );

      const allZapReceipts = zapEvents
        .map(parseZapReceipt)
        .filter((zap): zap is ZapReceipt => zap !== null);

      // Group zaps by goal ID
      const zapsByGoal = new Map<string, ZapReceipt[]>();
      for (const zap of allZapReceipts) {
        const eTag = zap.event.tags.find(([name]) => name === 'e');
        if (eTag && eTag[1]) {
          const goalId = eTag[1];
          if (!zapsByGoal.has(goalId)) {
            zapsByGoal.set(goalId, []);
          }
          zapsByGoal.get(goalId)!.push(zap);
        }
      }

      // Calculate progress for each goal
      const goalsWithProgress = goals.map(goal => {
        const zaps = zapsByGoal.get(goal.id) || [];
        const progress = calculateGoalProgress(goal, zaps);
        return { goal, progress };
      });

      // Sort based on order
      if (sortOrder === 'newest') {
        goalsWithProgress.sort((a, b) => b.goal.createdAt - a.goal.createdAt);
      } else {
        // Trending sort
        goalsWithProgress.sort((a, b) => {
          const scoreA = calculateTrendingScore(
            a.goal,
            a.progress,
            zapsByGoal.get(a.goal.id) || []
          );
          const scoreB = calculateTrendingScore(
            b.goal,
            b.progress,
            zapsByGoal.get(b.goal.id) || []
          );
          return scoreB - scoreA;
        });
      }

      return goalsWithProgress.slice(0, limit);
    },
  });
}
