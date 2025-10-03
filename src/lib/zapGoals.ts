import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Represents a parsed NIP-75 Zap Goal event (kind 9041)
 */
export interface ZapGoal {
  /** The raw Nostr event */
  event: NostrEvent;
  /** Target amount in millisatoshis */
  amount: number;
  /** List of relay URLs where zaps should be tallied from */
  relays: string[];
  /** Human-readable description of the goal */
  content: string;
  /** Unix timestamp after which zaps don't count (optional) */
  closedAt?: number;
  /** Image URL for the goal (optional) */
  image?: string;
  /** Brief description/summary (optional) */
  summary?: string;
  /** Author's pubkey */
  pubkey: string;
  /** Event ID */
  id: string;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Represents a zap receipt with the amount paid
 */
export interface ZapReceipt {
  event: NostrEvent;
  amount: number;
  sender?: string;
  timestamp: number;
}

/**
 * Goal progress information
 */
export interface ZapGoalProgress {
  /** Total amount raised in millisatoshis */
  raised: number;
  /** Target amount in millisatoshis */
  target: number;
  /** Percentage of goal reached (0-100+) */
  percentage: number;
  /** Number of zaps received */
  zapCount: number;
  /** Whether the goal is closed */
  isClosed: boolean;
}

/**
 * Validates if a Nostr event is a valid NIP-75 Zap Goal
 */
export function validateZapGoal(event: NostrEvent): boolean {
  if (event.kind !== 9041) return false;

  // Check for required tags
  const relaysTag = event.tags.find(([name]) => name === 'relays');
  const amountTag = event.tags.find(([name]) => name === 'amount');

  if (!relaysTag || relaysTag.length < 2) return false;
  if (!amountTag || !amountTag[1]) return false;

  // Validate amount is a valid number
  const amount = parseInt(amountTag[1]);
  if (isNaN(amount) || amount <= 0) return false;

  return true;
}

/**
 * Parses a Nostr event into a ZapGoal object
 */
export function parseZapGoal(event: NostrEvent): ZapGoal | null {
  if (!validateZapGoal(event)) return null;

  const relaysTag = event.tags.find(([name]) => name === 'relays');
  const amountTag = event.tags.find(([name]) => name === 'amount');
  const closedAtTag = event.tags.find(([name]) => name === 'closed_at');
  const imageTag = event.tags.find(([name]) => name === 'image');
  const summaryTag = event.tags.find(([name]) => name === 'summary');

  const relays = relaysTag!.slice(1);
  const amount = parseInt(amountTag![1]);
  const closedAt = closedAtTag?.[1] ? parseInt(closedAtTag[1]) : undefined;

  return {
    event,
    amount,
    relays,
    content: event.content,
    closedAt,
    image: imageTag?.[1],
    summary: summaryTag?.[1],
    pubkey: event.pubkey,
    id: event.id,
    createdAt: event.created_at,
  };
}

/**
 * Validates if a Nostr event is a valid zap receipt (kind 9735)
 */
export function validateZapReceipt(event: NostrEvent): boolean {
  if (event.kind !== 9735) return false;

  const bolt11Tag = event.tags.find(([name]) => name === 'bolt11');
  const descriptionTag = event.tags.find(([name]) => name === 'description');

  if (!bolt11Tag || !descriptionTag) return false;

  return true;
}

/**
 * Parses a zap receipt event and extracts the amount
 */
export function parseZapReceipt(event: NostrEvent): ZapReceipt | null {
  if (!validateZapReceipt(event)) return null;

  const amountTag = event.tags.find(([name]) => name === 'amount');
  const senderTag = event.tags.find(([name]) => name === 'P');

  let amount = 0;
  if (amountTag?.[1]) {
    amount = parseInt(amountTag[1]);
  } else {
    // Try to extract from bolt11 invoice
    const bolt11Tag = event.tags.find(([name]) => name === 'bolt11');
    if (bolt11Tag?.[1]) {
      const invoice = bolt11Tag[1];
      const match = invoice.match(/lnbc?(\d+)([munp]?)/i);
      if (match) {
        const value = parseInt(match[1]);
        const multiplier = match[2];
        // Convert to millisatoshis
        switch (multiplier) {
          case 'm': amount = value * 100_000_000; break;
          case 'u': amount = value * 100_000; break;
          case 'n': amount = value * 100; break;
          case 'p': amount = value * 0.1; break;
          default: amount = value * 100_000_000_000; break;
        }
      }
    }
  }

  return {
    event,
    amount,
    sender: senderTag?.[1],
    timestamp: event.created_at,
  };
}

/**
 * Calculates the progress of a zap goal based on zap receipts
 */
export function calculateGoalProgress(
  goal: ZapGoal,
  zapReceipts: ZapReceipt[]
): ZapGoalProgress {
  const now = Math.floor(Date.now() / 1000);
  const isClosed = goal.closedAt ? goal.closedAt < now : false;

  // Filter zaps that are before the closed_at timestamp (if set)
  const validZaps = zapReceipts.filter(
    zap => !goal.closedAt || zap.timestamp <= goal.closedAt
  );

  const raised = validZaps.reduce((sum, zap) => sum + zap.amount, 0);
  const percentage = (raised / goal.amount) * 100;

  return {
    raised,
    target: goal.amount,
    percentage: Math.round(percentage * 100) / 100,
    zapCount: validZaps.length,
    isClosed,
  };
}

/**
 * Formats millisatoshis to a human-readable string
 */
export function formatSats(millisats: number): string {
  const sats = Math.floor(millisats / 1000);
  
  if (sats >= 100_000_000) {
    return `${(sats / 100_000_000).toFixed(2)} BTC`;
  } else if (sats >= 1_000_000) {
    return `${(sats / 1_000_000).toFixed(2)}M sats`;
  } else if (sats >= 1_000) {
    return `${(sats / 1_000).toFixed(1)}k sats`;
  } else {
    return `${sats} sats`;
  }
}

/**
 * Sorts goals by "trending" - combines recent activity with total raised
 */
export function calculateTrendingScore(
  goal: ZapGoal,
  progress: ZapGoalProgress,
  recentZaps: ZapReceipt[]
): number {
  const ageInDays = (Date.now() / 1000 - goal.createdAt) / (24 * 60 * 60);
  const ageFactor = Math.max(0, 1 - ageInDays / 30); // Decay over 30 days
  
  // Recent zaps in last 24 hours
  const oneDayAgo = Date.now() / 1000 - 24 * 60 * 60;
  const recentZapCount = recentZaps.filter(z => z.timestamp > oneDayAgo).length;
  const recentAmount = recentZaps
    .filter(z => z.timestamp > oneDayAgo)
    .reduce((sum, z) => sum + z.amount, 0);

  // Score combines: completion percentage, recent activity, and age
  return (
    progress.percentage * 0.3 +
    recentZapCount * 10 +
    (recentAmount / 1_000_000) * 0.5 +
    ageFactor * 20
  );
}
