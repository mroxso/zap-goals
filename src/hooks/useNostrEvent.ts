import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

/**
 * Hook to fetch a single note (kind 1) by event ID
 */
export function useNote(eventId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['note', eventId],
    queryFn: async (c) => {
      if (!eventId) return null;

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const events = await nostr.query(
        [{ kinds: [1], ids: [eventId] }],
        { signal }
      );

      return events[0] || null;
    },
    enabled: !!eventId,
  });
}

/**
 * Hook to fetch a single event by ID (any kind)
 */
export function useEvent(eventId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async (c) => {
      if (!eventId) return null;

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const events = await nostr.query(
        [{ ids: [eventId] }],
        { signal }
      );

      return events[0] || null;
    },
    enabled: !!eventId,
  });
}

/**
 * Hook to fetch an addressable event (kind 30000-39999)
 */
export function useAddressableEvent(
  kind: number | undefined,
  pubkey: string | undefined,
  identifier: string | undefined
) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['addressableEvent', kind, pubkey, identifier],
    queryFn: async (c) => {
      if (!kind || !pubkey || !identifier) return null;

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const events = await nostr.query(
        [{ kinds: [kind], authors: [pubkey], '#d': [identifier] }],
        { signal }
      );

      return events[0] || null;
    },
    enabled: !!kind && !!pubkey && !!identifier,
  });
}
