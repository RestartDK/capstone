-- Migration: Setup zone progress triggers for SHOTS and PEOPLE strategies
-- and auto-release trigger when releaseDate is reached.
--
-- Implements CORE-1713: Fix unlock flow server side
--
-- Triggers created:
--   1. trg_zone_progress_shots   - auto-increment on new Ride (naiss shot)
--   2. trg_zone_progress_people  - auto-increment on new Profile with institution_id
--   3. trg_zone_progress_release - auto-release when releaseDate has passed
--
-- Helper RPCs exposed for SDK manual calls:
--   increment_zone_progress_shots(p_institution_id, p_zone)
--   increment_zone_progress_people(p_institution_id, p_zone)

-- ---------------------------------------------------------------------------
-- 1. Helper function: attempt to achieve target and set release fields
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_and_achieve_zone_target(
  p_institution_id uuid,
  p_zone text
)
RETURNS void AS $$
BEGIN
  UPDATE "ZoneProgressStrategies"
  SET
    "achievedTarget"     = true,
    "achievedTargetDate" = now(),
    -- releaseDate is set only if not manually overridden
    "releaseDate"        = COALESCE(
                             "releaseDate",
                             now() + ("daysToRelease" * interval '1 day')
                           ),
    "updated_at"         = now()
  WHERE
    "institution_id" = p_institution_id
    AND "zone"        = p_zone
    AND "released"    = false
    AND "achievedTarget" = false
    AND "currentCount" >= "target";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. RPC: increment_zone_progress_shots
--    Called by SDK shots strategy and by trg_zone_progress_shots trigger.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_zone_progress_shots(
  p_institution_id uuid,
  p_zone text
)
RETURNS void AS $$
BEGIN
  UPDATE "ZoneProgressStrategies"
  SET
    "currentCount" = "currentCount" + 1,
    "updated_at"   = now()
  WHERE
    "institution_id" = p_institution_id
    AND "zone"        = p_zone
    AND "strategy"    = 'SHOTS'
    AND "released"    = false
    AND "achievedTarget" = false;

  PERFORM check_and_achieve_zone_target(p_institution_id, p_zone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. RPC: increment_zone_progress_people
--    Called by SDK people strategy and by trg_zone_progress_people trigger.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_zone_progress_people(
  p_institution_id uuid,
  p_zone text
)
RETURNS void AS $$
BEGIN
  UPDATE "ZoneProgressStrategies"
  SET
    "currentCount" = "currentCount" + 1,
    "updated_at"   = now()
  WHERE
    "institution_id" = p_institution_id
    AND "zone"        = p_zone
    AND "strategy"    = 'PEOPLE'
    AND "released"    = false
    AND "achievedTarget" = false;

  PERFORM check_and_achieve_zone_target(p_institution_id, p_zone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 4. Trigger function: auto-increment SHOTS on new Ride (naiss shot)
--    Fires AFTER INSERT on "Ride".
--    Uses host_id (driver/creator) to look up institution.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_zone_progress_shots()
RETURNS TRIGGER AS $$
DECLARE
  v_institution_id uuid;
BEGIN
  -- Resolve the institution of the ride creator
  SELECT p."institution_id"
  INTO v_institution_id
  FROM "Profile" p
  WHERE p."id" = NEW."host_id";

  IF v_institution_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Increment for every zone that uses the SHOTS strategy for this institution
  PERFORM increment_zone_progress_shots(v_institution_id, zps."zone")
  FROM "ZoneProgressStrategies" zps
  WHERE zps."institution_id" = v_institution_id
    AND zps."strategy"       = 'SHOTS'
    AND zps."released"       = false
    AND zps."achievedTarget" = false;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_zone_progress_shots ON "Ride";
CREATE TRIGGER trg_zone_progress_shots
  AFTER INSERT ON "Ride"
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_zone_progress_shots();

-- ---------------------------------------------------------------------------
-- 5. Trigger function: auto-increment PEOPLE on new Profile with institution
--    Fires AFTER INSERT OR UPDATE OF institution_id on "Profile".
--    Only increments when institution_id transitions from NULL → non-NULL
--    (i.e., when a user verifies their university or accepts an invitation).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_zone_progress_people()
RETURNS TRIGGER AS $$
DECLARE
  v_institution_id uuid;
BEGIN
  -- Determine the new institution_id
  v_institution_id := NEW."institution_id";

  IF v_institution_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only fire when institution_id is being set for the first time
  IF TG_OP = 'UPDATE' AND OLD."institution_id" = NEW."institution_id" THEN
    RETURN NEW;
  END IF;

  -- Increment for every zone that uses the PEOPLE strategy for this institution
  PERFORM increment_zone_progress_people(v_institution_id, zps."zone")
  FROM "ZoneProgressStrategies" zps
  WHERE zps."institution_id" = v_institution_id
    AND zps."strategy"       = 'PEOPLE'
    AND zps."released"       = false
    AND zps."achievedTarget" = false;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_zone_progress_people ON "Profile";
CREATE TRIGGER trg_zone_progress_people
  AFTER INSERT OR UPDATE OF "institution_id" ON "Profile"
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_zone_progress_people();

-- ---------------------------------------------------------------------------
-- 6. Trigger function: auto-release zone when releaseDate has passed
--    Fires AFTER UPDATE on "ZoneProgressStrategies".
--    When achievedTarget becomes true (or releaseDate is set/updated),
--    check if the releaseDate is already in the past and immediately release.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_zone_progress_release()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process rows that have achieved their target and have a releaseDate
  IF NEW."achievedTarget" = true
     AND NEW."released" = false
     AND NEW."releaseDate" IS NOT NULL
     AND NEW."releaseDate" <= now()
  THEN
    UPDATE "ZoneProgressStrategies"
    SET
      "released"   = true,
      "updated_at" = now()
    WHERE "id" = NEW."id";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_zone_progress_release ON "ZoneProgressStrategies";
CREATE TRIGGER trg_zone_progress_release
  AFTER UPDATE OF "achievedTarget", "releaseDate" ON "ZoneProgressStrategies"
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_zone_progress_release();

-- ---------------------------------------------------------------------------
-- 7. RLS policies for ZoneProgressStrategies
--    Explicit per-operation policies (avoid FOR ALL which silently blocks UPDATEs).
-- ---------------------------------------------------------------------------
ALTER TABLE "ZoneProgressStrategies" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zps_select" ON "ZoneProgressStrategies";
CREATE POLICY "zps_select"
  ON "ZoneProgressStrategies"
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "zps_insert" ON "ZoneProgressStrategies";
CREATE POLICY "zps_insert"
  ON "ZoneProgressStrategies"
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "zps_update" ON "ZoneProgressStrategies";
CREATE POLICY "zps_update"
  ON "ZoneProgressStrategies"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "zps_delete" ON "ZoneProgressStrategies";
CREATE POLICY "zps_delete"
  ON "ZoneProgressStrategies"
  FOR DELETE
  USING (true);

-- ---------------------------------------------------------------------------
-- 8. pg_cron job: daily sweep to release zones whose releaseDate has passed
--    This handles the edge case where the trigger fires but the row was
--    already in the achieved state with a future releaseDate, and time passes.
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'zone-progress-auto-release',
  '0 * * * *',   -- every hour
  $$
    UPDATE "ZoneProgressStrategies"
    SET
      "released"   = true,
      "updated_at" = now()
    WHERE
      "achievedTarget" = true
      AND "released"   = false
      AND "releaseDate" IS NOT NULL
      AND "releaseDate" <= now();
  $$
);
