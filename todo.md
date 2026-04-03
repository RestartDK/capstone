
# TODO

- [x] Update my thesis methodology with current artifact
- [x] Update with technical diagrams of my experiment after doing the actual artifact, really important
- [x] Add the limitations section
- [x] Add the screenshots of the experiment
- [x] Talk more about the actual data that was used with the tables
- [ ] Do the implementation section
- [ ] Make the scaffold for the results, with the queries for the data ready
- [ ] Make a draft for the conclusion
- [ ] Improve the signposting, so there are better transitions and takeaway sentences for every section
- [ ] Based on the results of the data, see if you need to tweak it using another method or not in every single one
- [ ] Make an introduction

AFTER RESULTS
- [] Get 30 participants for my test
- [] Write my results for my thesis (while waiting u can work on naiss and take home)
- [] Download the data in csv and apply the analysis methods proposed in the methodology to then explain your actual findings on the subject
- [] Write about the discussion about the limitations and boundaries of the study
- [] Redo the methodolgy so it's inline with the final artifact with included pictures
- [] What changes because of my work here and how it can be applied in the real world
- [] Your conclusion of the project so what did i think in the end from what i did and what is next

- One limitation I could put is the diversity of my examples
  - Had to remove more advanced interactions from the user like helping them write text better
  - I played around with this idea but with the writing
  - Future research would include writing in option
  - Another future research would be to have a more crazy ui like subway surfers
  - Another format that I could do is a focus group research and spend more time with my testees instead of like this


## Remaining Methodology Gaps

- **Make the data/material paragraph more explicit.**  
  You now describe collection well, but the guidelines want a clearer statement of exactly what material/data the study uses. Add one short paragraph that explicitly says the study uses:
  - consented participant sessions
  - background questionnaire data
  - trial-level behavioural data
  - event logs
  - post-trial questionnaire data
  - final comparative questionnaire data
  - saved support outputs from the ephemeral condition

- **Align the logged support actions with what the artifact actually records.**  
  In `sections/methodology.tex`, the wording still says support may be “opened, used, refined, dismissed, or ignored” and mentions “confirmations.” That is a bit off. Your actual system is closer to:
  - triggered
  - requested
  - shown
  - dismissed
  - used
  - ignored
  - inspect/details expanded  
  So I would revise that terminology.

- **Make the analysis plan slightly more concrete.**  
  Right now it is acceptable but still generic. You should specify, at least briefly:
  - how you will compare completion rate
  - how you will compare time and interaction count
  - how you will analyse Likert ratings
  - how you will treat final preference data  
  It does not need to be ultra-technical yet, but it should sound more operational.

- **Add a short ethics/privacy sentence.**  
  Since the artifact includes consent, participant IDs, and non-PII questionnaire collection, it would help to add one sentence saying:
  - participants provide consent before participation
  - no directly identifying personal data is requested in the interface
  - responses are linked through participant IDs for analysis

- **Mention the trigger modes more clearly.**  
  Your support pipeline paragraph is good, but one short sentence in the methodology should state that ephemeral support may appear:
  - automatically at trial start
  - after hesitation
  - after explicit request  
  That would better match the artifact.

- **Add the actual technical architecture figure.**  
  You added the pipeline figure and screenshots, which is great. The other remaining figure worth adding is the overall experiment architecture diagram, since that supports both methodology and technical content.

## Probably Fine Now

These parts are already in much better shape:
- task description now matches the artifact
- A/B ordering and condition mapping are now much clearer
- screenshots are included
- the support pipeline is documented
- the bounded nature of the ephemeral condition is explained

## If You Want The Best Final Polish

I’d do these next, in order:
1. Add one explicit “material/data used” paragraph.
2. Fix the support-log wording so it matches the implementation.
3. Tighten the analysis-plan wording.
4. Add one privacy/ethics sentence.
5. Add the overall architecture diagram.

If you want, I can patch `sections/methodology.tex` now with those remaining text fixes.