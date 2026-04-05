# Answers To Review Questions And Doubts

This document answers the review comments from `review/main-review-done-comments.json` that raised a question, uncertainty, or explicit doubt. It does not repeat directive-only comments such as `remove`, `fix spelling`, or layout-only notes unless they were tied to a doubt.

1. Page 3: "should it be specified here that we did it through this specific experiment design?"
Yes. The abstract should name the evaluation method in one concise clause, because the guidelines explicitly expect objectives and methodological credibility to be visible early. Your current "within-subjects user study" wording is the right level of detail; you do not need more procedural detail in the abstract.

2. Page 3: "is this needed? could just remove..."
If the highlighted phrase is only repeating information already stated in the same abstract paragraph, remove it. The abstract should keep only the framework, artifact, study design, core findings, and final implication.

3. Page 3: "is this really true?"
It is only safe if phrased as a descriptive result, not as a confirmed improvement. For example, "the ephemeral condition showed a descriptively higher completion rate" is accurate; "improved completion" overstates the evidence because the result was not statistically significant.

4. Page 3: "but in the abstract should the what ifs be mentioned?... or should that be kept for the discussion."
Keep almost all of that for the discussion. In the abstract, at most include one boundary-setting qualifier; broader caveats about other scenarios or use cases belong in Discussion or Future Work.

5. Page 6: "could include a source here? or not needed in introduction..."
Yes, if you keep a general claim like "a common pain point." In an introduction, claims about user difficulty or prevalence still need support unless you rewrite them as a narrower design argument rather than an empirical claim.

6. Page 6: "do we need to cite this?... it sounds very vague, like what research are we even talking about."
Yes. If a sentence refers to "research" or "prior work" in general, it should either name the exact stream and cite it, or be rewritten more concretely. Vague gestures to literature weaken the introduction.

7. Page 7: "Should this be in its own section completely? or constrained to the intro."
Keeping the literature review as a subsection inside the introduction is acceptable for this capstone format. The IE guideline suggests "Prior Art and Research Question" as part of the early thesis story, so you do not need a separate full chapter unless the review becomes much larger.

8. Page 9: "is this formatted well?... best way to format this part."
Yes. A short displayed research question is standard and readable. You could also write it inline, but the current quoted format is academically normal and helps it stand out.

9. Page 9: "strictly conceptual?... wouldn't this be an actual practical framework?... theoretical?"
"Conceptual framework" is still the best term. It becomes practical when you operationalise it in the artifact, but the framework itself is primarily conceptual rather than a full theory or just a practical toolkit.

10. Page 9: "do we really need 'and contribution' here?... should the contribution be an actual section or only talked about in its related sections?"
Yes, keeping contribution explicit is a good choice. The IE guideline explicitly expects the main contribution and individual contribution to be identifiable, so "Research Question and Contribution" is justified even if the contribution is only a subsection rather than a full chapter.

11. Page 10: "is this whole section even needed?"
Yes, but it should stay short. The guidelines explicitly recommend signposting early, and your current thesis-outline paragraph is brief enough to serve that purpose without becoming filler.

12. Page 11: "shouldn't we have a citation to what this is? or not needed."
Yes. Design Science Research is a named methodology, so it should have at least one foundational citation rather than being introduced without source support.

13. Page 11: "we repeat this often. is that a good or bad thing?"
Some repetition of the core term is good because it keeps the thesis concept stable. The problem is only stylistic overuse; after the first full definition, you can vary with "ephemeral support," "temporary support," or "ephemeral components."

14. Page 11: "a real world problem?... or should it focus not on problem but that it addresses a novel concept to work on."
It should stay framed as a real design problem, not just a novel idea. That is especially important because DSR is justified by solving an identified design problem, while novelty should appear as the contribution layered on top.

15. Page 11: "We already mentioned this before. do we need to reference it again?"
Only if the repetition helps local clarity. In methodology, brief restatement is acceptable when you are moving from the literature claim to the framework, but if the sentence adds no new function, cut it.

16. Page 12: "is this really needed?... if not we should remove."
If the sentence only explains why the previous sentence exists, it is probably expendable. Keep justification only where it clarifies the logic of the framework or method, not where it merely narrates your writing decisions.

17. Page 12: "is this reflected with the artifact I made?"
Partly yes, but it should be made more explicit. The artifact does reflect taxonomy, lifecycle, and bounded constraints, but later sections should cross-reference that mapping more directly so the reader can see how each framework element appears in the implementation.

18. Page 12: "use? just remove this."
If the highlighted word is just filler, remove it. These small filler words often make methodology prose less direct without adding meaning.

19. Page 12: "which one? give an example and cite it."
Yes. If you mention alternative lifecycle patterns in the literature, give at least one concrete example or source instead of leaving it abstract.

20. Page 13: "shouldn't we have a ':' that lists them first and THEN talk about each one? what is best practice here."
Yes. If you introduce a named set such as the five principles, a colon before the list-style explanation is cleaner and easier to follow.

21. Page 14: "should we mention the specific interface or not? like keep it general?"
Mention the interface type, but not a branded product name. "A familiar slide-deck editing interface" is concrete enough for methodological clarity without overbinding the thesis to one commercial tool.

22. Page 14: "this should specify if the underlying interface was the same?"
Yes, definitely. That is methodologically important because it clarifies that the comparison isolates the ephemeral layer rather than comparing two different applications. You already say this later in Implementation, so the same point should be surfaced earlier in Methodology too.

23. Page 15: "does having a deterministic fallback actually provide value or discredit my work?"
It strengthens the work if you frame it correctly. A deterministic fallback improves safety, experimental robustness, and system reliability; it only weakens the claim if you pretend the entire condition was purely model-driven when it was not.

24. Page 15: "is this needed to be explicitly stated? or can the paper just answer this normally. explain."
If the statement is about an experimental control, a safety boundary, or a validity condition, state it explicitly. If it is only narrative glue, let the paper show it through normal prose rather than meta-explaining it.

25. Page 15: "is this explained why this choice was made?"
It should be made explicit. Your stated reasons are sound: prevent unsafe output such as XSS, preserve design-system coherence, and keep the generated support within the study's controlled bounds.

26. Page 15: "what is meant by this?"
This likely needs a plainer paraphrase. If the sentence is about constrained adaptation, the meaning should be: participants saw the same task structure and rules, while only small local support details could vary.

27. Page 17: "We have repeated this quite alot? shouldn't we remove this?"
Yes, probably trim it. By the evaluation-design section, the reader already knows the study tests bounded adaptation, so repeating the same framing too often starts to feel defensive.

28. Page 17: "Is it mentioned that minimal data is provided like no name and email..."
Not clearly enough in the thesis. The artifact confirms that no name or email is collected; it stores age range, occupation, familiarity ratings, and a cookie-linked participant ID only. That should be stated explicitly in the methodology because it strengthens the ethics/privacy explanation.

29. Page 19: "shouldn't we justify why this and not the other alternatives?"
Yes, but only briefly. One short justification per test is enough, and your current analysis-plan section already does this well for McNemar, Wilcoxon, and the binomial test.

30. Page 21: "is this needed or not?"
A short architecture rationale is needed, but low-level stack exposition should be limited. Keep the paragraph that ties the implementation choices to the needs of a research instrument, and cut any detail that does not support credibility, reproducibility, or validity.

31. Page 22: "is there a better way to say this? seems awfully verbose for just saying that our survey is a one way user flow."
Yes. "A fixed sequential study flow" or "a linear, one-way participant flow" says the same thing more cleanly.

32. Page 23: "is this really needed? this is not core logic we care about in the thesis."
Probably not at full detail. Referential integrity is worth one sentence, but low-level database implementation details like indexes should be heavily compressed unless they directly support the study's validity or reproducibility.

33. Page 23: "do we really do this? check the artifact."
Yes. The artifact schema really does store `participant_id` in `trial_events`, so the sentence is accurate.

34. Page 23: "isn't this an ERD? if so say entity relationship diagram (ERD)."
Yes. On first mention, call it an "entity-relationship diagram (ERD)," then use "ERD" afterward.

35. Page 24: "should they really be one after the other here for figure 5 and table 2?"
No, not ideally. Splitting them would improve pacing and reduce the cramped visual block, so this is a layout issue worth fixing if LaTeX float placement allows it.

36. Page 25: "I feel like this is repeated alot. is this intentional or is this a bad pattern?"
Some repetition is intentional because you are defending experimental control. Still, in the implementation chapter it can be shortened by referring back to the methodology instead of restating the same comparison logic in full.

37. Page 25: "do we really need to mention dnd?... explain why or why not."
Mention it once, briefly. It is not intellectually central, but it does explain how the task interaction was actually implemented and why the slide-reordering mechanic worked as described.

38. Page 26: "I just ended up using one version for testing... so maybe we remove this? what other parts would have to be updated if so?"
If you only truly used one version in the evaluated system, remove historical versioning discussion and keep only the current version statement. If you do that, also update the component-catalog section, the pipeline description, any appendix references to catalog version, and any places where outputs/logs mention versioning as if multiple study-time versions mattered analytically.

39. Page 30: "do we need to reference the routes, and requests? ... shouldn't it just have the actual steps..."
For the diagram, the conceptual steps matter more than exact file paths and HTTP details. Keep filenames and route names in the prose or appendix if needed, but simplify the figure labels to stage names such as "client trigger," "state assembly," "generation," "validation," "fallback or accept," and "render."

40. Page 31: "should reference the docs here to react portal no?"
Yes. Since "React portal" is a named implementation mechanism, cite React's documentation or another stable React reference once.

41. Page 33: "I don't get the point of this? why should we state this. if not useful, remove."
If the highlighted sentence is the completer-sample clarification, keep it. Explaining that results are based on completers rather than all starters is methodologically important and protects the credibility of the results section.

42. Page 37: "is this needed or not? if not then remove."
Yes, the engagement-interpretation paragraph is useful. It explains why support exposure, dismissal, and limited uptake matter for interpreting the mixed results.

43. Page 40: "All in all or is there a better way to say this?"
Yes: use "Taken together," "Overall," or "In sum." "Taken together" is the strongest academic fit here.

44. Page 41: "is this true? I would say the opposite or maybe both. explain."
The safer claim is "bounded, low-consequence subtasks within larger workflows," not simply "low-risk simple tasks." That lets you acknowledge both sides: ephemeral support may be especially useful either in lightweight tasks or inside more complex domains when the assisted subtask is bounded and interruption costs remain manageable.

45. Page 41: "maybe we split this into 2 subsections, one limitations the other robustness?"
Yes, that would improve clarity. It also aligns well with the guideline language, which explicitly names "Limitations and Robustness" as a thesis component.

46. Page 44: "do i need to say this?"
If the sentence is only a transition to future work, you can cut it or compress it to one line. Keep it only if it cleanly closes the discussion and motivates the next chapter.

47. Page 45: "shouldn't we mention that we should do it in separate workflows based on their significance?"
Yes. That is a strong refinement of the future-work argument: evaluation should distinguish workflows by task significance, interruption tolerance, and consequences of error, not just by domain label.

48. Page 46: "shouldn't we mention to also include the personalisation factor?... or is this a separate future work?"
Yes, but as future work, not as a current claim. You did not evaluate personalisation directly, so it should be framed as a next research axis alongside richer component catalogues and broader scenarios.

49. Page 48: "better way to say this?"
If this is the concluding forward-looking sentence, prefer simpler language such as "practically valuable," "demonstrably useful," or "clearly beneficial" rather than a more ornate phrase. The conclusion is stronger when it ends in plain, confident language.

## Actionable stuff

- For design science use the following source: https://www.sciencedirect.com/science/article/pii/S1877050924011128