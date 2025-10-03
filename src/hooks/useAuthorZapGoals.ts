import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import {
  parseZapGoal,
  parseZapReceipt,
  calculateGoalProgress,
  type ZapGoal,
  type ZapReceipt,
} from '@/lib/zapGoals';

/**
 * Hook to fetch Zap Goals for a specific author
 */
export function useAuthorZapGoals(pubkey: string | undefined, limit = 20) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['authorZapGoals', pubkey, limit],
    queryFn: async (c) => {
      if (!pubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      // Fetch zap goal events for this author
      const events = await nostr.query(
        [{ kinds: [9041], authors: [pubkey], limit }],
        { signal }
      );

      // Parse and filter valid goals
      const goals = events
        .map(parseZapGoal)
        .filter((goal): goal is ZapGoal => goal !== null);

      // Sort by creation time (newest first)
      return goals.sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: !!pubkey,
  });
}

/**
 * Hook to fetch Zap Goals with progress for a specific author
 */
export function useAuthorZapGoalsWithProgress(pubkey: string | undefined, limit = 20) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['authorZapGoalsWithProgress', pubkey, limit],
    queryFn: async (c) => {
      if (!pubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      // Fetch zap goal events for this author
      const events = await nostr.query(
        [{ kinds: [9041], authors: [pubkey], limit }],
        { signal }
      );

      // Parse and filter valid goals
      const goals = events
        .map(parseZapGoal)
        .filter((goal): goal is ZapGoal => goal !== null);

      // Sort by creation time (newest first)
      const sortedGoals = goals.sort((a, b) => b.createdAt - a.createdAt);

      // Fetch zap receipts for all goals
      const goalIds = sortedGoals.map(g => g.id);
      
      if (goalIds.length === 0) return [];

      const zapEvents = await nostr.query(
        [{ kinds: [9735], '#e': goalIds, limit: 500 }],
        { signal }
      );

      const zapReceipts = zapEvents
        .map(parseZapReceipt)
        .filter((zap): zap is ZapReceipt => zap !== null);

      // Calculate progress for each goal
      return sortedGoals.map(goal => ({
        goal,
        progress: calculateGoalProgress(
          goal,
          zapReceipts.filter(zap => zap.event.tags.some(tag => tag[0] === 'e' && tag[1] === goal.id))
        ),
      }));
    },
    enabled: !!pubkey,
  });
}
