"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { interfaceVersionLegend } from "@/lib/interface-version";

function PreferenceRow(props: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  const opts = [
    { v: "A", label: "Version A" },
    { v: "B", label: "Version B" },
    { v: "same", label: "No preference / about the same" },
  ] as const;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{props.label}</p>
      <div className="flex flex-col gap-2">
        {opts.map((o) => (
          <label
            key={o.v}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
          >
            <input
              type="radio"
              name={props.name}
              value={o.v}
              checked={props.value === o.v}
              onChange={() => props.onChange(o.v)}
              className="accent-primary"
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function FinalQuestions(props: {
  /** When set, shows which interface modes A and B referred to for this participant. */
  baselineIsVersionA: boolean | null;
  onSubmit: (r: {
    final_preference: string;
    final_helpfulness: string;
    final_intrusiveness: string;
    final_real_life: string;
    final_comments: string;
  }) => void;
  disabled?: boolean;
}): React.ReactElement {
  const [final_preference, setFinal_preference] = React.useState("");
  const [final_helpfulness, setFinal_helpfulness] = React.useState("");
  const [final_intrusiveness, setFinal_intrusiveness] = React.useState("");
  const [final_real_life, setFinal_real_life] = React.useState("");
  const [final_comments, setFinal_comments] = React.useState("");

  const canSubmit =
    final_preference &&
    final_helpfulness &&
    final_intrusiveness &&
    final_real_life &&
    !props.disabled;

  const legend =
    props.baselineIsVersionA != null ? interfaceVersionLegend(props.baselineIsVersionA) : null;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-lg font-medium">Final questions</h1>
      <p className="text-sm text-muted-foreground">
        You used two versions of the same tool, called{" "}
        <strong>Version A</strong> and <strong>Version B</strong>. Below is what
        those labels meant for <strong>your</strong> session — use this when you
        answer.
      </p>
      {legend ? (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Which version had assistance?
          </p>
          <p className="mt-2">
            One version was always the plain interface; the other could show
            temporary on-screen help. For you specifically:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>{legend.lineA}</li>
            <li>{legend.lineB}</li>
          </ul>
        </div>
      ) : null}
      <PreferenceRow
        name="final_preference"
        label="Overall, which version of the interface did you prefer?"
        value={final_preference}
        onChange={setFinal_preference}
      />
      <PreferenceRow
        name="final_helpfulness"
        label="Overall, which version felt more helpful?"
        value={final_helpfulness}
        onChange={setFinal_helpfulness}
      />
      <PreferenceRow
        name="final_intrusiveness"
        label="Overall, which version felt more intrusive?"
        value={final_intrusiveness}
        onChange={setFinal_intrusiveness}
      />
      <PreferenceRow
        name="final_real_life"
        label="If you were using this in real life, which would you rather use?"
        value={final_real_life}
        onChange={setFinal_real_life}
      />
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="comments">
          Optional: any final comments?
        </label>
        <textarea
          id="comments"
          value={final_comments}
          onChange={(e) => setFinal_comments(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="What felt useful, confusing, or disruptive?"
        />
      </div>
      <Button
        className="w-full"
        disabled={!canSubmit}
        onClick={() =>
          props.onSubmit({
            final_preference,
            final_helpfulness,
            final_intrusiveness,
            final_real_life,
            final_comments,
          })
        }
      >
        Finish
      </Button>
    </div>
  );
}
