/**
 * Export study data as CSVs for analysis and graphing.
 *
 * Uses Bun's native PostgreSQL driver (`SQL` from "bun").
 *
 * Usage (from this directory):
 *   bun install
 *   bun run export
 *
 * DATABASE_URL should be in the environment. When you run this from `analysis/`,
 * Bun loads `.env` (and `.env.local`, etc.) automatically — no `dotenv` package.
 * If `DATABASE_URL` lives only in `artifact/.env`, run:
 *   bun --env-file=../artifact/.env run export-csv.ts
 */

import { SQL } from "bun";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

const OUTPUT_DIR = join(dirname(new URL(import.meta.url).pathname), "csv");
mkdirSync(OUTPUT_DIR, { recursive: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Add it to analysis/.env or artifact/.env.");
}

const db = new SQL(databaseUrl);

const VALID_PARTICIPANTS_CTE = db`
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
`;

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => {
      const v = row[h];
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    }).join(","));
  }
  return lines.join("\n") + "\n";
}

function save(filename: string, rows: Record<string, unknown>[]) {
  const path = join(OUTPUT_DIR, filename);
  writeFileSync(path, toCsv(rows));
  console.log(`  ✓ ${filename} (${rows.length} rows)`);
}

async function main() {
  console.log("Exporting study data to analysis/csv/\n");

  // 1. Participant overview
  const overview = await db`
    SELECT
      (SELECT count(*) FROM participants)::int AS total_accessed,
      (SELECT count(*) FROM participants WHERE consented_at IS NOT NULL)::int AS consented,
      (SELECT count(*) FROM (${VALID_PARTICIPANTS_CTE}) vp)::int AS valid_completed
  `;
  const first = overview[0] as {
    total_accessed: number;
    consented: number;
    valid_completed: number;
  };
  console.log(
    `  Participants: ${first.total_accessed} accessed, ${first.consented} consented, ${first.valid_completed} valid\n`,
  );
  save("overview.csv", [
    {
      total_accessed: first.total_accessed,
      consented: first.consented,
      valid_completed: first.valid_completed,
    },
  ]);

  // 2. Demographics
  const demographics = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT age_range, count(*)::int AS n,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY web_app_familiarity) AS median_web,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY ai_tool_familiarity) AS median_ai
    FROM vp GROUP BY age_range ORDER BY age_range
  `;
  save("demographics.csv", demographics as Record<string, unknown>[]);

  // 3. Counterbalancing
  const counterbalance = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT
      count(*) FILTER (WHERE baseline_is_version_a = true)::int AS baseline_first,
      count(*) FILTER (WHERE baseline_is_version_a = false)::int AS ephemeral_first
    FROM vp
  `;
  save("counterbalancing.csv", counterbalance as Record<string, unknown>[]);

  // 4. Completion rate per condition
  const completionRate = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT t.condition,
           count(*)::int AS n,
           count(*) FILTER (WHERE t.completed AND t.correct)::int AS completed_correct,
           round(100.0 * count(*) FILTER (WHERE t.completed AND t.correct) / count(*), 1) AS pct
    FROM trials t JOIN vp ON vp.id = t.participant_id
    GROUP BY t.condition
  `;
  save("completion_rate.csv", completionRate as Record<string, unknown>[]);

  // 5. McNemar paired data
  const mcnemar = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT b.participant_id,
           (b.completed AND b.correct)::int AS baseline_correct,
           (e.completed AND e.correct)::int AS ephemeral_correct
    FROM trials b
    JOIN trials e ON e.participant_id = b.participant_id AND e.condition = 'ephemeral'
    JOIN vp ON vp.id = b.participant_id
    WHERE b.condition = 'baseline'
  `;
  save("mcnemar_completion.csv", mcnemar as Record<string, unknown>[]);

  // 6. Paired completion time
  const pairedTime = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT b.participant_id,
           round((b.duration_ms / 1000.0)::numeric, 2) AS baseline_sec,
           round((e.duration_ms / 1000.0)::numeric, 2) AS ephemeral_sec
    FROM trials b
    JOIN trials e ON e.participant_id = b.participant_id AND e.condition = 'ephemeral'
    JOIN vp ON vp.id = b.participant_id
    WHERE b.condition = 'baseline' AND b.completed = true AND e.completed = true
  `;
  save("paired_time.csv", pairedTime as Record<string, unknown>[]);

  // 7. Paired interaction count
  const pairedInteractions = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT b.participant_id,
           b.interaction_count::int AS baseline_interactions,
           e.interaction_count::int AS ephemeral_interactions
    FROM trials b
    JOIN trials e ON e.participant_id = b.participant_id AND e.condition = 'ephemeral'
    JOIN vp ON vp.id = b.participant_id
    WHERE b.condition = 'baseline' AND b.completed = true AND e.completed = true
  `;
  save("paired_interactions.csv", pairedInteractions as Record<string, unknown>[]);

  // 8. Paired Likert ratings
  const pairedLikert = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT b_qr.participant_id,
           b_qr.question_key,
           b_qr.response_value::int AS baseline_rating,
           e_qr.response_value::int AS ephemeral_rating
    FROM questionnaire_responses b_qr
    JOIN trials b_t ON b_t.id = b_qr.trial_id AND b_t.condition = 'baseline'
    JOIN trials e_t ON e_t.participant_id = b_t.participant_id AND e_t.condition = 'ephemeral'
    JOIN questionnaire_responses e_qr ON e_qr.trial_id = e_t.id
                                     AND e_qr.question_key = b_qr.question_key
    JOIN vp ON vp.id = b_qr.participant_id
    WHERE b_qr.question_key IN ('helpfulness', 'intrusiveness', 'control')
  `;
  save("paired_likert.csv", pairedLikert as Record<string, unknown>[]);

  // 9. Final preference mapped to actual condition
  const prefMapped = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT qr.question_key,
           CASE
             WHEN qr.response_value = 'same' THEN 'no_preference'
             WHEN (qr.response_value = 'A' AND vp.baseline_is_version_a)
               OR (qr.response_value = 'B' AND NOT vp.baseline_is_version_a) THEN 'baseline'
             ELSE 'ephemeral'
           END AS actual_preference,
           count(*)::int AS n
    FROM questionnaire_responses qr
    JOIN vp ON vp.id = qr.participant_id
    WHERE qr.trial_id IS NULL
      AND qr.question_key IN ('final_preference','final_helpfulness',
                              'final_intrusiveness','final_real_life')
    GROUP BY qr.question_key, actual_preference
    ORDER BY qr.question_key, actual_preference
  `;
  save("final_preference_mapped.csv", prefMapped as Record<string, unknown>[]);

  // 10. Ephemeral engagement per participant
  const engagement = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT te.participant_id, te.event_type, count(*)::int AS event_count
    FROM trial_events te
    JOIN trials t ON t.id = te.trial_id AND t.condition = 'ephemeral'
    JOIN vp ON vp.id = te.participant_id
    WHERE te.event_type IN ('support_triggered','support_requested','support_shown',
                            'support_used','support_dismissed','support_ignored',
                            'support_inspect_expanded')
    GROUP BY te.participant_id, te.event_type
    ORDER BY te.participant_id, te.event_type
  `;
  save("ephemeral_engagement.csv", engagement as Record<string, unknown>[]);

  // 11. Fallback rate
  const fallback = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT count(*)::int AS total_generations,
           count(*) FILTER (WHERE (so.output->>'usedFallback')::boolean = true)::int AS fallback_count,
           round(100.0 * count(*) FILTER (WHERE (so.output->>'usedFallback')::boolean = true)
                 / NULLIF(count(*), 0), 1) AS fallback_pct
    FROM support_outputs so
    JOIN trials t ON t.id = so.trial_id
    JOIN vp ON vp.id = t.participant_id
  `;
  save("fallback_rate.csv", fallback as Record<string, unknown>[]);

  // 12. Full paired dataset (one row per participant, all measures)
  const fullPaired = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT
      vp.id AS participant_id, vp.age_range,
      vp.web_app_familiarity, vp.ai_tool_familiarity,
      vp.baseline_is_version_a,
      b.duration_ms AS baseline_duration_ms,
      e.duration_ms AS ephemeral_duration_ms,
      b.interaction_count AS baseline_interactions,
      e.interaction_count AS ephemeral_interactions,
      (b.completed AND b.correct)::int AS baseline_correct,
      (e.completed AND e.correct)::int AS ephemeral_correct,
      (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = b.id AND question_key = 'helpfulness') AS baseline_helpfulness,
      (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = b.id AND question_key = 'intrusiveness') AS baseline_intrusiveness,
      (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = b.id AND question_key = 'control') AS baseline_control,
      (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = e.id AND question_key = 'helpfulness') AS ephemeral_helpfulness,
      (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = e.id AND question_key = 'intrusiveness') AS ephemeral_intrusiveness,
      (SELECT response_value::int FROM questionnaire_responses WHERE trial_id = e.id AND question_key = 'control') AS ephemeral_control,
      (SELECT CASE
         WHEN qr.response_value = 'same' THEN 'no_preference'
         WHEN (qr.response_value = 'A' AND vp.baseline_is_version_a)
           OR (qr.response_value = 'B' AND NOT vp.baseline_is_version_a) THEN 'baseline'
         ELSE 'ephemeral'
       END FROM questionnaire_responses qr
       WHERE qr.participant_id = vp.id AND qr.trial_id IS NULL
         AND qr.question_key = 'final_preference') AS final_preference,
      (SELECT CASE
         WHEN qr.response_value = 'same' THEN 'no_preference'
         WHEN (qr.response_value = 'A' AND vp.baseline_is_version_a)
           OR (qr.response_value = 'B' AND NOT vp.baseline_is_version_a) THEN 'baseline'
         ELSE 'ephemeral'
       END FROM questionnaire_responses qr
       WHERE qr.participant_id = vp.id AND qr.trial_id IS NULL
         AND qr.question_key = 'final_real_life') AS final_real_life
    FROM vp
    JOIN trials b ON b.participant_id = vp.id AND b.condition = 'baseline'
    JOIN trials e ON e.participant_id = vp.id AND e.condition = 'ephemeral'
  `;
  save("full_paired.csv", fullPaired as Record<string, unknown>[]);

  // 13. Free-text comments
  const comments = await db`
    WITH vp AS (${VALID_PARTICIPANTS_CTE})
    SELECT qr.participant_id, qr.response_value AS comment
    FROM questionnaire_responses qr
    JOIN vp ON vp.id = qr.participant_id
    WHERE qr.question_key = 'final_comments'
      AND qr.response_value IS NOT NULL AND qr.response_value != ''
  `;
  save("comments.csv", comments as Record<string, unknown>[]);

  console.log("\nDone. Now run: bun run stats");
  await db.close({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
