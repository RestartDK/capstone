import { SupabaseClient } from '@supabase/supabase-js';

/**
 * SHOTS strategy: zone progress is incremented every time a user
 * in the institution shares a naiss shot (creates a ride).
 *
 * NOTE: The DB trigger `trg_zone_progress_shots` handles automatic
 * increments. This function is kept for manual/SDK-level calls and
 * for backfill purposes.
 */
export async function incrementShotsProgress(
  supabase: SupabaseClient,
  institutionId: string,
  zone: string
): Promise<{ error: Error | null }> {
  const { error: incrementError } = await supabase.rpc(
    'increment_zone_progress_shots',
    { p_institution_id: institutionId, p_zone: zone }
  );

  if (incrementError) {
    return { error: new Error(incrementError.message) };
  }

  return { error: null };
}

/**
 * Returns current shots progress for a zone.
 */
export async function getShotsProgress(
  supabase: SupabaseClient,
  institutionId: string,
  zone: string
): Promise<{ current: number; target: number; error: Error | null }> {
  const { data, error } = await supabase
    .from('ZoneProgressStrategies')
    .select('currentCount, target')
    .eq('institution_id', institutionId)
    .eq('zone', zone)
    .eq('strategy', 'SHOTS')
    .maybeSingle();

  if (error) {
    return { current: 0, target: 0, error: new Error(error.message) };
  }

  return {
    current: data?.currentCount ?? 0,
    target: data?.target ?? 0,
    error: null,
  };
}
