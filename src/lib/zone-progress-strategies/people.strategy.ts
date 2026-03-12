import { SupabaseClient } from '@supabase/supabase-js';

/**
 * PEOPLE strategy: zone progress is incremented every time a new user
 * joins the institution (via email verification or invitation acceptance).
 *
 * NOTE: The DB trigger `trg_zone_progress_people` handles automatic
 * increments. This function is kept for manual/SDK-level calls and
 * for backfill purposes.
 */
export async function incrementPeopleProgress(
  supabase: SupabaseClient,
  institutionId: string,
  zone: string
): Promise<{ error: Error | null }> {
  const { error: incrementError } = await supabase.rpc(
    'increment_zone_progress_people',
    { p_institution_id: institutionId, p_zone: zone }
  );

  if (incrementError) {
    return { error: new Error(incrementError.message) };
  }

  return { error: null };
}

/**
 * Returns current people progress for a zone.
 */
export async function getPeopleProgress(
  supabase: SupabaseClient,
  institutionId: string,
  zone: string
): Promise<{ current: number; target: number; error: Error | null }> {
  const { data, error } = await supabase
    .from('ZoneProgressStrategies')
    .select('currentCount, target')
    .eq('institution_id', institutionId)
    .eq('zone', zone)
    .eq('strategy', 'PEOPLE')
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
