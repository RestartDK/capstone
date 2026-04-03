-- ============================================================================
-- Analysis queries for the ephemeral UI user study
-- ============================================================================
-- Run these against your production PostgreSQL database.
-- Each section corresponds to a subsection in results.tex.
--
-- For CSV exports (marked with COPY), use psql:
--   psql $DATABASE_URL -f queries.sql
-- Or run individual queries and use \copy in psql.
--
-- For the statistical tests (Wilcoxon, McNemar, binomial), export the paired
-- CSV files and run them in R or Python. A companion script is provided at
-- analysis/run_tests.py.
-- ============================================================================


-- ============================================================================
-- 0. VALID PARTICIPANTS (reusable CTE)
-- ============================================================================
-- A participant is valid if they completed both trials AND answered all four
-- final questions. Use this CTE in every query below.
-- ============================================================================

-- You can paste this CTE at the top of any query:
--
-- WITH valid_participants AS (
--   SELECT p.id, p.age_range, p.occupation,
--          p.web_app_familiarity, p.ai_tool_familiarity,
--          p.baseline_is_version_a
--   FROM participants p
--   WHERE (SELECT count(*) FROM trials t
--          WHERE t.participant_id = p.id AND t.completed = true) = 2
--     AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
--          WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
--            AND qr.question_key IN ('final_preference','final_helpfulness',
--                                    'final_intrusiveness','final_real_life')) = 4
-- )


-- ============================================================================
-- 1. PARTICIPANTS AND DEMOGRAPHICS
-- ============================================================================

-- 1a. Total vs valid participant counts
WITH valid_participants AS (
  SELECT p.id, p.age_range, p.occupation,
         p.web_app_familiarity, p.ai_tool_familiarity,
         p.baseline_is_version_a
  FROM participants p
  WHERE (SELECT count(*) FROM trials t
         WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  (SELECT count(*) FROM participants) AS total_accessed,
  (SELECT count(*) FROM participants WHERE consented_at IS NOT NULL) AS consented,
  count(*) AS valid_completed
FROM valid_participants;


-- 1b. Demographics breakdown
WITH valid_participants AS (
  SELECT p.id, p.age_range, p.occupation,
         p.web_app_familiarity, p.ai_tool_familiarity,
         p.baseline_is_version_a
  FROM participants p
  WHERE (SELECT count(*) FROM trials t
         WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  age_range,
  count(*) AS n,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY web_app_familiarity) AS median_web,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY ai_tool_familiarity) AS median_ai
FROM valid_participants
GROUP BY age_range
ORDER BY age_range;


-- 1c. Counterbalancing check
WITH valid_participants AS (
  SELECT p.id, p.baseline_is_version_a
  FROM participants p
  WHERE (SELECT count(*) FROM trials t
         WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  count(*) FILTER (WHERE baseline_is_version_a = true) AS baseline_first,
  count(*) FILTER (WHERE baseline_is_version_a = false) AS ephemeral_first
FROM valid_participants;


-- ============================================================================
-- 2. TASK COMPLETION RATE
-- ============================================================================

-- 2a. Completion rate per condition
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT t.condition,
       count(*) AS n,
       count(*) FILTER (WHERE t.completed AND t.correct) AS completed_correct,
       round(100.0 * count(*) FILTER (WHERE t.completed AND t.correct) / count(*), 1) AS pct
FROM trials t
JOIN valid_participants v ON v.id = t.participant_id
GROUP BY t.condition;


-- 2b. Paired data for McNemar's test (export as CSV)
-- \copy ( <query> ) TO 'analysis/csv/mcnemar_completion.csv' WITH CSV HEADER
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  b.participant_id,
  (b.completed AND b.correct)::int AS baseline_correct,
  (e.completed AND e.correct)::int AS ephemeral_correct
FROM trials b
JOIN trials e ON e.participant_id = b.participant_id AND e.condition = 'ephemeral'
JOIN valid_participants v ON v.id = b.participant_id
WHERE b.condition = 'baseline';


-- ============================================================================
-- 3. TASK COMPLETION TIME
-- ============================================================================

-- 3a. Descriptive stats per condition
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT t.condition,
       count(*) AS n,
       round(avg(t.duration_ms / 1000.0)::numeric, 1) AS mean_sec,
       round(percentile_cont(0.5) WITHIN GROUP (ORDER BY t.duration_ms / 1000.0)::numeric, 1) AS median_sec,
       round(percentile_cont(0.25) WITHIN GROUP (ORDER BY t.duration_ms / 1000.0)::numeric, 1) AS q1_sec,
       round(percentile_cont(0.75) WITHIN GROUP (ORDER BY t.duration_ms / 1000.0)::numeric, 1) AS q3_sec
FROM trials t
JOIN valid_participants v ON v.id = t.participant_id
WHERE t.completed = true
GROUP BY t.condition;


-- 3b. Paired time data for Wilcoxon (export as CSV)
-- \copy ( <query> ) TO 'analysis/csv/paired_time.csv' WITH CSV HEADER
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  b.participant_id,
  round((b.duration_ms / 1000.0)::numeric, 2) AS baseline_sec,
  round((e.duration_ms / 1000.0)::numeric, 2) AS ephemeral_sec
FROM trials b
JOIN trials e ON e.participant_id = b.participant_id AND e.condition = 'ephemeral'
JOIN valid_participants v ON v.id = b.participant_id
WHERE b.condition = 'baseline'
  AND b.completed = true AND e.completed = true;


-- ============================================================================
-- 4. INTERACTION COUNT
-- ============================================================================

-- 4a. Descriptive stats per condition
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT t.condition,
       count(*) AS n,
       round(avg(t.interaction_count)::numeric, 1) AS mean_interactions,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY t.interaction_count) AS median_interactions,
       percentile_cont(0.25) WITHIN GROUP (ORDER BY t.interaction_count) AS q1,
       percentile_cont(0.75) WITHIN GROUP (ORDER BY t.interaction_count) AS q3
FROM trials t
JOIN valid_participants v ON v.id = t.participant_id
WHERE t.completed = true
GROUP BY t.condition;


-- 4b. Paired interaction data for Wilcoxon (export as CSV)
-- \copy ( <query> ) TO 'analysis/csv/paired_interactions.csv' WITH CSV HEADER
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  b.participant_id,
  b.interaction_count AS baseline_interactions,
  e.interaction_count AS ephemeral_interactions
FROM trials b
JOIN trials e ON e.participant_id = b.participant_id AND e.condition = 'ephemeral'
JOIN valid_participants v ON v.id = b.participant_id
WHERE b.condition = 'baseline'
  AND b.completed = true AND e.completed = true;


-- ============================================================================
-- 5. SUBJECTIVE RATINGS (POST-TRIAL LIKERT)
-- ============================================================================

-- 5a. Descriptive stats per condition and question
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT t.condition, qr.question_key,
       count(*) AS n,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY qr.response_value::int) AS median_rating,
       percentile_cont(0.25) WITHIN GROUP (ORDER BY qr.response_value::int) AS q1,
       percentile_cont(0.75) WITHIN GROUP (ORDER BY qr.response_value::int) AS q3
FROM questionnaire_responses qr
JOIN trials t ON t.id = qr.trial_id
JOIN valid_participants v ON v.id = qr.participant_id
WHERE qr.question_key IN ('helpfulness', 'intrusiveness', 'control')
GROUP BY t.condition, qr.question_key
ORDER BY qr.question_key, t.condition;


-- 5b. Paired Likert data for Wilcoxon (export as CSV)
-- \copy ( <query> ) TO 'analysis/csv/paired_likert.csv' WITH CSV HEADER
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  b_qr.participant_id,
  b_qr.question_key,
  b_qr.response_value::int AS baseline_rating,
  e_qr.response_value::int AS ephemeral_rating
FROM questionnaire_responses b_qr
JOIN trials b_t ON b_t.id = b_qr.trial_id AND b_t.condition = 'baseline'
JOIN trials e_t ON e_t.participant_id = b_t.participant_id AND e_t.condition = 'ephemeral'
JOIN questionnaire_responses e_qr ON e_qr.trial_id = e_t.id
                                 AND e_qr.question_key = b_qr.question_key
JOIN valid_participants v ON v.id = b_qr.participant_id
WHERE b_qr.question_key IN ('helpfulness', 'intrusiveness', 'control');


-- ============================================================================
-- 6. OVERALL PREFERENCE (FINAL QUESTIONS)
-- ============================================================================

-- 6a. Raw A/B/same counts
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT qr.question_key, qr.response_value, count(*) AS n
FROM questionnaire_responses qr
JOIN valid_participants v ON v.id = qr.participant_id
WHERE qr.trial_id IS NULL
  AND qr.question_key IN ('final_preference', 'final_helpfulness',
                          'final_intrusiveness', 'final_real_life')
GROUP BY qr.question_key, qr.response_value
ORDER BY qr.question_key, qr.response_value;


-- 6b. Mapped to actual condition (baseline / ephemeral / no_preference)
-- \copy ( <query> ) TO 'analysis/csv/final_preference_mapped.csv' WITH CSV HEADER
WITH valid_participants AS (
  SELECT p.id, p.baseline_is_version_a FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  qr.question_key,
  CASE
    WHEN qr.response_value = 'same' THEN 'no_preference'
    WHEN (qr.response_value = 'A' AND v.baseline_is_version_a)
      OR (qr.response_value = 'B' AND NOT v.baseline_is_version_a)
      THEN 'baseline'
    ELSE 'ephemeral'
  END AS actual_preference,
  count(*) AS n
FROM questionnaire_responses qr
JOIN valid_participants v ON v.id = qr.participant_id
WHERE qr.trial_id IS NULL
  AND qr.question_key IN ('final_preference', 'final_helpfulness',
                          'final_intrusiveness', 'final_real_life')
GROUP BY qr.question_key, actual_preference
ORDER BY qr.question_key, actual_preference;


-- ============================================================================
-- 7. EPHEMERAL SUPPORT ENGAGEMENT
-- ============================================================================

-- 7a. Per-event-type counts across all ephemeral trials
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  count(DISTINCT te.trial_id) FILTER (WHERE te.event_type = 'support_triggered') AS trials_triggered,
  count(DISTINCT te.trial_id) FILTER (WHERE te.event_type = 'support_requested') AS trials_requested,
  count(DISTINCT te.trial_id) FILTER (WHERE te.event_type = 'support_shown') AS trials_shown,
  count(DISTINCT te.trial_id) FILTER (WHERE te.event_type = 'support_used') AS trials_used,
  count(DISTINCT te.trial_id) FILTER (WHERE te.event_type = 'support_dismissed') AS trials_dismissed,
  count(DISTINCT te.trial_id) FILTER (WHERE te.event_type = 'support_ignored') AS trials_ignored,
  count(DISTINCT te.trial_id) FILTER (WHERE te.event_type = 'support_inspect_expanded') AS trials_expanded
FROM trial_events te
JOIN trials t ON t.id = te.trial_id AND t.condition = 'ephemeral'
JOIN valid_participants v ON v.id = te.participant_id;


-- 7b. Per-participant support event breakdown (export as CSV)
-- \copy ( <query> ) TO 'analysis/csv/ephemeral_engagement.csv' WITH CSV HEADER
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  te.participant_id,
  te.event_type,
  count(*) AS event_count
FROM trial_events te
JOIN trials t ON t.id = te.trial_id AND t.condition = 'ephemeral'
JOIN valid_participants v ON v.id = te.participant_id
WHERE te.event_type IN ('support_triggered', 'support_requested',
                        'support_shown', 'support_used',
                        'support_dismissed', 'support_ignored',
                        'support_inspect_expanded')
GROUP BY te.participant_id, te.event_type
ORDER BY te.participant_id, te.event_type;


-- 7c. Fallback rate
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  count(*) AS total_generations,
  count(*) FILTER (WHERE (so.output->>'usedFallback')::boolean = true) AS fallback_count,
  round(100.0 * count(*) FILTER (WHERE (so.output->>'usedFallback')::boolean = true)
        / NULLIF(count(*), 0), 1) AS fallback_pct
FROM support_outputs so
JOIN trials t ON t.id = so.trial_id
JOIN valid_participants v ON v.id = t.participant_id;


-- ============================================================================
-- 8. CSV EXPORTS FOR GRAPHS
-- ============================================================================
-- Run these with psql \copy to produce graph-ready CSVs.
-- Create the output directory first:  mkdir -p analysis/csv
-- ============================================================================

-- 8a. Paired completion time (for paired line/dot plot)
-- \copy ( <query 3b above> ) TO 'analysis/csv/paired_time.csv' WITH CSV HEADER

-- 8b. Paired interaction count (for paired line/dot plot)
-- \copy ( <query 4b above> ) TO 'analysis/csv/paired_interactions.csv' WITH CSV HEADER

-- 8c. Paired Likert ratings (for grouped bar or diverging stacked bar chart)
-- \copy ( <query 5b above> ) TO 'analysis/csv/paired_likert.csv' WITH CSV HEADER

-- 8d. Final preference mapped (for stacked bar chart)
-- \copy ( <query 6b above> ) TO 'analysis/csv/final_preference_mapped.csv' WITH CSV HEADER

-- 8e. Ephemeral engagement per participant (for summary table or heatmap)
-- \copy ( <query 7b above> ) TO 'analysis/csv/ephemeral_engagement.csv' WITH CSV HEADER

-- 8f. Full paired dataset (all measures in one row per participant)
-- \copy ( <query below> ) TO 'analysis/csv/full_paired.csv' WITH CSV HEADER
WITH valid_participants AS (
  SELECT p.id, p.age_range, p.web_app_familiarity, p.ai_tool_familiarity,
         p.baseline_is_version_a
  FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT
  v.id AS participant_id,
  v.age_range,
  v.web_app_familiarity,
  v.ai_tool_familiarity,
  v.baseline_is_version_a,
  -- Behavioural
  b.duration_ms AS baseline_duration_ms,
  e.duration_ms AS ephemeral_duration_ms,
  b.interaction_count AS baseline_interactions,
  e.interaction_count AS ephemeral_interactions,
  (b.completed AND b.correct)::int AS baseline_correct,
  (e.completed AND e.correct)::int AS ephemeral_correct,
  -- Post-trial Likert (baseline)
  (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = b.id AND question_key = 'helpfulness') AS baseline_helpfulness,
  (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = b.id AND question_key = 'intrusiveness') AS baseline_intrusiveness,
  (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = b.id AND question_key = 'control') AS baseline_control,
  -- Post-trial Likert (ephemeral)
  (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = e.id AND question_key = 'helpfulness') AS ephemeral_helpfulness,
  (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = e.id AND question_key = 'intrusiveness') AS ephemeral_intrusiveness,
  (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = e.id AND question_key = 'control') AS ephemeral_control,
  -- Final preference (mapped to condition)
  (SELECT CASE
     WHEN qr.response_value = 'same' THEN 'no_preference'
     WHEN (qr.response_value = 'A' AND v.baseline_is_version_a)
       OR (qr.response_value = 'B' AND NOT v.baseline_is_version_a) THEN 'baseline'
     ELSE 'ephemeral'
   END FROM questionnaire_responses qr
   WHERE qr.participant_id = v.id AND qr.trial_id IS NULL
     AND qr.question_key = 'final_preference') AS final_preference,
  (SELECT CASE
     WHEN qr.response_value = 'same' THEN 'no_preference'
     WHEN (qr.response_value = 'A' AND v.baseline_is_version_a)
       OR (qr.response_value = 'B' AND NOT v.baseline_is_version_a) THEN 'baseline'
     ELSE 'ephemeral'
   END FROM questionnaire_responses qr
   WHERE qr.participant_id = v.id AND qr.trial_id IS NULL
     AND qr.question_key = 'final_real_life') AS final_real_life
FROM valid_participants v
JOIN trials b ON b.participant_id = v.id AND b.condition = 'baseline'
JOIN trials e ON e.participant_id = v.id AND e.condition = 'ephemeral';


-- ============================================================================
-- 9. OPTIONAL: FINAL COMMENTS (qualitative)
-- ============================================================================

-- All free-text comments
WITH valid_participants AS (
  SELECT p.id FROM participants p
  WHERE (SELECT count(*) FROM trials t WHERE t.participant_id = p.id AND t.completed = true) = 2
    AND (SELECT count(DISTINCT question_key) FROM questionnaire_responses qr
         WHERE qr.participant_id = p.id AND qr.trial_id IS NULL
           AND qr.question_key IN ('final_preference','final_helpfulness',
                                   'final_intrusiveness','final_real_life')) = 4
)
SELECT qr.participant_id, qr.response_value AS comment
FROM questionnaire_responses qr
JOIN valid_participants v ON v.id = qr.participant_id
WHERE qr.question_key = 'final_comments'
  AND qr.response_value IS NOT NULL
  AND qr.response_value != '';
