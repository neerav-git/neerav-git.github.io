# Neerav Chaudhary

Source: https://neerav-git.github.io/projects/birb-hangout
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

REALTIME SOCIAL WORLD AND 3D EVALUATION · BUILT AND EVOLVING · 2026
Birb Hangout

A browser-based 3D place where distant friends inhabit the same room, share music and video, read, play, rest, and fly together - supported by purpose-built tools for evaluating character motion and spatial design.

ROLE
I created and built Birb Hangout, defining its product direction, social experience, realtime architecture, visual language, and evaluation methodology. I designed the player journeys; built and integrated the client, server, shared protocol, activities, Dream, procedural landscape, persistence, deployment, and safety controls; directed character and interaction quality; and developed the studios, spatial annotation, candidate harnesses, and evidence process used to evaluate the work.

SUMMARY

Playable social world. The lounge, shared activities, Dream, realtime protocols, and creative-review system are implemented and continue through visual and deployment refinement.

Build, evidence, and scope ↓
SKILLS APPLIED
TypeScript
Realtime Multiplayer
React Three Fiber
Colyseus
Harness Engineering
3D Interaction Design
BUILD, EVIDENCE, AND SCOPE
ON THIS PAGE
PRODUCT OUTCOME
A shared digital place where friends can spend time together at their own pace

Friends enter a private 3D lounge as birds, remain aware of one another, and move naturally among conversation, shared media, reading, trivia, affectionate gestures, quiet rest, and cooperative flight.

The product is designed around co-presence: each activity adds something legible to the room instead of replacing the room with another disconnected interface.

EXPERIENCE DESIGN
Activities are visible rituals that invite participation without demanding it

The lounge uses familiar spatial objects - a record cabinet, turntable, television, sofa, fireplace cushions, bookshelf, photo frame, light switches, and trivia screen - to communicate what is possible and what another person is doing. A bird carries a selected record sleeve to the turntable. A reader holds an open book while another player remains visible across the room. A sleeping bird stays physically present by the fire.

This diegetic approach makes intention observable through action and location. One person can read while another explores; someone else can sit nearby, join the media experience, offer a hug, or start a game. Focused overlays handle setup such as entering a video or choosing a title, then return the activity to the world.

The result is a product for both active and quiet moods. It gives distant friends and family a digital equivalent of sharing a room: company is the central reward, while the world provides enough structure to make that company easy to inhabit.

ROOM JOURNEY
A private room remains coherent from invitation through reconnection

Identity, ownership, occupancy, and shared state are first-class product behaviors.

CREATE
Open a private room and shape a bird

Choose a name and appearance, receive a short code in the room URL, and establish a locally stored owner token without requiring an account.

INVITE
Bring a friend into the same room

The code resolves an existing Colyseus room; invalid codes are rejected instead of silently creating a duplicate world where friends cannot see each other.

REJOIN
Recover the same identity after refresh

A stable browser client identity reclaims the live bird and the owner token restores host authority, preventing duplicate avatars and unnecessary account friction.

SHARE
Synchronize the facts the room must agree on

Presence, position, pose, seating, avatar, lights, photos, records, shelves, media, fireplace, games, and Dream membership travel through typed shared state.

PERSIST
Carry the room beyond one connection

A storage abstraction supports local disk in development and S3-compatible room records and private photo assets when configured.

SHARED ACTIVITIES
Media, reading, games, and ambience are engineered as social objects
MUSIC AND VIDEO
One room-owned media experience

A shared cabinet, carried record sleeve, turntable, television, authoritative media intent, host token, and real playhead correction keep the physical ritual and browser player aligned.

READING
Private pages, socially visible presence

PDF pages and a bounded EPUB 2/3 pipeline render crisp local reading while a separate animated book actor remains attached to the bird for everyone else in the room.

TRIVIA
A synchronized result becomes theatre

The server protects the answer key and broadcasts one ceremony start time; each browser derives the reveal, cards, camera movement, and ejection beats from elapsed time.

PHOTOS AND AMBIENCE
Room memory and atmosphere

Private photo assets, lighting, switches, fireplace state, and synthesized crackle make the shared space feel owned and lived in without reducing it to a content feed.

REALTIME ARCHITECTURE
Each behavior uses a synchronization model matched to its social invariant

The system matches each interaction to the synchronization model its social behavior requires.

DURABLE ROOM FACTS
Typed authoritative schemas

Colyseus schemas and room records hold the shared facts that must survive and remain consistent across players.

FLIGHT
Compact transient relays

High-rate Dream motion travels as validated packets with bounded reconstruction, keeping the durable room snapshot compact and lounge-only clients quiet.

VOICE
Peer-to-peer media

The server relays WebRTC signaling but never carries audio; spatial gain communicates distance while keeping a faraway friend audible.

CEREMONIES AND GESTURES
Shared time and staged protocols

Trivia uses one authoritative timestamp, while hugs use a server-owned request, readiness, synchronized start, cancellation, expiry, and cleanup lifecycle.

CONSENT AND SOCIAL SAFETY
A hug is a private request and synchronized agreement

The initiator approaches a nearby bird and sends a private request. The server checks identity, distance, availability, request rate, pair cooldown, and expiry before the recipient sees an accept-or-reject prompt. If accepted, the server computes complementary positions and facing, waits until both clients report ready, and starts one synchronized clip. Movement, timeout, cancellation, completion, or disconnection releases both participants.

The three-context smoke specification checks that the offer and consent prompt remain private while the accepted action becomes visible to the room. The feature includes the complete multiplayer lifecycle: proximity, consent, staging, synchronization, privacy, interruption, and cleanup.

THE DREAM
Rest by the fire opens into a shared, physics-driven flight world

A bird can settle on a fireside cushion, choose a sleeping posture, remain visible in the lounge, and follow a private three-breath sequence into the Dream. Breathing, stars, camera treatment, and background loading progress together while the lounge body stays asleep. The server authorizes entry only for an eligible napping player, owns one active Dream per room, creates the shared nonzero world seed, and tracks membership.

Inside the Dream, each browser advances its bird through a fixed-step six-degree-of-freedom model. Pitch, roll, wing shape, and discrete flaps feed lift, induced and parasitic drag, gravity, momentum, and coordinated turns. Diving converts altitude into speed; pulling out redirects speed into climb; banking reduces vertical lift. Keyboard, touch, gamepad, and scripted probes resolve to the same control structure.

Remote clients reconstruct a partner from compact motion packets using bounded extrapolation and correction against the same seeded world. The architecture keeps local flight immediate and gives each remote bird a coherent trajectory through the landscape.

PROCEDURAL LANDSCAPE
Public elevation data becomes a repeatable world built for browser-scale flight

The Dream starts from USGS 3DEP elevation and extends it with deterministic systems whose visual and performance consequences can be inspected independently.

TERRAIN
A measured flight-scale range

A 900-metre elevation window is processed and extended into an approximately 3.8-by-8.8-kilometre environment.

STRUCTURE
Seeded rivers, banks, islands, and shore

Repeatable builders create major landforms and landmarks so captures, multiplayer navigation, and visual comparisons can return to the same world.

ECOLOGY
Ground color and planted geometry agree

A normalized six-part cover budget drives canopy, shrub, herb, grass, rock, and soil, avoiding terrain that looks forested without containing a forest.

PERFORMANCE
Detail is concentrated where it earns attention

Species variation, level of detail, culling, tiling, and concentrated detail pockets deliver distinct silhouettes and discovery at a browser-compatible workload.

CREATIVE-ENGINEERING METHODOLOGY
Subjective 3D quality is treated as an observable result with human authority

The project gives typechecks, transport tests, telemetry, and human visual judgment distinct jobs. High-risk visual work starts from references, keeps baseline and rejected candidates available, records the camera and scene state, and requires owner sign-off. One clearly defective frame can veto a candidate; broad acceptance requires evidence across the meaningful views and motion.

Instrumentation of the original twelve animation clips found roughly 1.3-to-1.5-world-unit boundary jumps in every clip, dead holds in six, and missing anticipation in nine. An instrumented hug experiment preregistered eight likely failures and observed seven. Those findings redirected the work from guessed tuning toward measured mechanisms and showed that earlier gates had been testing the wrong construct.

The resulting harness applies frame-keyed changes to an allowlisted set of rig controls, supports linear, cubic-Hermite, and hold interpolation, captures exact frames and telemetry, and restores the baseline atomically. Candidate rounds require mechanistically different variants, an ablation, registered metrics, negative controls, and retained rejection history. Blind-first semantic review asks an unprimed observer what action appears to happen before revealing the intended action, exposing mechanically valid sequences that still communicate the wrong event.

VISUAL REVIEW SYSTEM
A vague visual comment becomes a reproducible engineering artifact
ISOLATE
Open the smallest truthful studio

Birb, Interaction, Room, Rig, Dream, and Landscape studios import production components, pose functions, builders, and cameras behind development-only routes.

OBSERVE
Pause at the meaningful frame and viewpoint

Exact-time capture, named action-axis cameras, orbit views, frame strips, and telemetry sidecars record what was actually seen.

ANNOTATE
Attach the note to scene geometry

An 11-by-11 raycast grid votes among geometry-derived subjects and stores ambiguity, hit rate, camera pose, scene state, likely subject, alternate hits, and world and subject-local coordinates.

COMPARE
Reopen the same view across candidates

The saved instruction restores camera and state so baseline, candidate, ablation, and later recapture answer the same visual question.

DECIDE
Keep acceptance with the owner

Hash-chained safeguards constrain write sets and transition authority, independent observations carry open defects forward, and uncertain subjective judgment returns to the owner for a decision.

RECORDED EVIDENCE
The project records both product breadth and improvements to its evaluation process

These figures are repository inventory or commit-scoped recorded results. They establish the depth of the evaluation surface and the specific checks completed in the recorded phases.

12
Original animation clips instrumented
All twelve showed a recorded 1.3-1.5 world-unit boundary jump; six contained dead holds and nine lacked anticipation.
7/8
Preregistered failures observed
The instrumented hug experiment confirmed seven predicted failure modes and redirected the methodology from cosmetic tuning to causal mechanisms.
34/34
Candidate self-test groups
The recorded semantic-review remediation passed all candidate self-test groups after the earlier workflow exposed misleading evidence.
9/9
Focused browser checks
The same recorded Phase 2 remediation passed the focused browser suite before owner closure.
60
Playwright smoke-spec files
The current source inventory contains 199 top-level test declarations across rooms, media, reading, voice, hugs, Dream flight, studios, mobile behavior, persistence, and safety boundaries.
SERVICE ENGINEERING
The deployment uses production-oriented shared-service controls
BUILD AND ORIGIN
One deployable client-server system

The production Docker image builds the client, server, and shared package, then serves the compiled experience from the same origin to reduce deployment and CORS complexity.

UPLOADS
Bounded private photo processing

Live-room bearer tokens, file and pixel ceilings, autorotation, resizing, WebP re-encoding, and room quotas constrain user-supplied images before storage.

TRAFFIC
Typed and rate-bounded inputs

Production room budgets, keyed network hashes, payload caps, validated message types, and invalid-message counts limit accidental and abusive load.

PERSISTENCE
Replaceable room and asset storage

A shared abstraction supports local development and S3-compatible records and assets while keeping persistence separate from realtime room logic.

IMPACT
Birb Hangout advances both the social experience and the way complex 3D work is built
DISTANT FRIENDS AND FAMILY
More ways to be together

People can talk, play, watch, read, rest, or explore without requiring constant conversation or identical attention.

INTERACTION DESIGNERS
Activities advertise themselves in the world

Visible objects, carried props, poses, ceremonies, and proximity make participation legible without turning the product into a stack of panels.

REALTIME ENGINEERS
State representation follows behavior

The architecture demonstrates when to use durable schemas, transient relays, local simulation, peer media, shared timestamps, or staged server authority.

AI-ASSISTED CREATIVE TEAMS
Visual feedback becomes actionable evidence

Studios and spatial notes replace ambiguous direction with a reopenable camera, frame, object, coordinate, scene state, comparison, and acceptance record.

MY CONTRIBUTION
I created the product, integrated the system, and designed how its visual quality is judged

I created Birb Hangout's co-presence premise and experience direction; designed the room, activities, social interactions, Dream, and world; built and integrated the React Three Fiber client, Colyseus server, shared protocol, persistence, media, reading, audio, trivia, flight, terrain, deployment, and service safeguards; directed character and interaction quality; and created the specialist studios, capture systems, spatial annotation, candidate safeguards, and human-controlled evaluation process.

EVALUATED SCOPE
A playable social world and a rigorous platform for continuing its development

Birb Hangout implements the private-room journey, persistent identity, shared activities, expressive and consent-based interaction, peer voice, room persistence, the Dream flight system, procedural terrain, development studios, reproducible capture, spatial annotation, and evidence-led candidate review.

The live deployment demonstrates the integrated product on a single service. The next operational studies cover larger concurrency, broader browser and media conditions, and population-level social outcomes.

PROJECT LINKS
Live product story
THE PUBLIC BIRB HANGOUT EXPERIENCE, PRODUCT RATIONALE, AND DEVELOPMENT STORY.
Repository
THE TYPESCRIPT CLIENT, SERVER, SHARED PROTOCOL, STUDIOS, TESTS, AND RESEARCH RECORDS.
