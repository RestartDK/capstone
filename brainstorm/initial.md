# Lit review notes

## Submission instructions

This section of your thesis should cover the background and motivation of your project. Aim to answer questions like:

- What similar studies or solutions do exist already?
- What is lacking in the prior art? How is your project different or better?
- Do you answer any previously unaddressed questions or gaps?
- What is the research question / expected impact of your work?
- Which individuals or communities should care about the outcome of your work, and why?

Note that this will be just a draft and you can still update it prior to your final submission.

## General planning

- Introduction to your broad area of research (context)
- Problematization (state the problem)
  - The problem right now is that ui is static so even with the rise of llms unlocking new opportunities the agents are limited to what is available on the ui or background procceses
  - As a consquence if you do want some UI/UX it is limited to the chat window which is not the best
  - There needs to be a way that breaks through those boundaries to create a user experience that is tailoured to every person based on a set of primitives
- Why this problem/research area is important
  - It's important because there is alot more potential for ai and for a better user experience, right now the experience itself does not adapt to the person
- Gap in understanding/practice
  - Right now there is no research done on how this can impact people's flows generally, only on very specific use cases
- Impact on stakeholders
- Research Question (RQ)
  - How can ephemeral, task-scoped generative UI components be designed to augment existing applications without disrupting user workflow?

Every section should build on the previous one, and it should feel as a connected flow
that starts broad (context) and – as a funnel – becomes more specific as you read
through it (RQ)

## Sources notes

- Cheng2024Biscuit
  - Problem: People who were programming with llms had a hard time understanding the code being produced to work well for ml
  - Solution: Introduced an intermediary step between the prompt and the code generation which was an ephemereal ui that would help them understand and explore the ai generated code
  - Why it's relevant: because it shows that it posivitely helped people in a specific use case with including an intermediate ui step for understanding a specific use case which is how to understand the ai generated code
  - Gap: This was only done for engineers who know how llms work, what about for the general population? Also the intention for this paper was using ephemereal ui to understand a process better, what if you change that intention to improving the user experience of a user checking out for a product if that would increase their conversion
  - My questions:
    - Ok but does that mean it's only useful to understanding ai generated code? or could it be generalised to just providing the ephemereal ui in scenarios like tailouring the checkout experience for users

- Leviathan2025GenerativeUI
  - Problem: AI models make very good content but render it with a static and predefined interface, usually with markdown leading to worse UX
  - Solution: Generative UI where not just the content but also the interface which ignoring build time was much preferred by the users
  - Why it's relevant: Proves that interface that are completely ai generated are better than the current state of text based interface from a chat window
  - Gap: This only addresses experiences that are completely ui generated. In reality users like predictable interfaces so they know where things are so what is not explored is if you keep some parts static and others dynamic for the ui
  - My questions:
    - If users like static would they even want some of it to not be static? What scenarios would it be needed to do that in a typical UX flow?

## Notes
- Right now the problem with my lit review is that I know that there is a gap with genai that there are not enough application for ephemereal interfaces in terms of scope (not applied to user experience domain) and application (the ones that did look at ux were focused on completely ai generated experiences not part of it)
  - That means I need to prove / explain why even ephemereal interfaces that warrant the need to explore that specific solution, I need to find a source that will show that ephemereal interfaces have been proven to be efficient for users for some reason and maybe there was a limitation to their implementation (my guess for sure because they could not make it truely ephemereal to each unique user interaction)
- Most research focuses on how ai can help people design interfaces but not whether the interfaces themselves prove to be useful from ai (The Role of Large Language Models in UI/UX Design: A Systematic Literature Review)
- No dicsussions have been made on when ephemereal interfaces are appropriate or not,just says it's bad basically (google paper)
- Time is not a factor on fully generated ui (google paper)
- We have not talked about why genai in the first place, why is it even relevant to the scope of this paper why can't we do something that is ephemereal but without ai?

TODO

- [x] One paragraph on validating why genai in the first place vs none
- [ ] Talk about one paragraph for transicence
- [ ] Go over paper and make sure points come across well
- [ ] See if possible to have 2 sources per paragraph (should be 5 in total so 10 sources)
- [ ] Double check
- [ ] Submit it