import type { StudyStateResponse } from "./study";

/** Canonical client path for the current study step (except 401). */
export function pathForStudyStep(s: StudyStateResponse): string {
  switch (s.step) {
    case "background":
      return "/participant";
    case "instruction":
      return "/study";
    case "study":
      return "/study";
    case "post_trial":
      return s.postTrialTrialId != null
        ? `/questionnaire?trialId=${s.postTrialTrialId}`
        : "/study";
    case "final":
      return "/final";
    case "complete":
      return "/complete";
  }
}
