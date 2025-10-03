import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from './useNostrPublish';

export interface CreateZapGoalInput {
  /** Human-readable description of the goal */
  content: string;
  /** Target amount in satoshis (will be converted to millisats) */
  amountSats: number;
  /** Brief summary/title of the goal */
  summary: string;
  /** Image URL (optional) */
  image?: string;
  /** Unix timestamp for when goal closes (optional) */
  closedAt?: number;
  /** List of relay URLs where zaps should be tallied (optional, defaults to common relays) */
  relays?: string[];
}

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.primal.net',
];

/**
 * Hook to create a new Zap Goal (NIP-75)
 */
export function useCreateZapGoal() {
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateZapGoalInput) => {
      // Convert sats to millisats
      const amountMillisats = input.amountSats * 1000;

      // Build tags
      const tags: string[][] = [
        ['amount', amountMillisats.toString()],
        ['relays', ...(input.relays || DEFAULT_RELAYS)],
        ['summary', input.summary],
      ];

      // Add optional tags
      if (input.image) {
        tags.push(['image', input.image]);
      }

      if (input.closedAt) {
        tags.push(['closed_at', input.closedAt.toString()]);
      }

      // Create the event
      const event = await createEvent({
        kind: 9041,
        content: input.content,
        tags,
      });

      return event;
    },
    onSuccess: () => {
      // Invalidate goals queries to refetch
      queryClient.invalidateQueries({ queryKey: ['zapGoals'] });
      queryClient.invalidateQueries({ queryKey: ['zapGoalsWithProgress'] });
    },
  });
}
