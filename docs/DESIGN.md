# Design System — Called

> Production visual source of truth for Called.
>
> Product behavior and business rules are defined in `prd.md`.
> Technical architecture, API, environment, and data model are defined in `architecture.md`.
> This document defines visual language, interaction design, layout, component behavior, responsive behavior, accessibility, and route-level UI rules.

---

# 1. Design Read

Called is a public forecasting arena where forecasts are sealed before outcomes exist, chained in a public ledger, settled from predefined sources, and scored transparently.

The visual language should communicate:

- verification
- technical credibility
- temporal integrity
- public records
- measurable uncertainty
- restraint
- observability

The product should feel like:

- PREMIUM
- DENSE
- ALIVE
- TECHNICAL
- POLISHED
- CREDIBLE
- OBSERVATIONAL
- VERIFIABLE

It must not feel like:

- generic SaaS
- financial trading dashboard
- crypto casino
- generic AI startup
- corporate admin template
- marketing landing-page template
- luxury editorial magazine
- blockchain explorer clone

The product is an arena and public record, not a betting interface.

---

# 2. Core Visual Philosophy

## 2.1 Design Personality

Called uses a dark ledger aesthetic with technical typography and restrained interaction.

The primary visual metaphor is:

> a public record of things said before they could be known.

Everything visual should reinforce one or more of:

- sealed
- recorded
- chained
- verified
- waiting
- settled
- compared
- calibrated

Avoid decoration that does not communicate product meaning.

---

## 2.2 Design Dial

```text
ENERGY  = 3
RHYTHM  = 3
MOTION  = 2
DENSITY = 4
```

### ENERGY 3

Moderately active.

The interface should have movement and data without becoming noisy.

### RHYTHM 3

Sections should have a deliberate rhythm.

Most sections are dark and structured.

Two visual interruptions are allowed:

1. Ledger surface
2. Receipt paper

### MOTION 2

Motion is functional.

Animation should:

- reveal
- confirm
- indicate change
- expose data
- provide feedback

Animation must never exist purely for decoration.

### DENSITY 4

The product should never feel empty when meaningful data exists.

Density comes from:

- metadata
- rows
- state indicators
- timestamps
- verification data
- source data
- technical context
- useful controls

Do not create density by adding decorative cards or filler text.

---

# 3. Production vs Prototype

The original HTML prototype is a visual reference.

It is NOT production content.

## 3.1 Prototype-only elements that MUST NOT ship

Remove from production:

- `PROTOTYPE` banner
- `working name`
- prototype-only state switchers
- fake leaderboard preview data
- fake settlement result
- fake chain state
- fake anchor state
- fake receipt values
- fake record counts
- fake metrics
- fake timestamps
- sample values presented as real

## 3.2 Production data rule

Production UI uses one of:

```text
REAL DATA
EMPTY STATE
LOADING STATE
ERROR STATE
```

Never:

```text
FAKE DATA
```

A sample/demo state is allowed only when explicitly isolated and labeled:

```text
SAMPLE
DEMO
FIXTURE
NOT REAL DATA
```

The label must remain visible wherever the sample data is displayed.

---

# 4. Design Tokens

## 4.1 Core colors

```css
:root {
  --void: #0a0a0b;
  --ink: #111113;
  --line: #26262b;

  --bone: #ece9e4;
  --mute: #a19d95;

  --seal: #ff5a36;

  --paper: #e9e4d8;
  --paper-ink: #141414;
}
```

---

## 4.2 Color roles

### `--void`

```text
#0a0a0b
```

Primary page background.

Use for:

- page background
- hero
- input surfaces
- header background base
- empty page regions

---

### `--ink`

```text
#111113
```

Elevated dark surface.

Use for:

- ledger section
- forecast slip
- calibration panel
- table headers where appropriate
- notification surfaces
- secondary containers
- administrative data surfaces

---

### `--line`

```text
#26262b
```

Structural divider.

Use for:

- section separators
- table separators
- decorative grids
- non-interactive dividers

Do NOT rely on `--line` alone as the visible boundary of interactive controls.

---

### `--bone`

```text
#ece9e4
```

Primary content color.

Use for:

- main text
- headings
- primary labels
- secondary button border
- chart baseline
- positive bars
- valid-state border
- primary navigation hover

---

### `--mute`

```text
#a19d95
```

Secondary content.

Use for:

- descriptions
- metadata labels
- secondary text
- timestamps
- kicker text
- axis labels
- supporting copy

---

### `--seal`

```text
#ff5a36
```

Primary attention color.

Use for:

- primary actions
- sealed status
- changed state
- actionable state
- Cassandra identity
- active values
- broken/error state
- negative skill
- new ledger activity
- outcome marker
- live chain values

Do not use decoratively.

---

### `--paper`

```text
#e9e4d8
```

Reserved light surface.

Use only for:

- receipts
- receipt-like evidence documents

Do not use as a general card surface.

---

### `--paper-ink`

```text
#141414
```

Text and borders on paper.

---

# 5. Accent Semantics

`--seal` is the primary attention color.

It may represent:

```text
SEALED
ACTIVE
ACTIONABLE
CHANGED
BROKEN
ERROR
NEGATIVE
LIVE
```

It must not be used as generic decoration.

Examples:

### Allowed

```text
Seal forecast          → seal
Sealed receipt         → seal
Broken ledger record   → seal
Negative skill         → seal
Cassandra name         → seal
Outcome marker         → seal
Primary CTA            → seal
```

### Not allowed

```text
Decorative divider     → no
Entire background      → no
Normal body text       → no
Every badge            → no
Random illustration    → no
```

---

# 6. Integrity State Semantics

Called must make integrity states visually distinct.

## 6.1 `SEALED`

Meaning:

The prediction has been committed and cannot be edited.

Visual:

- seal accent
- technical mono label
- dashed seal border where appropriate

---

## 6.2 `PENDING ANCHOR`

Meaning:

The record exists and is chained, but the chain head has not yet been anchored on Robinhood Chain.

Visual:

- neutral
- technical status text
- no "proven" language

Never represent pending anchor as proof.

---

## 6.3 `ANCHORED`

Meaning:

The chain head containing the record has been written to Robinhood Chain.

Visual:

- technical chain metadata
- block number
- transaction hash
- explorer link
- appropriate positive/verified presentation

---

## 6.4 `VALID`

Meaning:

The ledger or receipt cryptographically verifies correctly.

Use neutral/bone styling.

`VALID` does not require vermilion.

---

## 6.5 `BROKEN`

Meaning:

Verification failed.

Use:

- seal color
- explicit `BROKEN` text
- first broken record number

Never rely on color alone.

---

## 6.6 `VOID`

Meaning:

The question cannot be objectively settled.

Examples:

- source unavailable
- source unreadable
- invalid resolution conditions

Do not score a void question.

---

## 6.7 `PROVISIONAL`

Meaning:

Forecaster has fewer than 20 settled questions.

Always show:

```text
provisional
```

A provisional forecaster is not included in the ranked leaderboard.

---

# 7. Typography

Called uses exactly three primary font families.

## 7.1 Doto

Use for:

- large page titles
- hero title
- question title
- result words
- probability numbers
- receipt title
- large footer wordmark
- large numerical displays

Fallback:

```css
"Doto", "IBM Plex Mono", monospace
```

---

## 7.2 IBM Plex Sans

Use for:

- body text
- descriptions
- navigation
- buttons
- FAQ
- form labels
- explanatory content

Fallback:

```css
"IBM Plex Sans", system-ui, sans-serif
```

---

## 7.3 IBM Plex Mono

Use for:

- hashes
- IDs
- timestamps
- technical metadata
- status labels
- kicker
- ticker
- chain data
- probabilities where technical presentation is appropriate
- chart axes
- receipt values

Fallback:

```css
"IBM Plex Mono", ui-monospace, Menlo, monospace
```

---

# 8. Typography Scale

## 8.1 Global

```text
Body
16px
line-height: 1.55
IBM Plex Sans
```

---

## 8.2 Hero

```text
Hero title
min(140px, width / 8.6)

Hero lede
18px

Hero hint
13.5px Mono
```

---

## 8.3 Section titles

```text
clamp(34px, 5vw, 60px)
weight 700
line-height 1
Doto
```

Ledger title may use:

```text
clamp(40px, 7.4vw, 104px)
```

---

## 8.4 Question title

```text
clamp(30px, 4.2vw, 54px)
weight 600
line-height 1.04
Doto
```

---

## 8.5 Probability

Desktop:

```text
72px
weight 800
Doto
```

Mobile:

```text
58px
```

---

## 8.6 Outcome

```text
clamp(96px, 17vw, 230px)
weight 900
line-height 0.82
Doto
```

Examples:

```text
YES
NO
VOID
```

The outcome should use bone as primary color.

Do not use vermilion as the only indicator of YES or NO.

---

## 8.7 Kicker

```text
12px
IBM Plex Mono
letter-spacing: .06em
color: mute
```

Kickers are plain text.

They are NOT badges.

---

# 9. Layout System

## 9.1 Global container

```text
max-width: 1180px
padding-inline: 24px
margin-inline: auto
```

At:

```text
<= 560px
```

use:

```text
padding-inline: 18px
```

---

## 9.2 Section spacing

Desktop:

```text
96px top/bottom
```

Tablet/mobile:

```text
68px top/bottom
```

---

## 9.3 Section separators

Use:

```text
1px --line
```

for section separators.

---

## 9.4 Grid rules

All grid children must use:

```css
min-width: 0;
```

to prevent accidental page overflow.

---

# 10. Border Radius

Use:

```text
2px
```

for paper.

Use:

```text
4px
```

for:

- buttons
- inputs
- tabs
- filters
- FAQ controls
- status boxes

Use:

```text
6px
```

for:

- larger dark surfaces
- slips
- table containers
- calibration panel

There are no pill-shaped components.

Exception:

The slider thumb is circular because it is a physical handle.

---

# 11. Interactive Control Rules

## 11.1 Buttons

Default:

```text
min-height: 46px
padding-inline: 22px
border-radius: 4px
font-size: 15px
font-weight: 600
```

---

## 11.2 Primary button

```text
background: seal
border: seal
text: void
```

Hover:

```text
background: bone
border: bone
text: void
```

---

## 11.3 Secondary button

```text
background: transparent
border: bone
text: bone
```

Hover:

```text
background: bone
text: void
```

---

## 11.4 Small button

```text
min-height: 44px
padding-inline: 16px
font-size: 14px
```

---

## 11.5 Tabs / filters

```text
min-height: 44px
border: 1px solid interactive-border
border-radius: 4px
```

Active:

```text
border: bone
color: bone
```

Inactive:

```text
border: interactive-border
color: mute
```

---

# 12. Interactive Border Accessibility

Decorative separators may use:

```text
--line
```

Interactive controls should use a border token with at least sufficient non-text contrast.

Preferred:

```text
--mute
```

or another brighter neutral token.

Use:

```css
:focus-visible {
  outline: 2px solid var(--bone);
  outline-offset: 3px;
}
```

Never remove focus indicators.

---

# 13. Touch Targets

Minimum interactive target:

```text
44px
```

Applies to:

- buttons
- nav links
- tabs
- filters
- select
- slider
- FAQ summaries
- ticker controls
- footer links
- menu controls
- pagination
- table actions

---

# 14. Navigation

## 14.1 Header

Sticky header:

```text
min-height: 56px
background: rgba(10,10,11,.92)
border-bottom: 1px solid --line
```

---

## 14.2 Wordmark

Wordmark:

```text
Called
```

The wordmark is the Doto typeface set from the supplied logo mark. Source of
truth is `public/called-logo-no-bg.png`; the header, footer, icons and share
card are generated from it with `npm run gen:icons`.

Wordmark:

```text
Doto
36px
weight 800
```

Never append:

```text
working name
prototype
beta
```

unless explicitly required by product state.

---

## 14.3 Navigation

Product navigation:

```text
Question
Result
Ledger
Leaderboard
Method
FAQ
```

Navigation must resolve to real product destinations.

Recommended mapping:

```text
Question
→ /questions

Result
→ homepage result section
→ /#result when possible

Ledger
→ /ledger

Leaderboard
→ /leaderboard

Method
→ /method

FAQ
→ /faq
```

Never link to routes that do not exist.

---

## 14.4 Mobile navigation

At widths <= 860px:

- header stacks
- nav becomes horizontal scroll
- no page-level horizontal overflow
- each link remains at least 44px high

---

# 15. Global Page Anatomy

Internal pages should use:

```text
Header
Page intro
Primary information surface
Secondary information
Related actions
Footer
```

Avoid:

```text
Hero
Marketing CTA
Three-card feature row
Testimonial section
Pricing section
```

Called is not a generic marketing SaaS.

---

# 16. Shared Page Components

The product should reuse a consistent set of primitives.

Recommended:

```text
AppHeader
Footer
SectionHeader
PageHeader
Kicker
StatusLine
StatusBadge
EmptyState
LoadingState
ErrorState
DataTable
DataRow
MetaList
QuestionMeta
QuestionStatus
Countdown
ForecastSlip
Receipt
VerificationStatus
AnchorStatus
LedgerTable
CalibrationChart
SpreadPlot
SkillBar
FilterGroup
Timeline
HashValue
ExplorerLink
WalletStatus
```

Components should be composable and route-agnostic.

---

# 17. Empty States

Empty states are part of the production design.

Never make an empty state feel like a broken product.

Use:

```text
Kicker
Short honest statement
Optional explanation
Optional next action
```

Examples:

```text
No question is open right now.
Nothing is being asked.

No settled questions yet.
Results appear once a question is resolved.

No human forecasts yet.
Humans join once wallet login is available.

No agents registered.
Register an agent to run it on an open question.
```

Never display fake metrics to fill an empty area.

---

# 18. Loading States

Loading states must represent actual loading.

Do not expose loading-state preview buttons.

Use:

- table skeletons
- row placeholders
- restrained shimmer
- preserved layout dimensions

Motion should be disabled under reduced-motion preferences.

---

# 19. Error States

Error states must:

- state what failed
- avoid exposing sensitive information
- provide retry where meaningful
- preserve surrounding page context

Pattern:

```text
What failed

Short technical explanation

[ Try again ]
```

Use `role="alert"` only for actual urgent errors.

---

# 20. Hero System

## 20.1 Hero height

```text
min(94vh, 860px)
```

---

## 20.2 Character horizon

The hero background is a character field composed from hexadecimal characters.

Character system:

```text
0 1 2 3 4 5 6 7 8 9
a b c d e f
```

Use:

```text
IBM Plex Mono
```

Character size grows toward the bottom.

The upper sky is sparse.

The lower field becomes denser.

The visual metaphor:

```text
sealed records
      ↓
known state
      ↓
unknown future
```

---

## 20.3 Hero interaction

Pointer interaction may:

- illuminate nearby glyphs
- disturb title particles
- return particles to equilibrium

Do not introduce a second unrelated animation system.

---

## 20.4 Hero vignette

Use one functional vignette.

Purpose:

- preserve title contrast
- protect text readability

Do not use vignette as decoration across the whole page.

---

# 21. Hero Title

Use the dot-matrix treatment from the prototype.

Requirements:

- canvas approximately 220px tall
- responsive rebuild
- pointer interaction on desktop
- `touch-action: pan-y`
- decorative canvas `aria-hidden=true`
- hidden semantic `h1`

Semantic heading:

```text
Say it before it happens.
```

The canvas is visual.

The real accessible heading remains in the DOM.

---

# 22. Hero Copy

Primary statement:

```text
Say it before it happens.
```

Supporting copy should express:

- forecasts are sealed before outcomes
- hashes create temporal proof
- results are scored
- chain anchoring provides public timestamp evidence

Avoid generic marketing claims.

---

# 23. Hero CTA

Primary:

```text
Seal a forecast
```

Secondary:

```text
Verify the ledger
```

Primary goes to the active/open question or `/questions`.

Secondary goes to `/ledger`.

---

# 24. Hero Ticker

The ticker represents live chain state.

Show:

```text
SESSION HEAD
HEAD HASH
RECORDS
ANCHOR STATUS
CHAIN
HASH METHOD
```

Use:

```text
IBM Plex Mono
12–13px
```

Ticker scroll:

```text
46s linear
```

Pause on hover.

Provide Pause/Play on pointer-friendly interfaces.

Under reduced motion:

- stop scrolling
- show static wrapping text
- hide Pause control if appropriate

The ticker must never display invented chain state.

If there is no data:

```text
SESSION HEAD / NONE
RECORDS / 0
STATUS / PENDING
```

---

# 25. Homepage Structure

Homepage must contain:

```text
Hero
Open Question
Result
Ledger
Leaderboard
Method
FAQ
Footer
```

This ordering is intentional.

Do not insert unrelated marketing sections.

---

# 26. Homepage — Open Question

Layout:

```text
1.25fr / 1fr
gap: 56px
```

Left:

- question text
- metadata
- reword input

Right:

- forecast slip

---

## 26.1 Question metadata

Show:

```text
Source
Test
Opens
Closes
Resolves
Question ID
Status
```

Use technical mono values.

Values may wrap.

IDs and hashes use:

```text
word-break: break-all
```

---

# 27. Reword Interface

The reword field is a product interaction, not decoration.

When the question text changes:

- question ID changes
- changed ID uses seal color
- restore original text restores original ID

Explain:

```text
A changed question is a different question.
Existing forecasts do not transfer.
```

The ID is generated from:

```text
text
date
source
test
```

Do not fake ID changes in production.

---

# 28. Forecast Slip

Dark forecast slip:

```text
background: ink
border: line / interactive border where appropriate
radius: 6px
padding: 28px
```

Title:

```text
Your forecast
```

Supporting line:

```text
One forecast per question. Once sealed it cannot be edited.
```

---

## 28.1 Probability

Display:

```text
68%
```

using Doto.

Slider:

```text
1–99
```

Thumb:

```text
28px circle
seal
```

The thumb is the only circular UI element in the base system.

---

## 28.2 Reason

Single-sentence textarea.

Maximum:

```text
140 characters
```

Show live character count.

---

## 28.3 Seal action

Primary full-width button:

```text
Seal forecast
```

On success:

- show receipt block
- show sealed status
- show commit/hash
- announce receipt status accessibly

---

# 29. Receipt Preview

After sealing, the forecast slip may include a compact receipt preview.

Show:

```text
SEALED

Question
Probability
Commit
Record hash
Sealed at
Anchor state
```

Receipt preview uses dashed vermilion border.

Do not use paper surface for the small inline receipt preview.

The full `/receipt/[id]` route uses the paper design.

---

# 30. Homepage Result

Result appears only when an actual settled question exists.

If none:

```text
No settled questions yet.
Results appear once a question is resolved.
```

Do not show:

- fake YES/NO
- fake scores
- fake spread plot
- fake winner

---

# 31. Result Spread Plot

Purpose:

Show where forecasters were positioned before the outcome became known.

Layout:

```text
0% -------- 50% -------- 100%
```

Forecaster markers:

```text
10x10px square
bone
```

Labels alternate above and below the axis.

Outcome marker:

```text
seal
```

Outcome must include text.

Example:

```text
outcome
YES
```

Do not communicate the result by color alone.

Chart must have:

```text
role="img"
aria-label="..."
```

---

# 32. Score Table

Show rows, not cards.

Columns may include:

```text
Forecaster
Prediction
Outcome
Brier
Skill
```

Winner highlighting:

- seal for emphasis
- never remove the rest of the context

For one question, explicitly communicate:

```text
One question proves nothing.
```

---

# 33. Homepage Ledger

Ledger section intentionally changes background to:

```text
--ink
```

This is one of the main rhythm breaks.

Show:

- latest records
- chain hash
- previous hash
- forecast
- reason
- status
- anchor state
- verify action

---

# 34. Ledger Table

Tables should remain table-first.

Do not transform every row into a mobile card unless necessary for usability.

On narrow screens:

- table scrolls horizontally within its own container
- body must not horizontally scroll

Recommended minimum table width:

```text
680px
```

---

# 35. Ledger Verification

Verify action should:

1. recompute hashes
2. compare previous hashes
3. identify the first broken record
4. produce `VALID` or `BROKEN`

Status surface:

```text
VALID
```

uses neutral bone.

```text
BROKEN
```

uses seal.

Example:

```text
BROKEN — first mismatch at record 17.
```

---

# 36. Ledger Record State

Every record must clearly display:

```text
SEALED
PENDING ANCHOR
ANCHORED
```

Do not collapse these into one generic `verified` label.

---

# 37. Ledger Export

Where supported, expose:

```text
Export JSONL
```

Use small technical controls.

The export action should not visually compete with Verify.

---

# 38. Leaderboard

Leaderboard is a data surface.

Use:

```text
1.35fr / 1fr
gap: 44px
```

Left:

- leaderboard table

Right:

- calibration panel

---

# 39. Leaderboard Filters

Filters:

```text
All
House model
Baselines
Agents (BYOK)
Humans
```

Use 44px controls.

No pills.

Active:

```text
bone text
bone border
```

---

# 40. Leaderboard Columns

Required:

```text
#
Forecaster
Kind
Skill vs baseline
Brier
n
```

May also expose:

```text
Failures
Status
```

when space permits.

---

# 41. Skill Bar

Skill bar:

```text
height: 6px
radius: 1px
```

Positive:

```text
bone
```

Negative:

```text
seal
```

Display the signed value:

```text
+12.4%
-24.7%
```

Do not rely on bar color alone.

---

# 42. Provisional State

If:

```text
n < 20
```

show:

```text
provisional
```

and exclude the forecaster from ranking.

Do not hide the record.

The purpose is transparency.

---

# 43. Shared Set

Leaderboard must support a shared-set presentation where two forecasters can be compared on the exact same question set.

The visual should make the set explicit.

Do not imply scores are directly comparable when they are based on different sets.

---

# 44. Calibration Panel

Calibration is one of Called's signature visual elements.

The question:

```text
When it said 70%, how often was it true?
```

Chart:

```text
0–100% said
0–100% right
```

Use:

- grid lines
- bone perfect-calibration diagonal
- seal calibration curve
- sample-size-aware points

---

# 45. Calibration Chart

SVG:

```text
viewBox="0 0 360 330"
```

Plot area approximately:

```text
304 × 260
```

Axis labels:

```text
said (%)
was right (%)
```

Perfect calibration:

```text
dashed bone line
```

Curve:

```text
seal
```

Point size reflects sample count.

Accessibility:

```text
role="img"
aria-label="..."
```

---

# 46. Murphy Decomposition

Forecaster profiles must expose:

```text
Reliability
Resolution
Uncertainty
Residual / remaining term
```

The visual language should be analytical rather than decorative.

Use rows, values, and simple explanatory labels.

---

# 47. Method Page

`/method` explains the product lifecycle.

Primary stages:

```text
ASK
SEAL
WAIT
SETTLE
SCORE
CALIBRATE
ANCHOR
VERIFY
```

Use a vertical timeline.

Step marker:

```text
9x9px square
```

Completed:

```text
seal fill
```

Incomplete:

```text
void fill
bone border
```

Do not use circular timeline bullets.

---

# 48. Method Receipt

The receipt is the major visual interruption.

It is:

- paper
- slightly rotated
- dense
- technical
- evidence-oriented

Paper:

```text
background: paper
color: paper-ink
radius: 2px
padding: 30px 28px 34px
transform: rotate(-1.2deg)
box-shadow: 0 18px 40px rgba(0,0,0,.5)
```

Bottom edge:

receipt tear effect.

---

# 49. Receipt Rules

The paper surface is reserved for evidence.

Use:

```text
RECEIPT
```

Doto 30px / 800.

Rows:

```text
Question
Probability
Salt
Commit
Record hash
Sealed
Signature
Anchor
Block
```

Values use:

```text
IBM Plex Mono
12–13px
```

The receipt should not look like a marketing card.

---

# 50. Receipt Stamp

Possible states:

Production:

```text
SEALED
ANCHORED
VALID
```

Demo only:

```text
SAMPLE, NOT A REAL RECEIPT
```

Never use sample stamps on production receipts.

---

# 51. Receipt Verification Page

`/receipt/[id]` is evidence-first.

Primary hierarchy:

```text
RECEIPT
↓
VERIFY STATUS
↓
ANCHOR STATUS
↓
QUESTION
↓
SIGNATURE / COMMIT / HASH
↓
SETTLEMENT
```

Display:

- question ID
- probability
- salt
- commit
- record hash
- seal timestamp
- publication signature
- public key reference
- verify state
- anchor transaction
- block
- explorer link
- result if settled

---

# 52. Questions Archive

Route:

```text
/questions
```

This is the public archive.

Use dense rows.

Possible columns:

```text
Question
Status
Source
Test
Opens
Closes
Resolves
ID
```

Lifecycle filters:

```text
Open
Closed
Settled
Void
All
```

Do not use fake statistics above the table.

---

# 53. Question Detail

Route:

```text
/q/[id]
```

This is the core product surface.

Page hierarchy:

```text
Question identity
Source + Test
Lifecycle
Countdown
Forecast interaction
Receipt
Reveal
Settlement
Score
Verification
Anchor
```

---

# 54. Question State — OPEN

Show:

- question text
- source
- test
- open time
- close time
- settlement time
- countdown
- reword behavior
- seal interface

Do NOT show other forecasts.

---

# 55. Question State — CLOSED

Show:

- question closed
- all forecasts revealed
- commit/reveal information
- salts where applicable
- ledger records
- verification status

The forecast form becomes read-only.

---

# 56. Question State — SETTLED

Show:

- outcome
- source value
- source
- block
- test result
- forecaster predictions
- Brier scores
- score distribution
- settlement timestamp
- anchor information

---

# 57. Question State — VOID

Show:

```text
VOID
```

Then explain:

- what failed
- which source was unavailable
- why objective settlement was impossible

Never invent an outcome.

Never score the question.

---

# 58. Question Identity

Display:

```text
Question ID
```

in technical mono.

The ID is meaningful.

Changing:

- text
- date
- source
- test

creates a new question identity.

Reword UI should explicitly communicate this.

---

# 59. Forecaster Profile

Route:

```text
/f/[handle]
```

This is a forecasting dossier.

It should feel like a public record, not a social profile.

Primary fields:

```text
Handle
Wallet
Type
Skill
Brier
n
Failures
Status
```

---

# 60. Profile Hero

Do not create a large marketing hero.

Use a compact dossier header.

Example hierarchy:

```text
FORECASTER
handle

House model / Agent / Human / Baseline

SKILL
Brier
N
Failures
```

Use aligned metadata rather than decorative statistic cards.

---

# 61. Profile Calibration

Show:

- calibration curve
- sample size
- Murphy decomposition
- explanation

The chart must remain accessible.

---

# 62. Profile History

History uses a table.

Columns:

```text
Question
Prediction
Outcome
Brier
Status
Date
```

Hash values should use mono.

---

# 63. Cassandra

Cassandra is the primary house forecaster.

UI label:

```text
Cassandra
House model
```

Visually distinguish Cassandra with seal accent.

Do not give Cassandra a generic AI marketing treatment.

Cassandra is a measured participant in the arena.

---

# 64. Cassandra Metadata

Where appropriate show:

```text
Model
Version
Prompt hash
Forecast count
Failures
Calibration
```

Never display internal chain-of-thought or hidden reasoning.

Only display the public answer and one-sentence reason.

---

# 65. Reserve Forecasters

Reserve layers:

```text
Helenus
Pythia
Tiresias
Calchas
Stray
```

Each reserve is treated as a separate forecaster.

The UI should not merge their records into Cassandra.

Fallback event may be explained as:

```text
Cassandra unavailable.
Helenus answered.
```

Use factual technical language.

---

# 66. Shadow Mode

During shadow mode:

- model outputs may be visible where appropriate
- they do not enter leaderboard ranking
- the UI must clearly distinguish shadow data from ranked results

Do not imply validated skill before the required period has completed.

---

# 67. Baselines

Baseline names:

```text
Always-yes
Parrot
Hedgehog
Drift
Drunk
```

Each must be labeled:

```text
Baseline
baseline rule, not a model
```

Do not market baselines as AI systems.

---

# 68. Agent BYOK

Route:

```text
/agents
```

This is a technical self-run interface.

Required information:

```text
Agent name
Provider
Model
Prompt hash
Status
```

---

# 69. BYOK Warning

Make the warning prominent:

```text
Your API key is used for one call and is not stored.
Use a key with an appropriate spending limit.
```

Never store the key.

Never display the key after submission.

Never include it in:

- logs
- errors
- analytics
- database
- screenshots
- audit output

---

# 70. Agent Run

Use:

```text
Run my agent
```

Show:

- question
- agent
- provider
- model
- run state
- result
- timestamp

Only one run per:

```text
(agent, question)
```

---

# 71. Agent Label

Production terminology:

```text
Agent (self-run)
```

Optional browser-only mode:

```text
self-reported
```

Never visually present it as equivalent to Cassandra's verified house execution.

---

# 72. Account Page

Route:

```text
/me
```

The account page is a personal record.

Show:

```text
Wallet
Handle
Forecasts
Receipts
Agents
Failures
```

Keep it dense.

Do not introduce social-profile patterns.

---

# 73. Admin

Route:

```text
/admin
```

Admin should remain visually consistent with Called.

It may be denser than public routes.

Allowed:

- dense tables
- filters
- forms
- operational metadata
- logs

Avoid:

- generic dashboard metric cards
- colorful admin widgets
- excessive charts
- separate admin branding

---

# 74. Admin Question Creation

Question creation should expose the Ask gate clearly.

Inputs:

```text
Question text
Source
Test
Open time
Close time
Resolution time
```

Validation should explain exactly which rule failed.

Invalid conditions include:

- no future date
- no source
- invalid test
- ambiguous language
- invalid length
- invalid schedule
- too many open questions

---

# 75. Admin Settlement

Settlement UI must communicate:

```text
Source
Value
Block
Test
Result
Evidence
Approval
Audit log
```

Manual settlement must show second approval.

Do not use a one-click "force settle" visual unless explicitly supported by architecture.

---

# 76. FAQ

Route:

```text
/faq
```

Use native:

```html
<details>
  <summary></summary>
</details>
```

The FAQ should be editorial and technical.

---

# 77. Required FAQ Topics

At minimum:

```text
Why can't forecasts be edited?
What does the hash prove?
What does an anchor prove?
What happens when a source fails?
What happens when a model gives no probability?
Why is n shown?
Why is n < 20 provisional?
Can models be compared across different question sets?
Are there financial stakes?
Is Called financial advice?
What does the leaderboard actually measure?
What does calibration mean?
```

---

# 78. Method / FAQ Content Rules

Always state clearly:

- small n is noisy
- past questions measure recall rather than forecasting
- results depend on prompts and temperature
- scores are not transferable across unrelated question sets
- failures are not converted into probabilities
- void questions are excluded
- no money or betting exists
- numbers describe forecasters, not future price recommendations

---

# 79. Footer

Footer should include:

```text
Called
```

Large Doto wordmark.

Useful links:

```text
Questions
Ledger
Leaderboard
Method
FAQ
Agents
```

Attribution:

```text
Brier
MIT
```

where required.

All attribution links must be real.

---

# 80. Data Presentation Principles

## 80.1 Use rows for comparable data

Use tables for:

- leaderboard
- ledger
- forecast history
- question archive
- audit log
- agent runs

Do not turn comparable data into isolated cards.

---

## 80.2 Use cards only when container meaning matters

Acceptable:

- forecast slip
- calibration panel
- verification status panel
- receipt
- form surface

Avoid:

```text
three cards of arbitrary statistics
```

---

# 81. Technical Metadata

Technical values use IBM Plex Mono.

Examples:

```text
q-2026-10-03-a81c21
0x83ab...
SHA-256
2021
block 192184
```

Long hashes:

- may be shortened visually
- must preserve full value in accessible text or tooltip
- should remain copyable

---

# 82. Hash Display

Preferred:

```text
8f3b12cd...a81e20
```

with full hash available through:

- copy button
- title
- expandable detail
- accessible label

Never silently truncate evidence.

---

# 83. Wallet / Address Display

Use technical mono.

Short display:

```text
0x91A3…D72F
```

Full address remains available.

Do not use ENS/name assumptions unless real data exists.

---

# 84. Explorer Links

Explorer links are technical actions.

Display:

```text
View transaction
View block
```

Do not use generic external-link graphics as the primary meaning.

---

# 85. Verification Status

Verification surface should explicitly distinguish:

```text
Receipt
Chain
Signature
Anchor
Settlement
```

Example:

```text
RECEIPT        VALID
CHAIN          VALID
ANCHOR         PENDING
SETTLEMENT     NOT YET
```

This is preferable to one generic:

```text
VERIFIED
```

---

# 86. Charts

Charts must be:

- legible
- restrained
- data-first
- accessible

Avoid:

- ornamental chart backgrounds
- gradients
- unnecessary 3D
- decorative axes
- overloaded legends

---

# 87. Chart Accessibility

Every meaningful chart must provide:

```text
role="img"
aria-label="..."
```

The text alternative must summarize:

- what is plotted
- relevant participants
- key values
- outcome where applicable

Do not rely only on visual geometry.

---

# 88. Animation

Motion should use:

```text
MOTION 2
```

Allowed motion:

```text
section reveal
ledger flash
hash scramble
skill bar growth
calibration line draw
ticker
hero glyph movement
title particle physics
button color transition
```

---

# 89. Reveal Animation

Default:

```text
opacity: 0 → 1
translateY(16px) → 0
duration: 0.7s
ease
```

Stagger:

```text
(index mod 3) × 90ms
```

Trigger:

```text
IntersectionObserver
threshold: 0.12
```

Reveal only once.

---

# 90. Reduced Motion

For:

```css
@media (prefers-reduced-motion: reduce);
```

disable:

- smooth scrolling
- reveal transitions
- ticker motion
- ledger flash
- skeleton shimmer
- chart draw animation
- hash scramble
- bar transitions
- hero glyph animation
- particle physics
- paper rotation

Paper becomes unrotated.

All content remains visible immediately.

---

# 91. Ticker Reduced Motion

Reduced motion:

- ticker does not scroll
- content wraps
- no Pause control required

---

# 92. Hero Reduced Motion

Reduced motion:

- static hex field
- no cursor glow
- no animated glyph replacement
- static dot-matrix title
- no particle physics

---

# 93. Responsive System

Two primary breakpoints:

```text
860px
560px
```

---

# 94. Desktop — >860px

Use max-width:

```text
1180px
```

Layouts:

```text
Question
1.25fr / 1fr

Result
0.9fr / 1.4fr

Leaderboard
1.35fr / 1fr

Method
1fr / 1fr

FAQ
0.8fr / 1.2fr
```

Sticky elements:

- calibration panel
- FAQ heading

---

# 95. Tablet / Mobile — <=860px

All major grids become one column.

Gap:

```text
40px
```

Section padding:

```text
68px
```

Disable:

- sticky calibration
- sticky FAQ heading

Header:

- vertical stacking
- horizontal nav scroll

---

# 96. Small Mobile — <=560px

Container:

```text
18px
```

Probability:

```text
58px
```

Metadata:

```text
label above value
```

Receipt data:

```text
label above value
```

Avoid compressed two-column metadata.

---

# 97. Responsive Table Rule

Never allow table overflow to escape into page overflow.

Use:

```text
overflow-x: auto
```

on the table wrapper.

The table itself may retain:

```text
min-width: 680px
```

The body should remain:

```text
overflow-x: hidden
```

but this is only a safety net.

---

# 98. Responsive Charts

SVG charts must use:

```css
width: 100%;
height: auto;
```

Charts must remain readable at:

```text
390px
```

If required, increase height rather than shrinking labels below legibility.

---

# 99. Navigation on Small Screens

Navigation becomes:

```text
horizontal scroll
```

Do not force all links to fit in one row.

Do not use hamburger menus unless the existing product architecture requires it.

---

# 100. Accessibility

Called targets WCAG AA behavior.

---

# 101. Contrast

Target contrast:

```text
normal text >= 4.5:1
large text >= 3:1
```

Preferred known token relationships:

```text
bone / void
bone / ink
mute / void
mute / ink
seal / void
seal / ink
paper-ink / paper
```

Interactive boundaries should meet appropriate non-text contrast requirements.

---

# 102. Keyboard

All controls must be keyboard reachable.

Tab order follows visual order.

Do not create keyboard traps.

Custom controls must have visible focus.

---

# 103. Forms

Every field has a real label.

If label is visually hidden, it remains accessible.

Errors should:

- identify the field
- explain the problem
- preserve user input
- use `role="alert"` when appropriate

---

# 104. Status Announcements

Use:

```text
aria-live="polite"
```

for:

- receipt generation
- chain head updates
- non-urgent status changes

Use:

```text
role="status"
```

for:

- Verify result

Use:

```text
role="alert"
```

for:

- Seal errors
- urgent action failures

---

# 105. Tables

Every semantic data table should have:

- caption
- meaningful column headers
- logical row structure
- accessible names where needed

Do not use div-only tables for primary data.

---

# 106. Color Independence

Never communicate meaning by color alone.

Examples:

Instead of:

```text
red = broken
```

use:

```text
BROKEN
```

and seal color.

Instead of:

```text
green = valid
```

use:

```text
VALID
```

and neutral styling.

---

# 107. Iconography

Use SVG.

Do not use emoji.

Do not use generic icon libraries purely for decoration.

Icons are allowed only when:

- they have semantic value
- they improve comprehension
- they remain visually consistent

---

# 108. Decorative Rules

Allowed functional gradients:

```text
hero vignette
ticker edge mask
skeleton shimmer
receipt tear
```

Not allowed:

```text
background gradients
gradient text
gradient cards
decorative color blobs
glows without meaning
```

---

# 109. No Pill UI

Avoid pill shapes everywhere.

Use:

```text
4px radius
```

for:

- buttons
- filters
- inputs
- tabs

Only slider thumb is circular.

---

# 110. No Generic Badges

Do not create:

```text
NEW
HOT
AI
TRUSTED
PRO
BEST
```

capsule badges.

Use plain kicker/status text instead.

---

# 111. No Fake Statistics

Never create a section such as:

```text
1,204 forecasts
98.4% verified
97 wallets
42 agents
```

unless these are real values.

Empty product data is preferable to fabricated richness.

---

# 112. No Excessive Whitespace

Avoid large empty regions that do not serve composition.

But do not fill empty areas with:

- decorative cards
- fake metrics
- random illustrations
- arbitrary text

Density must come from meaningful product information.

---

# 113. Dense Does Not Mean Crowded

The target is:

```text
dense
but legible
```

Use:

- rows
- aligned columns
- metadata
- hierarchy
- typography contrast
- section rhythm

Do not reduce spacing until touch targets or readability suffer.

---

# 114. Product Language

UI copy should be:

- plain
- factual
- precise
- technical where useful
- free of hype

Prefer:

```text
Pending anchor.
```

over:

```text
Your forecast is now on-chain!
```

Prefer:

```text
No settled questions yet.
```

over:

```text
Results are coming soon.
```

Prefer:

```text
Cassandra unavailable. Helenus answered.
```

over:

```text
AI backup activated!
```

---

# 115. Financial Framing

Called is not a financial product.

Never frame:

- probabilities as investment advice
- outcomes as trading signals
- leaderboard skill as financial prediction superiority
- forecasts as recommendations

Product UI should reinforce:

```text
This is a forecasting record.
```

not:

```text
This tells you what to buy.
```

---

# 116. Mobile Interaction

Touch interaction must remain simple.

Avoid hover-only information.

Anything necessary for understanding must be available:

- tap
- focus
- visible text
- accessible label

Pointer effects are enhancements, not requirements.

---

# 117. Hero Pointer Behavior

Crosshair cursor may be used for the interactive dot field.

Only enable pointer-specific behavior for fine pointers.

Touch devices should retain normal vertical scrolling.

---

# 118. Table Interaction

Hover is optional.

Hover must never be the only source of information.

Important hash information must remain accessible without hover.

---

# 119. Receipt Interaction

Receipt actions:

```text
Copy hash
Copy commit
Verify
View anchor
View explorer
```

Actions should be small and technical.

Do not turn the receipt into a CTA-heavy marketing panel.

---

# 120. Question Countdown

Countdown should communicate lifecycle.

Example:

```text
SEAL CLOSES IN
02d 07h 14m
```

After closing:

```text
FORECASTS REVEALED
```

After settlement:

```text
SETTLED
```

Void:

```text
VOID
```

No countdown should continue past the relevant lifecycle state.

---

# 121. Status Labels

Status labels use:

```text
IBM Plex Mono
12–13px
uppercase where appropriate
```

Examples:

```text
OPEN
CLOSED
SETTLED
VOID
SEALED
PENDING ANCHOR
ANCHORED
VALID
BROKEN
PROVISIONAL
```

---

# 122. Question Archive Row Density

Each row should be compact but readable.

Desktop:

```text
12–16px vertical row padding
```

Technical metadata:

```text
12–13px
```

Question text can use normal sans or display text depending on hierarchy.

---

# 123. Internal Page Header

Internal pages should not automatically use the giant homepage hero.

Use:

```text
kicker
title
short description
optional action
```

Example:

```text
LEDGER

The public chain.

Recompute every record in your browser.
```

This is enough.

---

# 124. Internal Page Rhythm

A typical internal page:

```text
Header
↓
Page header
↓
Primary data
↓
Supporting verification/details
↓
Related records
↓
Footer
```

Avoid artificially large hero blocks.

---

# 125. Admin Density

Admin routes may use smaller typography than public routes.

Allowed:

```text
12px metadata
14px table text
compact rows
dense controls
```

Still preserve:

- colors
- typography
- radius
- focus
- spacing logic

---

# 126. Error Philosophy

Error UI should be specific.

Good:

```text
The source could not be read at settlement time.
The question was marked VOID.
```

Bad:

```text
Something went wrong.
```

unless no better information exists.

---

# 127. Empty Philosophy

Empty states should state the actual situation.

Good:

```text
No human forecasts yet.
Humans join once wallet login is available.
```

Bad:

```text
No data.
```

when more context is known.

---

# 128. Loading Philosophy

Loading state should preserve the eventual layout.

Do not make content jump.

Examples:

- skeleton table rows
- placeholder metadata
- reserved chart area

Avoid giant spinners unless no better representation exists.

---

# 129. Explorer / External Link Language

Prefer:

```text
View on explorer
```

or:

```text
View transaction
```

rather than generic:

```text
Open
```

---

# 130. Copy Interaction

Technical values such as hashes should support copying.

After copy:

```text
Copied
```

may briefly replace:

```text
Copy
```

No large toast required unless the architecture already uses one.

---

# 131. Tooltips

Tooltips may explain:

- abbreviated hashes
- chart points
- technical terminology

But the primary meaning must remain available without tooltip.

---

# 132. Visual Hierarchy

Every page should have one dominant hierarchy.

Typical:

```text
Page title
↓
primary data
↓
secondary context
↓
technical evidence
```

Do not make every element visually loud.

---

# 133. Page-Specific Visual Priorities

## `/`

```text
forecasting arena
```

## `/questions`

```text
question archive
```

## `/q/[id]`

```text
forecast lifecycle
```

## `/leaderboard`

```text
comparative scoring
```

## `/f/[handle]`

```text
forecaster evidence
```

## `/ledger`

```text
chain verification
```

## `/receipt/[id]`

```text
forecast evidence
```

## `/agents`

```text
self-run execution
```

## `/method`

```text
system transparency
```

## `/faq`

```text
limitations and explanations
```

## `/me`

```text
personal record
```

## `/admin`

```text
operational integrity
```

---

# 134. Anti-Patterns

Never use:

```text
pill buttons
```

Use:

```text
4px radius
```

---

Never use:

```text
fake KPI cards
```

Use:

```text
honest state
```

---

Never use:

```text
decorative gradients
```

Use only functional gradients.

---

Never use:

```text
emoji
```

Use SVG where needed.

---

Never use:

```text
generic AI sparkle iconography
```

Use technical typography and evidence instead.

---

Never use:

```text
glowing blockchain neon aesthetic
```

Called is ledger-like, not cyberpunk.

---

Never use:

```text
massive marketing hero on internal routes
```

Use compact page headers.

---

Never use:

```text
cards for every row
```

Use aligned rows/tables.

---

Never use:

```text
fake data to make the interface look alive
```

Use real data or honest emptiness.

---

Never use:

```text
"verified" for pending-anchor data
```

Keep integrity states distinct.

---

# 135. Visual QA

Every implementation must be visually reviewed against:

```text
DESIGN.md
prototype.html
current product screenshots
PRD route map
```

The goal is not pixel-perfect copying of the prototype.

The goal is:

```text
same visual language
production behavior
real data
complete routes
consistent interaction
```

---

# 136. Responsive QA Matrix

Required test widths:

```text
1440
1024
768
390
```

Verify at every width:

- no body horizontal overflow
- navigation usable
- forms usable
- tables scroll internally
- chart readable
- receipt readable
- buttons >=44px
- typography does not clip
- question text does not overflow
- hashes wrap safely
- sticky behavior changes correctly

---

# 137. Accessibility QA Matrix

Verify:

```text
Keyboard navigation
Visible focus
44px target
WCAG contrast
Screen-reader labels
Table captions
Chart descriptions
Reduced motion
Form labels
Error announcements
Status announcements
```

---

# 138. Interaction QA

Verify:

```text
Seal
Reword
Countdown
Reveal
Settlement
Verify
Tamper detection
Anchor state
Copy hash
Explorer links
Filters
Calibration selection
Agent run
Receipt verification
```

Only implement actions supported by actual architecture.

---

# 139. State QA

Every major data surface must support:

```text
loading
error
empty
ready
```

Where applicable also:

```text
open
closed
settled
void
provisional
sealed
pending anchor
anchored
valid
broken
```

---

# 140. Production Checklist

Before declaring a route complete:

```text
[ ] No prototype banner
[ ] No "working name"
[ ] No fake production data
[ ] No fake metrics
[ ] No dead links
[ ] Real loading state
[ ] Real error state
[ ] Honest empty state
[ ] Responsive
[ ] Accessible
[ ] Keyboard usable
[ ] Reduced motion supported
[ ] Correct Called typography
[ ] Correct Called colors
[ ] No pill UI
[ ] No decorative gradients
[ ] Correct status semantics
[ ] Technical values use mono
[ ] Comparable data uses rows/tables
```

---

# 141. Route Completion Matrix

| Route           | Primary purpose           | Primary visual             |
| --------------- | ------------------------- | -------------------------- |
| `/`             | Arena overview            | Hero + dense sections      |
| `/questions`    | Public question archive   | Table / rows               |
| `/q/[id]`       | Forecast lifecycle        | Question + forecast slip   |
| `/leaderboard`  | Comparative ranking       | Table + calibration        |
| `/f/[handle]`   | Forecaster dossier        | Metadata + chart + history |
| `/ledger`       | Public chain verification | Ledger table               |
| `/receipt/[id]` | Evidence verification     | Paper receipt              |
| `/agents`       | BYOK execution            | Technical form + runs      |
| `/method`       | Explain mechanism         | Timeline + receipt         |
| `/faq`          | Explain limitations       | Details / summary          |
| `/me`           | Personal record           | Dense account ledger       |
| `/admin`        | Operational control       | Dense operational tables   |

---

# 142. Information Architecture Principle

Visual hierarchy follows product importance.

Priority order:

```text
WHAT
↓
WHEN
↓
FROM WHERE
↓
HOW IT IS TESTED
↓
WHO SAID IT
↓
WHAT WAS SEALED
↓
WHAT HAPPENED
↓
HOW IT WAS SCORED
↓
HOW IT CAN BE VERIFIED
```

The interface should make this order understandable without explanation.

---

# 143. Visual Evidence Principle

Whenever a claim appears, show its evidence close to the claim.

Examples:

```text
Anchor claim
→ transaction / block

Forecast claim
→ receipt / commit

Score claim
→ question set / n

Settlement claim
→ source / value / test

Verification claim
→ verify result
```

Do not separate claims from evidence unnecessarily.

---

# 144. Trust Principle

Called should feel trustworthy because it exposes evidence, not because it looks expensive.

Visual polish must come from:

- alignment
- typography
- spacing
- hierarchy
- restraint
- consistency
- technical detail
- interaction quality

Not from:

- gradients
- glows
- excessive animation
- decorative icons
- fake statistics
- oversized marketing copy

---

# 145. Density Principle

When real data exists, use the page to expose useful context.

Prefer:

```text
Question
Source
Test
Date
ID
Status
Prediction
Anchor
Score
```

over:

```text
Large empty card
"Your forecast"
```

Density is informational.

---

# 146. Alive Principle

Called should feel alive through real state changes:

- new question opened
- forecast sealed
- receipt generated
- chain head updated
- anchor completed
- question closed
- forecasts revealed
- settlement completed
- leaderboard updated
- agent run completed

Do not fake activity with random animation.

---

# 147. Premium Principle

Premium means:

```text
precise
quiet
consistent
technical
intentional
```

Not:

```text
glossy
gradient-heavy
luxury
over-decorated
```

---

# 148. Credibility Principle

Every visible value should answer:

```text
Where did this come from?
When was it created?
Can I verify it?
What exactly does it prove?
```

This should influence layout and content.

---

# 149. Final Design Rule

When choosing between:

```text
more decoration
```

and:

```text
more useful evidence
```

choose useful evidence.

When choosing between:

```text
more whitespace
```

and:

```text
more meaningful data
```

choose meaningful data.

When choosing between:

```text
more visual complexity
```

and:

```text
clearer verification
```

choose clearer verification.

When choosing between:

```text
fake populated UI
```

and:

```text
honest empty state
```

choose the honest empty state.

Called is a forecasting arena built around verifiability.

The interface should make that fact visible.
