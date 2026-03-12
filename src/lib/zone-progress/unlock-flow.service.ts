import { SupabaseClient } from '@supabase/supabase-js';
import type {
  UnlockFlowState,
  ZoneProgressStrategy,
} from './unlock-flow.types';

/**
 * Unlock flow logic (server side):
 *
 * 1. no uni                                           → locked
 * 2. user in uni + released = TRUE                    → open
 * 3. user in uni + released = FALSE + achievedTarget = TRUE
 *    → countdown (based on targetDate + daysToRelease or releaseDate if manually set)
 * 4. user in uni + released = FALSE + achievedTarget = FALSE
 *    → show strategy progress (shots / people)
 *    → progress bar first step
 */
export async function getUnlockFlowState(
  supabase: SupabaseClient,
  userId: string,
  zone: string
): Promise<UnlockFlowState> {
  const institutionId = await getUserInstitutionId(supabase, userId);

  if (!institutionId) {
    return { type: 'locked' };
  }

  const strategy = await getZoneProgressStrategy(supabase, institutionId, zone);

  if (!strategy) {
    return { type: 'locked' };
  }

  return resolveUnlockState(strategy);
}

/**
 * Resolves the unlock state purely from a ZoneProgressStrategy row.
 * Exported for unit testing without a live DB connection.
 */
export function resolveUnlockState(strategy: ZoneProgressStrategy): UnlockFlowState {
  if (strategy.released) {
    return { type: 'open' };
  }

  if (strategy.achievedTarget) {
    const releaseDate = computeReleaseDate(strategy);

    if (!releaseDate) {
      return { type: 'open' };
    }

    const now = new Date();
    if (releaseDate <= now) {
      return { type: 'open' };
    }

    const msRemaining = releaseDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return { type: 'countdown', releaseDate, daysRemaining };
  }

  const current = strategy.currentCount ?? 0;
  const target = strategy.target ?? 0;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;

  return {
    type: 'progress',
    strategy: strategy.strategy,
    current,
    target,
    progress,
  };
}

/**
 * Computes the release date from a strategy row.
 *
 * Priority:
 *   1. strategy.releaseDate  (manually set by ops)
 *   2. strategy.targetDate + strategy.daysToRelease
 *   3. strategy.achievedTargetDate + strategy.daysToRelease
 */
export function computeReleaseDate(strategy: ZoneProgressStrategy): Date | null {
  if (strategy.releaseDate) {
    return new Date(strategy.releaseDate);
  }

  const daysToAdd = strategy.daysToRelease ?? 14;

  if (strategy.targetDate) {
    const base = new Date(strategy.targetDate);
    base.setDate(base.getDate() + daysToAdd);
    return base;
  }

  if (strategy.achievedTargetDate) {
    const base = new Date(strategy.achievedTargetDate);
    base.setDate(base.getDate() + daysToAdd);
    return base;
  }

  return null;
}

async function getUserInstitutionId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('Profile')
    .select('institution_id')
    .eq('id', userId)
    .single();

  if (error || !data?.institution_id) {
    return null;
  }

  return data.institution_id as string;
}

async function getZoneProgressStrategy(
  supabase: SupabaseClient,
  institutionId: string,
  zone: string
): Promise<ZoneProgressStrategy | null> {
  const { data, error } = await supabase
    .from('ZoneProgressStrategies')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('zone', zone)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ZoneProgressStrategy;
}
