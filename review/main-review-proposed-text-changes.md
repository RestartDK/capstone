# Proposed Thesis Text Changes

This list separates:

- `DK` changes: direct wording replacements you gave in the review comments
- `Inferred` changes: edits I am proposing based on the question-and-answer discussion in `review/main-review-comment-answers.md`

Scope notes:

- I included the non-question wording suggestions, the `remove` directives, and the formatting/emphasis/figure-layout comments you later asked to be added.
- Some `remove` comments were plain highlights without recoverable source text in the extracted JSON. Those are included as `tentative` mappings and should be visually confirmed against the annotated PDF before editing.
- For very short one-word comments, I mapped them to the most likely current snippet. Those are marked `tentative` where the anchor is weaker.
- For every direct manual wording change, the reason is simply `DK` as requested.

## DK Changes

1. **Abstract opening**
Location: `sections/abstract.tex`
Before:
`Generative user interfaces have become an active topic in human-computer interaction and AI-supported software design`
After:
`Generative UI has become a broader topic in software design`
Reason: `DK`

2. **Abstract tension sentence**
Location: `sections/abstract.tex`
Before:
`Yet this promise creates a practical tension for productivity software, where users depend on stable layouts, predictable controls, and durable mental models.`
After:
`Yet this promise collides with modern software use, where users still expect stable experiences, predictable controls, and durable mental models.`
Reason: `DK`

3. **Abstract terminology consistency**
Location: `sections/abstract.tex`
Before:
`Generative user interfaces have become...`
After:
`Generative UI has become...`
Reason: `DK`

4. **Abstract evaluation artifact wording**
Location: `sections/abstract.tex`
Before:
`an instrumented comparative study artifact for empirical evaluation`
After:
`an interactive survey artifact for empirical evaluation`
Reason: `DK`

5. **Abstract contribution phrasing**
Location: `sections/abstract.tex`
Before:
`The thesis therefore contributes both a concrete design framework and an empirical basis`
After:
`The thesis therefore contributes a framework, design guidelines, and an empirical basis`
Reason: `DK`

6. **Abstract keywords**
Location: `sections/abstract.tex`
Before:
`Keywords: generative UI, ephemeral interfaces, human-computer interaction, productivity software, design science research`
After:
`Keywords: generative AI, design, UI/UX, web apps, ephemeral interfaces, human-computer interaction, productivity software, design science research`
Reason: `DK`

7. **Introduction: full-interface wording**
Location: `sections/introduction.tex`
Before:
`most of the evidence comes from the context of a fully generated UI`
After:
`most of the evidence comes from fully generated, end-to-end user interfaces`
Reason: `DK`

8. **Introduction: user journeys**
Location: `sections/introduction.tex`
Before:
`predetermined layouts and interaction paths`
After:
`predetermined layouts and user journeys`
Reason: `DK`

9. **Introduction: relearning sentence**
Location: `sections/introduction.tex`
Before:
`orientation is lost: users must relearn the layout, relocate controls, and re-establish their sense of place within the application.`
After:
`orientation is lost so users are required to relearn the interface, how to use it, and where key controls are located.`
Reason: `DK`

10. **Introduction: software-design scope of ephemerality claim**
Location: `sections/introduction.tex`
Before:
`a coherent framework that specifies when ephemeral components should appear, how their scope should be bounded, and how they should be withdrawn without disrupting the user's workflow has not been articulated in prior work.`
After:
`a coherent framework that specifies when ephemeral components should appear, how their scope should be bounded, and how they should be withdrawn without disrupting the user's workflow has not been articulated in prior design work.`
Reason: `DK`

11. **Research contribution wording**
Location: `sections/introduction.tex`
Before:
`it builds an instrumented comparative study artifact`
After:
`it builds an interactive survey artifact`
Reason: `DK`

12. **Methodology: framework origin**
Location: `sections/methodology.tex`
Before:
`a conceptual framework is synthesised from the literature`
After:
`a conceptual framework is constructed from existing literature`
Reason: `DK`

13. **Methodology: inferred-assistance safety clause**
Location: `sections/methodology.tex`
Before:
`these principles impose an additional safety constraint: inferred assistance may suggest or preload options`
After:
`these principles impose an additional safety constraint for inferred assistance where it may suggest or preload options`
Reason: `DK`

14. **Methodology: baseline-interface wording**
Location: `sections/methodology.tex`
Before:
`an original condition representing the baseline experience`
After:
`an original condition using a well-known, conventional interface`
Reason: `DK`

15. **Methodology: journey wording**
Location: `sections/methodology.tex`
Before:
`augment an existing user experience`
After:
`augment the existing user journey`
Reason: `DK`

16. **Methodology: delivery mode wording**
Location: `sections/methodology.tex`
Before:
`The procedure will be fully website-based.`
After:
`The procedure will be fully web-based.`
Reason: `DK`

17. **Methodology: version-sequence wording**
Location: `sections/methodology.tex`
Before:
`a fixed A-then-B sequence`
After:
`a fixed sequence of Version A followed by Version B`
Reason: `DK`

18. **Methodology: measure wording**
Location: `sections/methodology.tex`
Before:
`ephemeral-only interaction logs will record whether temporary support was triggered`
After:
`logs from ephemeral interactions will record whether temporary support was triggered`
Reason: `DK`

19. **Methodology: data-collection wording**
Location: `sections/methodology.tex`
Before:
`In the ephemeral condition, additional logs will capture support trigger events`
After:
`In the ephemeral condition, logs from ephemeral interactions will capture support trigger events`
Reason: `DK`

20. **Discussion: terminology change**
Location: `sections/discussion.tex`
Before:
`the capacity of AI systems to tailor interaction structures`
After:
`the capability of AI systems to tailor interaction structures`
Reason: `DK`

21. **Discussion: instant-feedback example**
Location: `sections/discussion.tex`
Before:
`Examples include writing-oriented tasks such as drafting or revising a paper, lightweight task management such as checking off todos, or navigating a digital work environment where users need brief, contextual orientation.`
After:
`Examples include tasks that involve manually adjusting several variables and getting instant feedback, such as data analysis or design exploration.`
Reason: `DK`

22. **Discussion: stronger domain fit phrasing**
Location: `sections/discussion.tex`
Before:
`the findings suggest that ephemeral support is most promising in low-risk productivity contexts where bounded guidance can help users make progress without taking over the workflow.`
After:
`the findings suggest that ephemeral support may be more promising in tasks that require iterative tweaking and immediate feedback, such as data analysis and design work.`
Reason: `DK`

23. **Discussion: contradiction wording**
Location: `sections/discussion.tex`
Before:
`That tension is important because it implies that future refinements`
After:
`That contradiction is important because it implies that future refinements`
Reason: `DK`

24. **Future Work: qualitative-method wording**
Location: `sections/future_work.tex`
Before:
`moderated sessions with think-aloud protocols`
After:
`focus groups or moderated think-aloud sessions`
Reason: `DK`

25. **Conclusion: application area reframing**
Location: `sections/conclusions.tex`
Before:
`The present findings suggest that the most credible application area is low-risk productivity work: tasks such as drafting or revising a paper, checking off todos`
After:
`The present findings suggest that the most credible application area may be complex tasks that require iterative adjustment and immediate feedback, such as design exploration or data analysis`
Reason: `DK`

26. **Conclusion: interruption-sensitive wording**
Location: `sections/conclusions.tex`
Before:
`high-stakes or heavily interruption-sensitive workflows`
After:
`workflows that are sensitive to interruptions`
Reason: `DK`

## DK Removal Changes

These are deletion-oriented comments that I am now including explicitly. Where the original highlight only said `remove` and the exact span is not recoverable from the extracted JSON alone, I marked it as `tentative`.

1. **Acknowledgements spelling correction**
Location: `sections/acknowledgements.tex`
Before:
`I would like to thank everyone who has helped guid me through the process of creating this thesis.`
After:
`I would like to thank everyone who has helped guide me through the process of creating this thesis.`
Reason: `DK`

2. **Abstract: remove `itself` from the contribution list**
Location: `sections/abstract.tex`
Before:
`The main individual contributions are the framework operationalisation itself, ...`
After:
`The main individual contributions are the framework operationalisation, ...`
Reason: `DK`
Confidence: tentative

3. **Implementation: remove exact inline code-style route details from the main narrative**
Location: `sections/experiments.tex`
Before:
`To verify this implementation end-to-end outside the aggregate study analysis, the pipeline was also tested locally against the real \texttt{/api/support} route on 2026-04-04. Three consecutive hesitation-triggered requests for the \texttt{slides-outline-refine} scenario completed successfully and were persisted as \texttt{support\_outputs} rows 101--103, all with \texttt{usedFallback = false} and \texttt{modelName = gemini-2.0-flash}.`
After:
`To verify this implementation end-to-end outside the aggregate study analysis, an example workflow was conducted. Three consecutive hesitation-triggered requests for the slide-reordering scenario completed successfully and were persisted as support-output records without fallback. Exact trace details are provided in Appendix~\ref{app:local-generation-trace}.`
Reason: `DK`

4. **Instrumentation section: remove duplicate table-introduction sentence so Table 4 has one title source**
Location: `sections/experiments.tex`
Before:
`A predefined set of event types is recognised as countable interactions, and the trial's running interaction count is incremented automatically when one of these events is recorded. Table~\ref{tab:event-types} lists the event types and their relationship to the evaluation measures.`
After:
`A predefined set of event types is recognised as countable interactions, and the trial's running interaction count is incremented automatically when one of these events is recorded.`
Reason: `DK`

5. **Implementation: remove redundant `participant_id` explanation from the data-model prose**
Location: `sections/experiments.tex`
Before:
`The \texttt{trial\_events} table also stores \texttt{participant\_id} for efficient querying, in addition to \texttt{trial\_id}; the diagram omits that redundant edge for clarity.`
After:
`[sentence removed]`
Reason: `DK`

6. **Implementation: remove over-detailed index sentence from the data-model section**
Location: `sections/experiments.tex`
Before:
`Indexes on participant identifiers, trial identifiers, and event types support efficient querying during data export and analysis.`
After:
`[sentence removed]`
Reason: `DK`
Confidence: tentative

7. **Task-scenario section: remove repeated condition framing**
Location: `sections/experiments.tex`
Before:
`The study evaluates one scenario, the slide-reordering task described in the methodology, under two experimental conditions.`
After:
`The study evaluates one scenario, the slide-reordering task described in the methodology.`
Reason: `DK`
Confidence: tentative

8. **Component-catalog section: remove version number from the caption if catalog-version history is no longer analytically important**
Location: `sections/experiments.tex`
Before:
`\caption{Ephemeral component catalog (version~3). Each type is validated against a per-component Zod schema that enforces field types, string lengths, and structural constraints.}`
After:
`\caption{Ephemeral component catalog. Each type is validated against a per-component Zod schema that enforces field types, string lengths, and structural constraints.}`
Reason: `DK`

9. **Future Work: remove em-dash framing and simplify the office/admin sentence**
Location: `sections/future_work.tex`
Before:
`By contrast, everyday office or administrative work---where users must complete structured tasks inside interfaces they use only occasionally---may leave more room for lightweight, task-scoped assistance that does not assume expert shortcuts or a rich existing toolchain.`
After:
`By contrast, everyday office or administrative work may leave more room for lightweight, task-scoped assistance, especially when users complete structured tasks in interfaces they use only occasionally.`
Reason: `DK`

10. **Future Work: remove em-dash framing and simplify the catalogue-research sentence**
Location: `sections/future_work.tex`
Before:
`Expanding the catalogue therefore raises its own research questions---how to preserve predictability and user agency when surface behaviour varies more widely, and how to evaluate ``wilder'' or more personalised variants without confounding condition effects with implementation novelty.`
After:
`Expanding the catalogue therefore raises its own research questions of how to preserve predictability and user agency when surface behaviour varies more widely, and how to evaluate more personalised variants without confounding condition effects with implementation novelty.`
Reason: `DK`

11. **Tentative removal cluster from the implementation-detail pages**

These comments were plain `remove` directives without replacement text. I am including the most likely removals here so they are represented in the plan, but these should be visually confirmed against the annotated PDF before editing.

1. **Page 9 tentative removal**
Location: `sections/introduction.tex`
Before:
`Together, these contributions move beyond the existing literature by offering not only a theoretical account of ephemeral generative UI but also a concrete operationalisation and empirical evidence of how it performs in a bounded productivity scenario.`
After:
`Together, these contributions move beyond the existing literature by offering a concrete operationalisation and empirical evidence of how ephemeral generative UI performs in a bounded productivity scenario.`
Reason: `DK`
Confidence: low

2. **Page 17 tentative removal**
Location: `sections/methodology.tex`
Before:
`Before each trial, participants will receive a short task prompt that labels the interface version for fair debriefing.`
After:
`Before each trial, participants will receive a short task prompt that labels the interface version.`
Reason: `DK`
Confidence: low

3. **Page 21 tentative removal**
Location: `sections/experiments.tex`
Before:
`Persistent data is stored in a PostgreSQL database accessed through Drizzle~ORM, which provides type-safe queries and a migration-based schema workflow.`
After:
`Persistent data is stored in a PostgreSQL database.`
Reason: `DK`
Confidence: low

4. **Page 21 tentative removal**
Location: `sections/experiments.tex`
Before:
`The front end uses Tailwind~CSS and a component library based on Radix~UI primitives for consistent, accessible interface elements across both experimental conditions.`
After:
``
Reason: `DK`
Confidence: low

5. **Page 22 tentative removal**
Location: `sections/experiments.tex`
Before:
`The content variant for each condition is further diversified by hashing the participant identifier together with the scenario identifier, ensuring that the specific slide deck a participant sees in the baseline condition differs from the one they see in the ephemeral condition.`
After:
`The content variant for each condition is assigned by hashing the participant and scenario identifiers, so the baseline and ephemeral trials use different slide decks.`
Reason: `DK`
Confidence: low

6. **Page 23 tentative removal**
Location: `sections/experiments.tex`
Before:
`Full column definitions follow the Drizzle schema in the artifact.`
After:
`[clause removed from caption]`
Reason: `DK`
Confidence: low

7. **Page 23 tentative removal**
Location: `sections/experiments.tex`
Before:
`Foreign key constraints with cascading deletion ensure referential integrity: deleting a participant removes all associated trials, events, questionnaire responses, and support outputs.`
After:
``
Reason: `DK`
Confidence: low

8. **Page 25 tentative removal**
Location: `sections/experiments.tex`
Before:
`The only difference is whether the ephemeral support layer is active, which is controlled by the condition field on the trial row.`
After:
`The only difference is whether the ephemeral support layer is active.`
Reason: `DK`
Confidence: low

9. **Page 26 tentative removal**
Location: `sections/experiments.tex`
Before:
`The current study uses catalog version~3.`
After:
`[sentence removed]`
Reason: `DK`
Confidence: low

## DK Formatting, Emphasis, and Figure/Layout Changes

1. **Taxonomy diagram: make subtitles more concise**
Location: `sections/methodology.tex`
Before:
```tex
\node[box, below left=1.8cm and 2.75cm of root] (interpretive) {\textbf{Interpretive support}\\Helps users understand\\context, outputs, or\\likely consequences};
\node[box, below=1.8cm of root] (refinement) {\textbf{Refinement support}\\Helps users compare or\\adjust options before\\commitment};
\node[box, below right=1.8cm and 2.75cm of root] (execution) {\textbf{Task-execution support}\\Helps users complete a\\bounded subtask within\\the existing workflow};
```
After:
```tex
\node[box, below left=1.8cm and 2.75cm of root] (interpretive) {\textbf{Interpretive support}\\Clarifies context\\and consequences};
\node[box, below=1.8cm of root] (refinement) {\textbf{Refinement support}\\Compares or adjusts\\options};
\node[box, below right=1.8cm and 2.75cm of root] (execution) {\textbf{Task-execution support}\\Supports a bounded\\subtask};
```
Reason: `DK`

2. **Lifecycle figure: make `lifecycle` bold as well**
Location: `sections/methodology.tex`
Before:
```tex
\node[draw, rounded corners, align=center, minimum width=3.4cm, minimum height=1.2cm] (core) at (0,0) {\textbf{Ephemeral component}\\lifecycle};
```
After:
```tex
\node[draw, rounded corners, align=center, minimum width=3.4cm, minimum height=1.2cm] (core) at (0,0) {\textbf{Ephemeral component}\\\textbf{lifecycle}};
```
Reason: `DK`

3. **Lifecycle figure: remove subtext and keep only stage titles**
Location: `sections/methodology.tex`
Before:
```tex
\node[stage] (trigger) at (0,3.4) {\textbf{Trigger}\\A user goal or\\contextual need is\\detected};
\node[stage] (instantiation) at (4.8,0) {\textbf{Instantiation}\\Temporary support is\\embedded within the\\existing interface};
\node[stage] (interaction) at (0,-3.4) {\textbf{Interaction}\\The user inspects,\\steers, or completes\\the immediate subtask};
\node[stage] (dismissal) at (-4.8,0) {\textbf{Dismissal}\\Support disappears\\once the task is done\\or no longer relevant};
```
After:
```tex
\node[stage] (trigger) at (0,3.4) {\textbf{Trigger}};
\node[stage] (instantiation) at (4.8,0) {\textbf{Instantiation}};
\node[stage] (interaction) at (0,-3.4) {\textbf{Interaction}};
\node[stage] (dismissal) at (-4.8,0) {\textbf{Dismissal}};
```
Reason: `DK`

4. **Artifact-development prose: emphasize `constrained adaptation`**
Location: `sections/methodology.tex`
Before:
`Instead, it is constrained adaptation: users encounter the same scenario structures and the same framework rules, but the temporary support may be parameterised slightly differently within those limits.`
After:
`\textbf{Constrained adaptation}: users encounter the same scenario structures and the same framework rules, but the temporary support may be parameterised slightly differently within those limits.`
Reason: `DK`
Confidence: tentative

5. **Component-catalog table: reformat so it does not occupy a whole page unnecessarily**
Location: `sections/experiments.tex`
Before:
```tex
\begin{table}[htbp]
    \centering
    \small
```
After:
```tex
\begin{table}[t]
    \centering
    \footnotesize
```
Reason: `DK`

6. **Pipeline diagram: prevent `generateValidatedSupport()` from overflowing the node box**
Location: `sections/experiments.tex`
Before:
```tex
\texttt{generateValidatedSupport()} builds the system prompt
```
After:
```tex
\texttt{generateValidatedSupport} builds the system prompt
```
Reason: `DK`

7. **Pipeline diagram: simplify node subtitles and remove route-heavy wording**
Location: `sections/experiments.tex`
Before:
```tex
\node[box] (trigger) {\textbf{1. Client trigger}\\
In \texttt{app/study/page.tsx}, support is triggered after hesitation or by explicit request. ...};
```
After:
```tex
\node[box] (trigger) {\textbf{1. Client trigger}\\
Support is triggered after hesitation or by explicit request. The client sends the participant, trial, scenario, trigger, and optional task snapshot to the support pipeline.};
```
Reason: `DK`

8. **Event-types table: widen the final column so `Evaluation measure` stays on one line**
Location: `sections/experiments.tex`
Before:
```tex
\begin{tabular}{@{}p{0.33\textwidth}p{0.41\textwidth}p{0.18\textwidth}@{}}
```
After:
```tex
\begin{tabular}{@{}p{0.31\textwidth}p{0.39\textwidth}p{0.22\textwidth}@{}}
```
Reason: `DK`

9. **Results figures: make the completion-time graph bigger**
Location: `sections/results.tex`
Before:
```tex
\includegraphics[width=0.65\textwidth]{graphics/results-completion-time.pdf}
```
After:
```tex
\includegraphics[width=0.82\textwidth]{graphics/results-completion-time.pdf}
```
Reason: `DK`

10. **Results figures: make the interaction-count graph bigger**
Location: `sections/results.tex`
Before:
```tex
\includegraphics[width=0.65\textwidth]{graphics/results-interaction-count.pdf}
```
After:
```tex
\includegraphics[width=0.82\textwidth]{graphics/results-interaction-count.pdf}
```
Reason: `DK`

11. **Results figures: make the Likert-ratings graph bigger**
Location: `sections/results.tex`
Before:
```tex
\includegraphics[width=0.75\textwidth]{graphics/results-likert-ratings.pdf}
```
After:
```tex
\includegraphics[width=0.90\textwidth]{graphics/results-likert-ratings.pdf}
```
Reason: `DK`

12. **Data-model page: separate Figure 5 and Table 2 more clearly**
Location: `sections/experiments.tex`
Before:
```tex
\end{figure}

\begin{table}[htbp]
```
After:
```tex
\end{figure}

\begin{table}[t]
```
Reason: `DK`

13. **Future Work: simplify punctuation-heavy phrasing**
Location: `sections/future_work.tex`
Before:
`This possibility also aligns with the broader claim in the generative-UI literature that adaptive support may be most valuable where conventional interfaces struggle to accommodate varying user needs across contexts \parencite{Bieniek2024GenerativeAI,Tambi2020GenerativeBanking}.`
After:
`This possibility also aligns with the broader generative-UI claim that adaptive support may be most valuable when conventional interfaces struggle to accommodate varying user needs across contexts \parencite{Bieniek2024GenerativeAI,Tambi2020GenerativeBanking}.`
Reason: `DK`

## DK Changes (Tentative Micro Replacements)

These come from very short review notes that look like one-word or small-phrase replacements. I mapped them to the most likely snippet in the current thesis.

1. **Page 6 micro replacement**
Comment: `prevalent`
Before:
`they are increasingly being used to generate user interfaces (UI)`
After:
`they are becoming more prevalent in the generation of user interfaces (UI)`
Reason: `DK`
Confidence: low

2. **Page 6 micro replacement**
Comment: `anew`
Before:
`re-establish their sense of place within the application`
After:
`orient themselves anew within the application`
Reason: `DK`
Confidence: medium

3. **Page 6 micro replacement**
Comment: `where`
Before:
`where needs are constantly changing`
After:
`in which needs are constantly changing`
Reason: `DK`
Confidence: low

4. **Page 6 micro replacement**
Comment: `an`
Before:
`how a set of core primitive UI components can be integrated`
After:
`how an underlying set of core primitive UI components can be integrated`
Reason: `DK`
Confidence: low

5. **Page 11 micro replacement**
Comment: `Hence`
Before:
`This sequence ensures that the evaluation is not detached from theory`
After:
`Hence, the evaluation is not detached from theory`
Reason: `DK`
Confidence: low

6. **Page 11 micro replacement**
Comment: `the artifact`
Before:
`a website artifact that serves as a research instrument`
After:
`a wegapp artifact that serves as a research instrument`
Reason: `DK`
Confidence: low

7. **Page 11 micro replacement**
Comment: `theory. The framework`
Before:
`the evaluation is not detached from theory: the framework informs the design of the artifact`
After:
`the evaluation is not detached from theory. The framework informs the design of the artifact`
Reason: `DK`
Confidence: medium

8. **Page 13 micro replacement**
Comment: `a`
Before:
`A component is triggered when a clear user goal or contextual need is detected`
After:
`The component is triggered when a clear user goal or contextual need is detected`
Reason: `DK`
Confidence: low

9. **Page 16 micro replacement**
Comment: `to`
Before:
`allows each participant to act as their own control`
After:
`allows each participant to serve as their own control`
Reason: `DK`
Confidence: low

10. **Page 16 micro replacement**
Comment: `where they refine the given slides with different context`
Before:
`a presentation-style refinement task in which they reorder a short slide deck into the intended story sequence`
After:
`a presentation-style refinement task where they refine the given slides within different contexts by restoring the intended sequence`
Reason: `DK`
Confidence: low

11. **Page 16 micro replacement**
Comment: `Having versions`
Before:
`This version-based counterbalancing preserves a consistent study flow`
After:
`Having version labels preserves a consistent study flow`
Reason: `DK`
Confidence: low

12. **Page 16 micro replacement**
Comment: `acquired`
Before:
`prior familiarity with similar interfaces`
After:
`previously acquired familiarity with similar interfaces`
Reason: `DK`
Confidence: low

13. **Page 16 micro replacement**
Comment: `digitally literate`
Before:
`individual differences in digital literacy`
After:
`individual differences in how digitally literate participants are`
Reason: `DK`
Confidence: medium

14. **Page 16 micro replacement**
Comment: `Acquirement`
Before:
`Recruitment will follow a convenience sampling approach`
After:
`Participant acquisition will follow a convenience sampling approach`
Reason: `DK`
Confidence: low

15. **Page 19 micro replacement**
Comment: `where`
Before:
`a scenario registry that defines each scenario's metadata`
After:
`a scenario registry where each scenario's metadata is defined`
Reason: `DK`
Confidence: low

16. **Page 19 micro replacement**
Comment: `for every scenario`
Before:
`defines each scenario's metadata`
After:
`defines the metadata for every scenario`
Reason: `DK`
Confidence: medium

17. **Page 37 micro replacement**
Comment: `. Thus,`
Before:
`Within this sample, participants therefore rated the ephemeral interface as reliably more helpful.`
After:
`Thus, participants rated the ephemeral interface as more helpful.`
Reason: `DK`
Confidence: medium

18. **Page 37 micro replacement**
Comment: `These`
Before:
`The support-engagement metrics capture overlapping event types`
After:
`These support-engagement metrics capture overlapping event types`
Reason: `DK`
Confidence: low

19. **Page 37 micro replacement**
Comment: `interactivity`
Before:
`greater overall interface activity during the trial`
After:
`greater overall interactivity during the trial`
Reason: `DK`
Confidence: medium

20. **Page 40 micro replacement**
Comment: `where`
Before:
`contexts where bounded guidance can help users make progress`
After:
`contexts in which bounded guidance can help users make progress`
Reason: `DK`
Confidence: medium

21. **Page 40 micro replacement**
Comment: `. However,`
Before:
`However, the consequence of this decision is that the findings cannot yet be generalised`
After:
`However, this decision means that the findings cannot yet be generalised`
Reason: `DK`
Confidence: low

22. **Page 41 micro replacement**
Comment: `with`
Before:
`participants may have recognised the intent or potential value of the support without finding it seamless enough`
After:
`participants may have recognised the intent or potential value of the support, with it still not feeling seamless enough`
Reason: `DK`
Confidence: low

23. **Page 46 micro replacement**
Comment: `where we have`
Before:
`moderated sessions with think-aloud protocols, where a researcher can observe`
After:
`moderated sessions with think-aloud protocols, where we have a researcher observing`
Reason: `DK`
Confidence: low

24. **Page 48 micro replacement**
Comment: `answers that`
Before:
`The evaluation provides a qualified answer`
After:
`The evaluation provides a qualified answer that addresses that question`
Reason: `DK`
Confidence: low

## Inferred Changes

These are not direct wording replacements from your comments. They come from the discussion in `review/main-review-comment-answers.md` and the final actionable note there.

1. **Add a Design Science Research citation**
Location: `sections/methodology.tex`
Before:
`This project adopts a Design Science Research (DSR) approach because its primary goal is not only to study an existing phenomenon, but to create and evaluate an artifact that addresses an identified design problem.`
After:
`This project adopts a Design Science Research (DSR) approach \parencite{<new-dsr-source>} because its primary goal is not only to study an existing phenomenon, but to create and evaluate an artifact that addresses an identified design problem.`
Reason: DSR is a named methodology and should be cited; you explicitly provided a source for this in `main-review-comment-answers.md`.

2. **Make the abstract statistically cautious**
Location: `sections/abstract.tex`
Before:
`The ephemeral condition produced a slightly higher task completion rate`
After:
`The ephemeral condition showed a descriptively higher task completion rate`
Reason: The result was not statistically significant, so the abstract should avoid implying a confirmed improvement.

3. **State experimental equivalence earlier in the methodology**
Location: `sections/methodology.tex`
Before:
`The original condition will present the underlying tasks using a conventional persistent interface, whereas the ephemeral condition will surface temporary interface elements only when a user reaches a context in which additional guidance, refinement, or task support is needed.`
After:
`Both conditions use the same underlying slide-deck interface, task mechanics, and submission logic. The original condition presents the task without temporary support, whereas the ephemeral condition surfaces temporary interface elements only when additional guidance, refinement, or task support is needed.`
Reason: This makes the experimental control clearer at the methodological level instead of leaving it only to the implementation chapter.

4. **Make the minimal-data/privacy statement explicit**
Location: `sections/methodology.tex`
Before:
`To link behavioural and survey data, each session will be associated with a participant identifier that is stored consistently across the website logs and questionnaire responses.`
After:
`To link behavioural and survey data, each session is associated with a cookie-linked participant identifier that is stored consistently across the website logs and questionnaire responses. No names or email addresses are collected; the study stores only age range, occupation, familiarity ratings, trial logs, and questionnaire responses.`
Reason: The artifact already behaves this way, and stating it explicitly strengthens the privacy and ethics framing.

5. **Use ERD terminology on first mention**
Location: `sections/experiments.tex`
Before:
`Figure~\ref{fig:data-model-erd} shows the entity--relationship structure`
After:
`Figure~\ref{fig:data-model-erd} shows the entity--relationship diagram (ERD)`
Reason: This is the standard name for the figure and makes the section more precise.

6. **Compress low-level database implementation detail**
Location: `sections/experiments.tex`
Before:
`Foreign key constraints with cascading deletion ensure referential integrity: deleting a participant removes all associated trials, events, questionnaire responses, and support outputs. Indexes on participant identifiers, trial identifiers, and event types support efficient querying during data export and analysis.`
After:
`The schema preserves referential integrity and supports the study queries needed for export and analysis.`
Reason: The thesis should emphasize research-relevant design and validity, not database tuning detail.

7. **Simplify Figure 6 node labels from code-heavy to concept-heavy**
Location: `sections/experiments.tex`
Before:
`\textbf{1. Client trigger}\\ In \texttt{app/study/page.tsx}, support is triggered after hesitation or by explicit request. The client sends \texttt{participantId}, \texttt{trialId}, \texttt{scenarioId}...`
After:
`\textbf{1. Client trigger}\\ Support is triggered after hesitation or by explicit request. The client sends the current participant, trial, scenario, trigger, and optional task snapshot to the support pipeline.`
Reason: The figure should show conceptual stages. File paths and exact routes can stay in prose or the appendix.

8. **Add a React portal citation**
Location: `sections/experiments.tex`
Before:
`Accepted specifications are rendered as a temporary overlay above the existing application interface using a React portal.`
After:
`Accepted specifications are rendered as a temporary overlay above the existing application interface using a React portal \parencite{<react-portal-docs>}.`
Reason: A named implementation mechanism should be cited once.

9. **Reduce exact code identifiers in the main implementation narrative**
Location: `sections/experiments.tex`
Before:
`To verify this implementation end-to-end... the pipeline was also tested locally against the real \texttt{/api/support} route on 2026-04-04...`
After:
`To verify the implementation end-to-end, the real support-generation route was also done... Exact trace details are provided in Appendix~\ref{app:local-generation-trace}.`
Reason: The main text should explain what was done; the appendix should carry the exact code-facing details.

10. **Add an appendix pointer where component names become dense**
Location: `sections/experiments.tex`
Before:
`The overlay component receives the validated specification tree and recursively dispatches each node to its corresponding catalog component based on the node's type.`
After:
`The overlay component receives the validated specification tree and recursively dispatches each node to its corresponding catalog component based on the node's type. A concrete generated example is shown in Appendix~\ref{app:local-generation-trace}.`
Reason: Readers need a concrete anchor when many component names are introduced in sequence.

11. **Split `Limitations and Robustness` into two subsections**
Location: `sections/discussion.tex`
Before:
`\subsection{Limitations and Robustness}`
After:
`\subsection{Limitations}`

`...`

`\subsection{Robustness}`
Reason: This improves readability and matches the capstone guideline language more directly.

12. **Refine the task-scope framing beyond just `low-risk productivity tasks`**
Location: `sections/abstract.tex`, `sections/discussion.tex`, `sections/conclusions.tex`
Before:
`low-risk productivity tasks`
After:
`bounded, low-consequence subtasks within broader workflows`
Reason: This is more accurate than implying only simple tasks matter; it keeps the boundary on consequence and interruption cost rather than on task complexity alone.

13. **Make workflow significance explicit in Future Work**
Location: `sections/future_work.tex`
Before:
`A useful next step is therefore to evaluate the framework across several workflows`
After:
`A useful next step is therefore to evaluate the framework across several workflows that differ in interruption tolerance, consequence of error, and task significance.`
Reason: This follows directly from the discussion about where ephemeral support is or is not likely to add value.

14. **Make personalisation more explicit as future work**
Location: `sections/future_work.tex`
Before:
`more varied layouts, stronger personalisation of content and tone`
After:
`more varied layouts, stronger personalisation of content and tone based on the user's profile, role, or prior behaviour`
Reason: The current text mentions personalisation, but this makes the factor explicit as a distinct research direction.
