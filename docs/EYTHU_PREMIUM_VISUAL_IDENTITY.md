# EYTHU — Premium Visual Identity Charter
**Product:** EYTHU — Personal Growth System (*Plan. Act. Achieve.*)  
**Parent:** TamZode Technology  
**Version:** 1.0 (Evolution Architecture)  
**Status:** Established & Active (Goals Module Locked)

---

## 1. Executive Summary & Design Formula

EYTHU's design identity balances calm productivity with purposeful visual energy:

$$\mathbf{EYTHU} = \mathbf{90\%\ Calm} + \mathbf{10\%\ Energy}$$

### The Core Equation
$$\text{Smart Minimal} + \text{Premium Contrast} + \text{Selective EYTHU Green} + \text{Meaningful Progress} + \text{Strong Typography} + \text{Purposeful Depth} + \text{Clear Next Action}$$

- **Simple enough to use every day** (distraction-free, rapid scanability, respectful of cognitive load)
- **Premium enough to trust** (crisp typography, refined tonal contrast, subtle depth, high craft)
- **Distinctive enough to remember** (unmistakable progress journey language, intentional energy moments)

---

## 2. Guardrails & Explicit Boundaries

### Strict Invariants
1. **Goals Module is FINAL UI LOCKED:**
   - No modifications to `GoalsPage`, `GoalDetailPage`, or `CreateGoalModal`.
   - Do not touch Goals merely to demonstrate new styles.
2. **First Adopter:**
   - The visual evolution begins with **Roadmap** and future modules.
   - Global tokens and primitives will be carefully shared without breaking locked modules.
3. **No Unrelated Code/Schema/Backend Changes:**
   - No database schema migrations or API alterations for design changes.
   - Code changes begin only when instructed for Roadmap module execution.
4. **Anti-Patterns (What EYTHU is NOT):**
   - **NOT** a neon gaming UI or dark cyberpunk dashboard.
   - **NOT** a fitness tracker clone (no phone card composition, circular workout rings, or workout-specific metaphors).
   - **NOT** an administrative ERP table or bloated SaaS dashboard.
   - **NOT** a glassmorphism or heavy glow showcase.
   - **NOT** an empty, sterile skeleton devoid of character.

---

## 3. Reference Principles Decoded

From premium dark contrast design studies, we extract the **principles**, not the literal layout:

| Reference Quality | Reference Implementation (What to Avoid) | EYTHU Translation (What to Do) |
|---|---|---|
| **Contrast** | Pitch black OLED phone cards, vivid fitness neon | Refined dark/light tonal hierarchy, near-black slate canvas with subtle surface elevation |
| **Accent Color** | Neon green across entire cards and borders | **EYTHU Green** reserved strictly for action, progress, active node, and achievement |
| **Typography** | Giant workout numbers | Confident scale hierarchy: strong page titles, prominent milestone targets, quiet metadata |
| **Visual Depth** | High-saturation glow and heavy drop shadows | Soft ambient shadows, subtle surface layering, restrained hairline borders |
| **Progress Language** | Calorie rings and workout streak dials | Meaningful journey paths: linear progress, milestone nodes, current-position beacon |
| **Tone** | Intense athletic coaching | Personal, calm, empowering human growth system (*"Your path from goal to achievement"*) |

---

## 4. Brand Color Behavior & Chromatic Rules

### The Role of EYTHU Green (`#2A7A3B` / `#34A854`)
Green is EYTHU’s sole primary chromatic brand anchor. It must **never** blanket the UI.

- **Green Represents:**
  - Active position / current journey milestone
  - Tangible progress and completion
  - Primary call-to-action (Next Action)
  - Positive momentum and streak achievements
- **Neutral Surfaces Rule:**
  - 90% of surfaces are neutral (slate, obsidian, zinc, soft porcelain).
  - Green-tinted backgrounds (`--brand-primary-soft`, `rgba(..., 0.08)`) are strictly reserved for selected states, active milestones, or progress fills.

### Color Contrast Modes

#### Light Mode (Editorial Productivity)
- **App Canvas:** Soft neutral off-white (`#F7F8FA` / `#F8FAFC`). Never blinding pure white everywhere.
- **Card Surfaces:** Crisp elevated white (`#FFFFFF`) with ultra-fine border (`#E5E7EB`).
- **Typography:** Deep near-black primary (`#111827`), slate secondary (`#475569`), muted tertiary (`#64748B`).
- **Green Accent:** Rich forest emerald (`#2A7A3B`, hover `#22653A`).

#### Dark Mode (Deep Nocturnal Focus)
- **App Canvas:** Near-black obsidian (`#0B0F17`).
- **Card Surfaces:** Deep neutral elevated slate (`#111827`, `--surface-2: #151D2B`).
- **Hairline Borders:** Deep slate border (`#253044` / `#33435C`).
- **Typography:** Crisp soft white (`#F8FAFC`), muted secondary (`#94A3B8`).
- **Green Accent:** Luminous emerald (`#34A854`, hover `#2A8A44`) with optional ultra-soft localized glow (blur $\le 8\text{px}$, opacity $\le 0.15$).

---

## 5. The "Calm Surface + Energy Moment" Architecture

Every view consists of calm, structured grounding paired with a selective focal point.

```
┌─────────────────────────────────────────────────────────────┐
│  Page Header: Calm, spacious, clear hierarchy               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [ Calm Milestone: Completed ]   ✓ Quiet green tick        │
│                 │                                           │
│   [ Calm Milestone: Completed ]   ✓ Quiet green tick        │
│                 │                                           │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     │
│  ┃  ★ ENERGY MOMENT: Current Active Milestone         ┃     │
│  ┃  • Luminous position node                          ┃     │
│  ┃  • Clear title + Progress percentage               ┃     │
│  ┃  • Next Action CTA: "Create authentication API"    ┃     │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     │
│                 │                                           │
│   [ Calm Milestone: Upcoming ]    ○ Neutral outline         │
│                 │                                           │
│   [ Calm Milestone: Outcome ]     ○ Muted horizon target    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Approved Energy Moments
1. The **current milestone** on a user's roadmap.
2. A **progress threshold** being crossed (e.g. stage completed).
3. The **primary next action** button.
4. An **active focus session** or timer.
5. An **achievement milestone** unlocked.

Everything else remains calm, legible, and unobtrusive.

---

## 6. Signature Progress & Journey Language

Rather than generic admin progress bars, EYTHU communicates a **living journey**:

1. **Journey Path (Spine):** A continuous vertical or horizontal connective filament connecting past steps to future goals.
2. **Completed Node:** Filled with quiet green completion mark (`✓`) indicating earned ground.
3. **Current Node (The Beacon):** Distinctive, prominent indicator (e.g., dual-ring emerald beacon, subtle pulse on focus) clearly communicating *"You are here"*.
4. **Upcoming Node:** Clean geometric ring (`○`) in low-contrast neutral tone, representing future territory without visual noise.
5. **Destination / Target:** Distinct achievement glyph or end-state anchor.

**Instant Readability Guarantee:**
A user should glance at an EYTHU roadmap for 2 seconds and immediately grasp:
- Where I am
- What I finished
- What is next
- How far is left

---

## 7. Subtle Depth & Visual Craft Rules

### Layering & Shadows
- Use tonal contrast over heavy shadows.
- Ambient elevation: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04)` in light mode; subtle border contrast in dark mode (`border: 1px solid rgba(255, 255, 255, 0.08)`).
- Never use heavy drop shadows, colored neon outer glows, or opaque card borders.

### Gradient Rules
- **Permitted (Rare & Purposeful):**
  - Linear progress bar fill (e.g. from `#2A7A3B` to `#34A854`).
  - Active node beacon aura (micro radial fade).
  - Subtle tonal canvas gradient (top-to-bottom $1\%$ tint falloff).
- **Prohibited:**
  - Gradient buttons everywhere.
  - Multi-color rainbow or high-saturation gradient headers.
  - Gradient borders on generic cards.

---

## 8. Typography & Personal Voice

### Hierarchy & Scale
- **Display / Page Title:** 24px–28px, Semibold, tight tracking (`-0.02em`).
- **Milestone / Active Entity:** 18px–20px, Medium–Semibold.
- **Body / Descriptive:** 14px–15px, Regular, relaxed line-height (`1.5–1.6`).
- **Metadata / Badges / Labels:** 11px–12px, Medium/Uppercase, tracking (`+0.04em`), muted slate.

### Human Voice Matrix
| System / Corporate Term | EYTHU Personal Term |
|---|---|
| Entity / Record / Workflow | Your roadmap / Your journey |
| Pending State | Up next / Next step |
| Execution Unit | Action / Milestone |
| Process Status: In Progress | Current milestone / Active focus |
| Completion Summary | You achieved / Completed |
| Workflow Trigger | Ready when you are |

---

## 9. Design Review Checklist for Future Modules

Before approving any new screen or component in EYTHU:

- [ ] **Clear Purpose:** Does the screen have an unmistakable single primary objective?
- [ ] **Next Action:** Is the immediate next step obvious within 3 seconds?
- [ ] **Progress Clarity:** Can progress be understood without reading tiny tabular numbers?
- [ ] **Selective Green:** Is EYTHU green restricted to $\le 10\%$ of the visual weight?
- [ ] **Container Discipline:** Are there unnecessary nested boxes, double borders, or card-in-card clutter?
- [ ] **Personal Feel:** Does the copy say *"Your path"* rather than *"Roadmap items table"*?
- [ ] **Dual-Theme Parity:** Does dark mode feel equally premium, confident, and readable as light mode?
- [ ] **Single Energy Moment:** Does this screen have one memorable focal point rather than five competing buttons?
- [ ] **Zero Mobile Porting:** Is the layout naturally composed for desktop/laptop screens with responsive fluidity down to mobile?
- [ ] **Locked Modules Respected:** Are Goals and its subcomponents completely untouched?
