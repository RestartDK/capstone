"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

function LikertRow(props: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{props.label}</p>
      <div className="flex flex-wrap gap-2">
        {(["1", "2", "3", "4", "5", "6", "7"] as const).map((n) => (
          <label
            key={n}
            className="flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-xs has-[:checked]:border-primary has-[:checked]:bg-primary/10"
          >
            <input
              type="radio"
              name={props.name}
              value={n}
              checked={props.value === n}
              onChange={() => props.onChange(n)}
              className="accent-primary"
            />
            {n}
          </label>
        ))}
      </div>
      <p className="text-[0.65rem] text-muted-foreground">1 = Not at all · 7 = Extremely</p>
    </div>
  );
}

export function PostTrialQuestions(props: {
  onSubmit: (r: { helpfulness: string; intrusiveness: string; control: string }) => void;
  disabled?: boolean;
}): React.ReactElement {
  const [helpfulness, setHelpfulness] = React.useState("");
  const [intrusiveness, setIntrusiveness] = React.useState("");
  const [control, setControl] = React.useState("");

  const canSubmit =
    helpfulness.length > 0 && intrusiveness.length > 0 && control.length > 0 && !props.disabled;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-lg font-medium">After this task</h1>
      <p className="text-sm text-muted-foreground">
        Please rate your experience for the task you just completed.
      </p>
      <LikertRow
        name="helpfulness"
        label="How helpful was the interface for completing this task?"
        value={helpfulness}
        onChange={setHelpfulness}
      />
      <LikertRow
        name="intrusiveness"
        label="How intrusive did the interface feel during this task?"
        value={intrusiveness}
        onChange={setIntrusiveness}
      />
      <LikertRow
        name="control"
        label="How much control did you feel you had while completing this task?"
        value={control}
        onChange={setControl}
      />
      <p className="text-[0.65rem] text-muted-foreground">
        Control: 1 = No control at all · 7 = Complete control
      </p>
      <Button
        className="w-full"
        disabled={!canSubmit}
        onClick={() => props.onSubmit({ helpfulness, intrusiveness, control })}
      >
        Continue
      </Button>
    </div>
  );
}
