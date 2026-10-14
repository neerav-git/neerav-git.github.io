---
slug: birb-hangout
approvedTargets:
  - project.birb-hangout
  - project.birb-hangout.methodology
  - project.birb-hangout.3-a-private-room
  - project.birb-hangout.4-media-reading-games
  - project.birb-hangout.5-each-behavior-uses
  - project.birb-hangout.6-a-hug-is
  - project.birb-hangout.7-rest-by-the
  - project.birb-hangout.9-subjective-3d-quality
  - project.birb-hangout.10-a-vague-visual
  - project.birb-hangout.13-birb-hangout-advances
  - project.birb-hangout.links
approvedLinks:
  - link.birb-hangout.live-product-story
  - link.birb-hangout.repository
metricIds: []
---

# Birb Hangout

## In plain terms

Birb Hangout is a realtime multiplayer 3D place where friends who live far apart can simply spend time together. Each person is an expressive bird in a cozy lounge: they can listen to music or watch something together, read side by side, play trivia, talk with live voice, rest, give a hug when the other person accepts it, or fly together through a dreamlike world. Nobody has to keep a video call going or play the same game; being together is enough.

It is live and playable, with private rooms, customizable birds, and safeguards for uploads and messages. Neerav also built his own tools for the hardest part of a 3D social product, judging whether motion and interactions feel right: vague feedback like "the walk feels floaty" became precise, repeatable comparisons, so each fix could be checked by eye and by measurement.

## Outcome

Birb Hangout is a browser-based 3D place where distant friends can spend time together without having to sustain a meeting or play the same game. Players inhabit expressive bird characters inside a shared lounge, notice one another's activity, move between shared and private rituals, and enter a seeded flight world called Dream. The product is designed for co-presence: reading while a friend chooses music, resting nearby, watching something together, joining trivia, or asking for a hug without taking over the room.

The result is a connected social-world system. Private rooms, identity, customization, media, reading, games, voice, consent-based interaction, rest, flight, terrain, persistence, uploads, deployment, and safety controls operate through one typed client-server model.

## Neerav's contribution

Neerav created and built Birb Hangout. He defined its product direction, social experience, realtime architecture, visual language, and evaluation methodology. He designed the player journeys and implemented the React client, Colyseus server, shared protocol, activities, Dream, procedural landscape, persistence, deployment, and safety controls.

He also built specialist tools for the unusually hard part of this product: deciding whether a character motion or spatial interaction actually reads correctly. Those tools include animation and interaction studios, repeatable scene and camera state, spatial annotation, candidate harnesses, exact-time capture, and visual-review evidence. The work joins product strategy, multiplayer systems, 3D interaction, creative direction, and evaluation infrastructure.

## User journey

A host creates a private room and shares an invite code. Each visitor chooses an identity and bird appearance, enters the lounge, and sees the other occupants and what they are doing. Objects in the room act as invitations: approaching a media area, bookshelf, game, resting place, or portal reveals the relevant interaction while keeping the shared room visible.

Friends can synchronize media intent, read independently near one another, play trivia, use peer-to-peer voice, or rest. A hug remains a separate consent-based interaction: one player requests it, proximity and current state are checked, and the other player accepts before the ceremony begins. Dream shifts the group into a flight world with procedural landscape generation and transient movement updates, preserving shared exploration without forcing every high-frequency coordinate into durable room state.

## Architecture and tools

The client uses React 18, React Three Fiber, Three.js, and Rapier for component-driven 3D scenes, rendering, collision, and interaction. A Colyseus server owns rooms and durable shared state. TypeScript shared packages define network messages and schemas across client and server. Blender supports authored character assets and motion work, while WebRTC carries peer-to-peer audio and S3-compatible storage supports controlled uploads and persistence.

Each behavior gets the synchronization model it needs. Durable identity, room membership, appearance, and activity state live in room schemas. Flight position uses transient relays suited to frequent updates. Voice is peer-to-peer. Media synchronizes intent and timestamps. Ceremonies such as hugs use explicit requests, consent, proximity, state transitions, and shared timing.

Procedural flight and terrain use seeded inputs so players can share a coherent world while clients render locally. Safety controls constrain upload types and sizes, validate realtime messages, and keep production diagnostics separate from the player experience.

## Methodology

Birb Hangout separates mechanical correctness from visual acceptance. Automated checks can establish that clips load, state transitions fire, cameras reproduce, messages validate, and multiplayer state converges. They cannot decide by themselves whether a bird's walk feels weighty, a hug reads as affectionate, or a lounge feels inviting.

The creative-engineering process therefore begins with a visual hypothesis and a preregistered failure prediction. Baseline, candidate, and ablation variants are captured with the same scene, camera, and timing. Review starts with blind semantic judgment before implementation details are shown. Spatial annotations connect visible problems to joints, timing, contacts, or layout coordinates. Hash-chained candidate records protect the comparison from accidental asset substitution, and owner acceptance remains the final authority for subjective quality.

## Results

The product implements private rooms, persistent identity, customizable birds, multiple shared activities, consent-based social interaction, rest, voice, and the shared Dream flight world. Instrumenting the twelve original animation clips quantified the problems before any retuning: boundary jumps of 1.3 to 1.5 world units in every clip, dead holds in six, and missing anticipation in nine. The hug experiment preregistered eight failure predictions and observed seven, which redirected the work toward a stronger review process. After remediation, the candidate self-tests passed 34 of 34 groups and the focused browser suite passed nine of nine checks. The broader test inventory records sixty specifications and 199 declarations across client, server, protocol, studio, and deployment surfaces.

These counts establish implemented coverage and a repeatable evidence system; final visual acceptance is a human judgment.

## Iterative improvement

Early animation review produced vague feedback such as a motion feeling floaty or a contact looking wrong. Neerav turned that ambiguity into fixed-camera, exact-time comparisons with annotated joints and contact points. The result was a review process that could distinguish timing, pose, root motion, camera, and asset causes before another candidate was built.

The initial social HUD exposed too much interface continuously. The design moved toward contextual, proximity-based affordances while preserving the lounge as the primary surface. Hug behavior was separated from general emotes because it requires consent, distance, paired state, and synchronized completion. Dream's high-frequency movement was kept outside durable room schemas, reducing unnecessary state pressure while retaining authoritative room membership and transitions.

## Impact

Birb Hangout explores a different model of remote connection: a place that supports quiet parallel activity as well as direct interaction. Friends benefit from lower-pressure ways to feel present; designers get a reusable language for consent and activity transitions; multiplayer engineers get behavior-specific synchronization patterns; and 3D teams get a reproducible way to turn subjective feedback into testable candidates. The project is differentiated by treating atmosphere, realtime architecture, and creative evaluation as one product problem.

## Scope

The implemented experience has a live single-service deployment and recorded interaction checks. Population-scale usage, high-concurrency capacity, and universal visual preference remain separate validation questions.

## Approved page targets and links

Use the approved target and link metadata in this record's front matter for page actions; it is not narrative content.
