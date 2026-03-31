# Methodology work

## Scenario evaluation for the study

Current idea:

- Ecommerce purchase flow
- PM / SaaS workflow task
- Presentation-making task

Initial evaluation:

- PM / SaaS workflow task is a strong fit. It is bounded, productivity-oriented, easy to simulate in a website artifact, and works well for task-execution support.
- Presentation-making can also be a strong fit, but only if it is narrowed to a bounded subtask such as refining an outline, comparing slide structures, or adjusting generated content before committing. This makes it a good candidate for refinement support.
- Ecommerce purchase flow is the weakest fit. It is less aligned with the current methodology framing of a productivity-oriented website artifact and introduces extra confounds such as shopping behavior, recommendation logic, and consumer decision-making.

Main methodological concern:

- If the three scenarios are too different in domain, the study becomes harder to defend because differences in outcome may be caused by the domain itself rather than by the ephemeral UI condition.
- A stronger design is to keep all scenarios within one coherent family of productivity-oriented tasks while varying the role of ephemeral support.

instead:

- Scenario 1: information interpretation or dashboard understanding
- Scenario 2: document or presentation refinement
- Scenario 3: project management task execution

better cause:

- It stays aligned with the current methodology, which describes a controlled but realistic website artifact and bounded productivity-oriented tasks.
- It maps more cleanly to the taxonomy:
- Interpretive support -> dashboard / information understanding
- Refinement support -> presentation or document refinement
- Task-execution support -> PM / workflow completion
- It preserves comparability across participants while still allowing bounded adaptation in the ephemeral condition.

## Todo

- [x] Figure out exact taxonomy
- [x] Figure out exact lifecycle
- [x] Figure out exact design principles
- [x] Evaluate different methods
- [ ] Make all up to methodology in line with the guidelines
- [ ] Make the min viable artifact for lifecycle and taxonomy, try with random website
- [ ] Make the artifact for testing it
- [ ] Add the tracking to be able to test end to end

## One liner

What it is: A lifecycle of how the components emerge and disappear, which types of components can even emerge (taxonomy), and guidelines of how to implement this (design principles)
How it's done: Define a set of ??? -> we do trigger, instantiatio, interaction, dismissal -> the principles are ???

Lifecycle is the state machine for how my ui should appear and disappear. That is what actually chooses that for ephemereal ui in the first place. Without it, you cannot correctly steer a system of when do those things.

## Notes on evaluating my framework

The different types of taxonomy I need are

- Taxonomy should classify the role the ephemeral component plays in the workflow, not the visual shape of the UI
- So it should not be "modal", "popover", "sidebar", etc.
- It should also not be lifecycle words like trigger / dismissal
- It should also not be design principles like predictable / bounded / non-disruptive
- The taxonomy should be role-based, meaning each category answers: what job is this temporary component doing for the user right now?

### Rules for a good taxonomy

- Classify each component by its primary user-facing role at the moment it appears
- The categories can overlap conceptually, but in the artifact each instantiated component should have one primary role for analysis
- The categories should be broad enough to cover multiple UI forms, but distinct enough that the same component is not constantly placed in two buckets
- The categories should be grounded in the literature, but presented honestly as a synthesis rather than a taxonomy copied directly from one paper

### Best role-based taxonomy

- Interpretive support
  - Main question it answers: what is happening here?
  - Purpose: helps the user understand context, options, outputs, or likely consequences before acting
  - Typical examples: explanation panel, preview, annotation, contextual hint, summary of what an action will do
  - Boundary: this role explains or reveals, but does not primarily help the user configure the next step
- Refinement support
  - Main question it answers: how should I shape this action?
  - Purpose: helps the user steer, configure, compare, or adjust an intended action before committing
  - Typical examples: parameter controls, rewrite options, alternative comparison, generated setting suggestions, temporary filters
  - Boundary: this role modifies or steers an intended action, but does not primarily execute the task for the user
- Task-execution support
  - Main question it answers: how do I complete this bounded subtask?
  - Purpose: helps the user carry out a clearly delimited subtask inside the surrounding workflow
  - Typical examples: temporary mini-form, guided action flow, one-off assistant panel, generated helper for a specific task
  - Boundary: this role operationalizes a bounded task, rather than mainly explaining or refining it

### Why this version is better than my older categories

- The categories are based on functional role, not on UI shape
- Each category has a different primary verb:
  - interpretive support = understand
  - refinement support = steer
  - task-execution support = complete
- This reduces overlap better than vague labels because each category is tied to the user's immediate goal
- If a component seems to do multiple things, I should classify it by the dominant role that justifies its appearance in that moment

### How to classify ambiguous cases

- If the component mostly clarifies meaning, consequences, or available options, classify it as interpretive support
- If the component mostly helps choose, adjust, or compare before commitment, classify it as refinement support
- If the component mostly enables the user to carry out a bounded subtask, classify it as task-execution support
- If a component changes role across a workflow, treat those as different moments or states rather than forcing one screen to do every role at once

### What each paper contributes to taxonomy

- Leviathan2025GenerativeUI
  - Shows that AI can generate task-specific interface structures around a user goal
  - Best contribution to taxonomy: task-execution support
  - Weakness: more about full generated experiences than small embedded ephemeral components
- Bieniek2024GenerativeAI
  - Shows hybrid multimodal interaction and transitions between input modes
  - Best contribution to taxonomy: secondary support for refinement support, especially where temporary UI mediates between user intent and system capability
  - Weakness: does not directly define a taxonomy of ephemeral UI roles and is more about interface strategy than component role
- Cheng2024Biscuit
  - Strongest paper for taxonomy
  - The ephemeral UI helps users inspect, understand, configure, and steer before committing
  - Best contribution to taxonomy: interpretive support + refinement support
- MultimodalInterface2024
  - Right now this is not doing real work for the taxonomy
  - Only keep it if I extract a concrete user-facing role from the actual paper
- Tang2025SurveyGUI
  - Useful for system architecture and agent logic more than end-user UI taxonomy
  - Perception / exploration / planning / interaction are more backend or agent capabilities than user-facing ephemeral component roles
- Ahmed2025LLMUIUX
  - Supports human-in-the-loop and iterative refinement workflows
  - Best contribution to taxonomy: refinement support
  - More about LLM-supported design workflows than runtime ephemeral UI
- Doring2013EphemeralUI
  - Foundational for defining what "ephemeral" means: temporary, situated, intentionally non-permanent
  - Helps justify the nature of the components, not their taxonomy directly
- Tambi2020GenerativeBanking
  - Supports adaptive, goal-relevant generated interfaces and personalized support
  - Best contribution to taxonomy: weaker support for task-execution support
  - Weakness: more adaptive/persistent than clearly ephemeral

### Synthesized taxonomy I can defend from the literature

- Interpretive support
  - Purpose: helps the user understand context, options, outputs, or consequences
  - Examples: explanation, preview, annotation, contextual hint, generated summary of what an action will do
  - Main support from literature: Cheng2024Biscuit, with indirect support from Doring2013EphemeralUI
- Refinement support
  - Purpose: helps the user steer, configure, compare, or adjust an intended action before committing
  - Examples: parameter controls, rewrite options, alternative comparison, filters, generated setting suggestions
  - Main support from literature: Cheng2024Biscuit, Ahmed2025LLMUIUX, Bieniek2024GenerativeAI
- Task-execution support
  - Purpose: helps the user carry out a bounded subtask inside the existing workflow
  - Examples: temporary mini-form, guided action flow, one-off assistant panel, generated helper for a specific task
  - Main support from literature: Leviathan2025GenerativeUI, Tambi2020GenerativeBanking, with some support from Cheng2024Biscuit

### Important note on what not to add

- Do not add visual-shape categories
- Do not add lifecycle categories
- Do not add design-principle categories
- Do not add a fourth role unless the artifact genuinely needs it
- A "coordination" category is possible, but right now it overlaps too much with refinement support unless I can justify it with a concrete artifact need

TODO: here is where i'm raw dogging

### Important note for lifecycle in the thesis

- I should not claim that the literature already gives me this exact taxonomy
- Better claim: the taxonomy is synthesized from recurring functional roles across the cited literature
- Best summary sentence:
  - Across the literature, ephemeral generative UI mainly seems to help users understand, steer, and complete bounded tasks within an existing workflow

The different options for lifecycle are

### What lifecycle means

- Lifecycle is the temporal behavior model of an ephemeral component
- It answers:
  - when should the component appear?
  - what happens while it is active?
  - when and how should it leave?
- Taxonomy classifies role, but lifecycle classifies temporal behavior
- This matters because "ephemeral" is not just a visual style, it is a claim about when UI should exist and when it should stop existing

### Rules for a good lifecycle

- It should begin from a clear user goal or contextual need, not from arbitrary system behavior
- It should preserve the user's orientation inside the base application
- It should make interaction bounded in time and scope
- It should include a clear exit, either by completion, cancellation, or loss of relevance
- It should be implementable in a real system, for example as React state transitions rather than just a theoretical diagram

### What each paper contributes to lifecycle

- Doring2013EphemeralUI
  - Strongest contribution: the simplest lifecycle of ephemerality itself
  - Best lifecycle reading: appear -> serve task -> disappear
  - Main value: establishes that temporary UI should be intentionally non-permanent and context-bound
  - Weakness: does not say much about user control, configuration, or software workflow integration
- Cheng2024Biscuit
  - Strongest contribution: scaffolded and user-steerable lifecycle
  - Best lifecycle reading: trigger -> configure -> commit or abandon -> vanish
  - Main value: shows that ephemeral UI can exist as an intermediate scaffold between intent and final action
  - This is important because the user gets to inspect and steer the temporary UI before committing to an outcome
- Leviathan2025GenerativeUI
  - Strongest contribution: goal-driven generation lifecycle
  - Best lifecycle reading: prompt/request -> generate interface -> use interface -> discard session
  - Main value: shows generated interfaces can emerge around a specific goal
  - Weakness: mostly about full generated experiences instead of embedded ephemeral augmentation
- Bieniek2024GenerativeAI
  - Strongest contribution: mixed-modality transition lifecycle
  - Best lifecycle reading: detect need -> surface suitable interface mode -> interact -> transition back or onward
  - Main value: supports the idea that temporary UI may mediate between the user and different system capabilities
  - Weakness: more about high-level interface strategy than a concrete ephemeral component lifecycle
- Tang2025SurveyGUI
  - Strongest contribution: action loop logic rather than end-user lifecycle
  - Best lifecycle reading: perceive context -> plan support -> interact -> observe outcome
  - Main value: useful for thinking about the system side of when ephemeral support should appear
  - Weakness: this is closer to agent reasoning than to a user-facing lifecycle for ephemeral UI
- Ahmed2025LLMUIUX
  - Strongest contribution: iterative human-in-the-loop refinement lifecycle
  - Best lifecycle reading: propose -> refine with human -> evaluate -> revise
  - Main value: supports a cyclical model where the user does not simply accept output, but iteratively shapes it
  - Weakness: more design-workflow oriented than runtime interface behavior
- Tambi2020GenerativeBanking
  - Strongest contribution: adaptive personalization lifecycle
  - Best lifecycle reading: sense user context -> generate support -> interact -> update future personalization
  - Main value: suggests support can be generated from inferred goals and behavior
  - Weakness: more persistent and longitudinal than clearly ephemeral
- MultimodalInterface2024
  - Right now this source is not doing much work for the lifecycle
  - Only keep it if I can extract a concrete lifecycle idea from the actual paper

### Synthesized lifecycle options I can defend from the literature

- Minimal ephemeral lifecycle
  - Stages: appear -> serve task -> disappear
  - Main support: Doring2013EphemeralUI
  - Strength: strongest conceptual definition of ephemerality
  - Weakness: too minimal if I want to explain user steering or implementation detail
- Scaffolded task lifecycle
  - Stages: trigger -> instantiate/configure -> interact or commit -> dismiss
  - Main support: Cheng2024Biscuit, with indirect support from Ahmed2025LLMUIUX
  - Strength: best fit for bounded temporary UI that helps users before they commit to an action
  - Weakness: still needs adaptation from notebooks to broader productivity workflows
- Mixed-initiative lifecycle
  - Stages: detect need -> propose support -> user steers -> hand back control
  - Main support: Bieniek2024GenerativeAI, Ahmed2025LLMUIUX, with some system-side support from Tang2025SurveyGUI
  - Strength: directly aligns with the goal of augmenting rather than replacing user workflow
  - Weakness: more abstract and less directly evidenced as a concrete ephemeral UI pattern
- Adaptive personalization lifecycle
  - Stages: sense context/history -> generate support -> interact -> retain/adapt for later
  - Main support: Tambi2020GenerativeBanking, with some support from Bieniek2024GenerativeAI
  - Strength: good if I want to emphasize personalization over time
  - Weakness: the least purely ephemeral because it implies memory and longer-term adaptation
- Full generative session lifecycle
  - Stages: request -> generate interface -> use interface -> discard session
  - Main support: Leviathan2025GenerativeUI
  - Strength: clearly shows AI can generate task-specific UI around a goal
  - Weakness: least appropriate for my thesis because it is more about whole generated experiences than embedded temporary support

### Best lifecycle for my thesis

- Recommended lifecycle:
  - trigger -> instantiation -> interaction -> dismissal
- Why this is the best fit:
  - It keeps the simplicity of Doring's temporary-then-gone logic
  - It incorporates Cheng's idea that ephemeral UI is a scaffold between need and action
  - It is concrete enough to implement as a state machine in React
  - It fits the capstone goal of augmenting an existing workflow without replacing the whole interface
- What each stage means in practice:
  - trigger = a user goal or contextual need is detected
  - instantiation = the temporary component appears inside the existing interface
  - interaction = the user inspects, steers, or completes the immediate subtask
  - dismissal = the component disappears once the task is completed, abandoned, or no longer relevant

### Optional refinement if I want a more BISCUIT-like version

- Alternative wording:
  - trigger -> instantiate -> steer/refine -> commit or abandon -> dismiss
- This version makes the user-control aspect more explicit
- It is useful if the artifact heavily emphasizes configuration before commitment
- The downside is that it is slightly more specific and less clean as a general framework

### Important note for the thesis

- I should not claim that one paper already gives me this exact lifecycle
- Better claim: the lifecycle is synthesized from recurring temporal patterns across the cited literature
- Best summary sentence:
  - Across the literature, ephemeral UI is consistently treated as temporary, goal-relevant support that emerges around a task, remains active only while it is useful, and then recedes to restore the baseline workflow

The different design principles needed are

### What design principles mean

- Design principles are the constraints that make ephemeral UI usable and non-disruptive
- Taxonomy says what role the component plays
- Lifecycle says how it appears and disappears over time
- Design principles say what qualities the component must preserve while doing that
- This is the part that most directly answers the "without disrupting the user experience" part of the RQ

### Evaluation of my current principles

- "Do not take up the whole screen"
  - Good instinct
  - Problem: too specific as written
  - Better version: preserve interface continuity by embedding or overlaying support without replacing the whole application view unless the task truly requires it
- "Inferred actions should not be easily destructive"
  - Good and important
  - Problem: too narrow if left on its own
  - Better version: preserve user control and safety, especially when support is inferred rather than explicitly requested
- "It should always help the user"
  - Good intention
  - Problem: impossible to guarantee and too vague to evaluate
  - Better version: maintain contextual relevance, meaning the component should appear only when it serves a clear task-related purpose
- "It should not take away the original intent of the page"
  - Very strong idea
  - Problem: phrasing is informal and tied to a specific example
  - Better version: preserve the primary intent and mental model of the host interface rather than redirecting the user into an unrelated experience

### What a better principle set should do

- Be abstract enough to apply across multiple artifact scenarios
- Be concrete enough to guide implementation decisions
- Be evaluable in the study
- Be clearly connected to the literature rather than sounding like arbitrary common sense

### What each paper contributes to design principles

- Doring2013EphemeralUI
  - Strongest contribution: temporariness and graceful disappearance
  - Principle ideas: avoid persistent clutter, let support exist only as long as needed
- Cheng2024Biscuit
  - Strongest contribution: interpretability and user steering
  - Principle ideas: make generated support understandable, let users inspect and refine before commitment
- Leviathan2025GenerativeUI
  - Strongest contribution: task relevance and generated affordances around a goal
  - Principle ideas: support should be tightly aligned to the active goal and not just generated for novelty
  - Also motivates reliability concerns because generated UI can fail
- Bieniek2024GenerativeAI
  - Strongest contribution: seamless transition between modes and workflow continuity
  - Principle ideas: preserve continuity across interaction modes and avoid forcing users into disconnected interfaces
- Ahmed2025LLMUIUX
  - Strongest contribution: human-in-the-loop control and iterative refinement
  - Principle ideas: keep the user in control and support revision rather than one-shot automation
- Tang2025SurveyGUI
  - Strongest contribution: safety and controlled action in agentic systems
  - Principle ideas: avoid unsafe autonomy, constrain action, and preserve predictability
- Tambi2020GenerativeBanking
  - Strongest contribution: personalization with safeguards
  - Principle ideas: adapt to user context, but do not let personalization become opaque, disruptive, or misaligned with user goals
- MultimodalInterface2024
  - Probably only useful if I want a principle around multimodal continuity, otherwise not essential

### Candidate principle pool from the literature

- Contextual relevance
  - Only appear when there is a clear task-related need
- Bounded scope
  - Stay limited to the immediate subtask rather than taking over the whole workflow
- Interface continuity
  - Preserve the surrounding page structure and the user's sense of place
- Interpretability
  - Make it legible what the component is helping with and why it appeared
- User control
  - Let the user steer, confirm, refine, or dismiss the support
- Safe inference
  - If support is inferred from behavior, avoid irreversible or high-risk actions without confirmation
- Graceful disappearance
  - Exit cleanly when the task is complete, abandoned, or irrelevant
- Goal alignment
  - Stay aligned with the purpose of the host page or workflow
- Reliability / graceful degradation
  - If generation fails, the base interface should still remain usable

### Several principle-set options

- Option 1: Minimal principle set
  - Contextual relevance
  - Bounded scope
  - User control
  - Graceful disappearance
  - Best if I want the cleanest and most compact framework
  - Weakness: may understate continuity and safety concerns
- Option 2: Workflow-preserving principle set
  - Contextual relevance
  - Bounded scope
  - Interface continuity
  - User control
  - Graceful disappearance
  - Best if I want the strongest direct connection to the RQ
  - This is probably the best default option
- Option 3: Safety-aware principle set
  - Contextual relevance
  - Bounded scope
  - User control
  - Safe inference
  - Graceful disappearance
  - Reliability / graceful degradation
  - Best if I want to emphasize that inferred or generated support must not behave dangerously or opaquely
  - Weakness: can read a bit engineering-heavy
- Option 4: Richer design-oriented principle set
  - Contextual relevance
  - Bounded scope
  - Interface continuity
  - Interpretability
  - User control
  - Graceful disappearance
  - Best if I want the most complete and design-oriented framework
  - Weakness: slightly broader and harder to keep concise in the methodology chapter

### Recommended principle set for my thesis

- Contextual relevance
  - The component should appear only when it serves a clear task-related purpose in the current context
- Bounded scope
  - The component should remain limited to the immediate subtask instead of taking over the broader workflow
- Interface continuity
  - The component should preserve the surrounding interface and the user's sense of place within the application
- User control
  - The user should be able to inspect, steer, confirm, refine, or dismiss the support rather than being forced into a system decision
- Graceful disappearance
  - The component should recede cleanly once the task is complete, abandoned, or no longer relevant

### Optional sixth principle if I want to emphasize inference

- Safe inference
  - Inferred support may suggest or preload assistance, but it should avoid destructive, irreversible, or strongly consequential actions without explicit user confirmation
- This is especially useful if the artifact includes proactive triggering based on observed behavior
- If the artifact is mostly user-invoked, this can stay secondary instead of becoming a core principle

### Why this recommended set is strong

- It maps directly onto the RQ's concern with non-disruptive augmentation
- It is grounded across the papers without pretending the literature already gives me this exact list
- It is abstract enough for a conceptual framework, but concrete enough to guide React implementation choices
- It can be operationalized in the artifact and later discussed in the evaluation

### Best thesis-safe wording

- I should not claim that the literature already provides this exact principle set
- Better claim: the principles are synthesized from recurring constraints and concerns across the cited literature
- Best summary sentence:
  - Across the literature, ephemeral generative UI is most defensibly constrained by principles of contextual relevance, bounded scope, continuity, user control, and graceful disappearance, with safety constraints becoming especially important when support is inferred rather than explicitly invoked

## Important note for reasoning of methodology

Your RQ is:

How can ephemeral, task-scoped generative UI components be designed to improve existing applications without disrupting the user experience?

To answer that well, you need to explain at least three things:

What kinds of components you are talking about -> taxonomy
When/how they should appear and disappear -> lifecycle
What constraints make them non-disruptive -> design principles

## Notes on questionoing my current methodology

- We could have only lifecycle and design principles because we only care about the HOW of using these components (lifecycle) can not disrupt the users workflow under some specific constraints (design principles)
- We could also prove the question with a general framework of the different patterns (how ephemeral task scoped ui can improve apps) of implmenting it based on a set of principles (without disrupting the user experience)
- We could do it on a evaluation matrix so you say that ephemereal ui can be described along some dimensions, then you use a rubric to judge whether the design is suitable
  - Dimension is how something varies for an ephemereal component, like persistence (how long it's visible), exit style (does it disappear automatically, manually, or after committing)
  - Then using the rubric you define exactly what "without disrupting user workflow" really means so:
    - low persistence
    - narrow task scope
    - high user control
  - So it means you yourself are defining what is a good ux, then based on the results from the from the tests you just put it into this rubric
  - I don't think this is amazing cause it's very subjective, you can argue your assumptions quite easily
  - Also my focus is in actually being able to implement this in reality, this matrix is only good at evaluating an existing and battle-tested pattern

## Specifying my actual experiment details

- 