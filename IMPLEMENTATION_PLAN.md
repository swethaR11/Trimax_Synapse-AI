# Synapse AI — Arc Night 2026 Implementation Plan

> *"Translate the abstract. Personalize the path. Adaptive learning platform."*

## Overview

**Synapse AI** is a full-stack EduTech web application that lets students upload any dense textbook content, enter their personal hobby/passion, and receive a live split-screen experience: raw academic definitions on the left, a personalized 1:1 analogy on the right — complete with adaptive UI themes and active-recall quizzes baked into the hobby's narrative world.

---

## User Review Required

> **No Antigravity SDK required.** The backend uses **`google-genai` Python SDK (v2.8.0)** — already available — to orchestrate the Scholar → Stylist → Critic multi-agent pipeline. The architecture is identical to what the slides/demo will show.

> **API Key UI (In-App):** There will be **no hardcoded `.env` key**. Instead, the Landing screen features a dedicated **API Key onboarding step** — a sleek modal/input where the user pastes their `GEMINI_API_KEY` once per session. The key is stored in `localStorage` and sent as a header (`X-Gemini-Key`) with every request. The backend reads the key from the request header, never from disk. This makes the app instantly runnable by any judge without any server config.

> **Python 3.14 Compatibility:** You're running Python 3.14.2, which is bleeding-edge. Some packages (PyPDF2, pdfplumber) may have C extension issues. We will use `pdfplumber` first and fall back to `pypdf` (the actively maintained fork of PyPDF2) if needed.

---

## Open Questions

> **Deployment target?** The plan assumes localhost for the hackathon demo (recommended). Should we also prepare a Vercel (frontend) + Railway/Render (backend) deployment config for bonus points?

---

## Proposed Changes

### Project Root: `d:/Anti_Gravity_Projects/ARCNIGHT`

```
ARCNIGHT/
├── frontend/          ← Next.js 15 + TypeScript + Tailwind + Framer Motion
├── backend/           ← FastAPI + Pydantic v2 + google-genai
├── .gitignore
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

### Component 1: Backend — FastAPI + Multi-Agent AI

#### `backend/` — Python FastAPI service

**Tech stack:** Python 3.14, FastAPI, Uvicorn, Pydantic v2, google-genai 2.8.0, pdfplumber/pypdf

**Folder structure:**
```
backend/
├── main.py              ← FastAPI app, CORS config, route mounting
├── routes/
│   ├── upload.py        ← POST /api/upload-pdf
│   └── learn.py         ← POST /api/learn (SSE streaming endpoint)
├── agents/
│   ├── scholar.py       ← Agent A: extracts rigorous academic definitions
│   ├── stylist.py       ← Agent B: builds analogy + active recall question
│   └── critic.py        ← Agent C: validates output against Pydantic schema
├── schemas/
│   └── synapse.py       ← SynapseOutputSchema (Pydantic v2 model)
├── utils/
│   └── pdf_parser.py    ← PDF/text extraction utility
└── requirements.txt
```

**Streaming Support:** All AI responses are streamed using Gemini's `stream=True` mode. The FastAPI route uses `StreamingResponse` with `text/event-stream` (SSE). Each agent streams its chunk as soon as tokens arrive — the frontend renders them word-by-word in real time.

**Key contracts:**
- `POST /api/upload-pdf` → accepts multipart PDF/TXT → returns `{ "text": "...", "filename": "..." }`
- `POST /api/learn` → accepts `{ topic, content, interest, level, chat_history[] }` + `X-Gemini-Key` header → streams `SynapseOutputSchema` fields as SSE events

**SynapseOutputSchema (Pydantic v2):**
```python
class SynapseOutputSchema(BaseModel):
    themeId: str                  # One of 48 theme IDs — chosen by Theme Selector Agent
    academicContent: str          # Rigorous definition with exact exam terminology
    personalizedTranslation: str  # 1:1 hobby analogy narrative
    aiPersonaFeedback: str        # Conversational encouragement tuned to hobby
    nextCheckinQuestion: str      # Active recall question inside hobby's world
```

**Multi-Agent Flow:**
```
User Input (interest text typed by user)
    │
    ▼
[Theme Selector Agent] ── Gemini 2.5 Flash ──► themeId  (picks 1 of 48 themes)
    │                      (reads free-text interest, returns best-fit theme ID)
    │                      (sent as FIRST SSE event → UI morphs before content loads)
    ▼
[Scholar Agent] ─── Gemini 2.5 Flash ──► academicContent (strict, level-adjusted)
    │
    ▼
[Stylist Agent] ─── Gemini 2.5 Flash ──► personalizedTranslation + nextCheckinQuestion
    │                (fed Scholar output + user interest string)
    ▼
[Critic Agent]  ─── Gemini 2.5 Flash ──► validates JSON shape + themeId is in valid catalog
    │
    ▼
FastAPI SSE Stream → Frontend applies themeId instantly
```

---

### Component 2: Frontend — Next.js Adaptive Shell

#### `frontend/` — Next.js 15 + TypeScript + Tailwind CSS + Framer Motion

**Folder structure:**
```
frontend/
├── app/
│   ├── layout.tsx                    ← Root layout, Google Fonts, SEO metadata
│   ├── page.tsx                      ← State machine: Landing → Configure → Workspace
│   └── globals.css                   ← Tailwind directives + CSS custom property tokens
├── components/
│   ├── Landing/
│   │   ├── LandingScreen.tsx            ← Hero + two-card entry (Topic | Paste)
│   │   ├── ApiKeyModal.tsx              ← Onboarding modal: key stored in localStorage
│   │   └── OnboardingTooltips.tsx       ← First-time user guided tooltips overlay
│   ├── Workspace/
│   │   ├── WorkspaceLayout.tsx          ← Split-panel orchestrator + resize handle
│   │   ├── AcademicPanel.tsx            ← Left: raw textbook definitions (word-by-word stream)
│   │   ├── AnalogPanel.tsx              ← Right: hobby analogy chat + message bubbles
│   │   ├── SkeletonPanel.tsx            ← YouTube-style themed shimmer skeleton
│   │   ├── StreamingText.tsx            ← Token-by-token renderer with blinking cursor
│   │   ├── RecallWidget.tsx             ← Active recall question + answer input + result
│   │   ├── AgentPipelineBar.tsx         ← Live 4-step agent progress indicator
│   │   ├── ShareCardModal.tsx           ← Generates shareable OG-image style card
│   │   └── SessionHistoryDrawer.tsx     ← Slide-in past session history panel
│   ├── Input/
│   │   ├── TopicInput.tsx               ← Auto-suggest topic input
│   │   ├── PasteInput.tsx               ← Paste lecture notes textarea
│   │   ├── FileUpload.tsx               ← Drag-and-drop PDF uploader with preview
│   │   ├── InterestInput.tsx            ← Hobby text field with live theme preview badge
│   │   └── LevelSelector.tsx            ← Beginner / Intermediate / Advanced pill buttons
│   └── UI/
│       ├── ThemeProvider.tsx            ← Theme context + CSS variable injection
│       ├── AmbientBackground.tsx        ← Animated per-theme particle / gradient background
│       ├── ThemeBadge.tsx               ← Floating badge showing AI-picked theme + reasoning
│       ├── ConfettiCelebration.tsx      ← Confetti burst on correct recall answer
│       ├── XPProgressRing.tsx           ← Circular XP ring tracks concepts mastered
│       ├── CopyButton.tsx               ← One-click copy for academic definitions
│       ├── FontSizeControl.tsx          ← A⁻ / A⁺ text scaling control
│       ├── ErrorToast.tsx               ← Graceful animated error display
│       └── KeyboardShortcuts.tsx        ← ⌘K shortcut palette modal
├── lib/
│   ├── themeEngine.ts               ← THEME_CATALOG (148 themes) + applyTheme() CSS injector
│   ├── api.ts                       ← SSE stream reader + fetch wrappers
│   ├── streaming.ts                 ← ReadableStream parser: SSE chunks → token strings
│   ├── sessionStorage.ts            ← Save/load sessions from localStorage
│   └── types.ts                     ← TypeScript interfaces (SynapseOutput, ChatMessage, Theme)
├── hooks/
│   ├── useSynapse.ts                ← Main state hook (input, output, stream, chat history)
│   ├── useTheme.ts                  ← Theme state + applyTheme side effect
│   └── useSessionHistory.ts         ← Load / persist / delete session history
├── public/
│   └── favicon.ico
├── tailwind.config.ts             ← CSS variable-driven Tailwind theme
├── next.config.ts
├── package.json
└── .env.local                     ← NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### UI Feature Specifications

---

#### 🖥️ Feature 1 — Hero Landing Screen

**Purpose:** The very first impression. Must stop someone mid-scroll and make them immediately understand what Synapse AI does.

**Layout:**
- Full `100vh` viewport. Overflow hidden. Position relative.
- Background: animated CSS gradient mesh — 4 soft radial gradients at corners, each moving on a slow 8-second keyframe loop, blending into the theme's `--bg` color. Default is the `slate-tech` theme.
- A very subtle `noise.svg` texture overlay at 3% opacity on top of the gradient for depth.

**Header Bar (fixed top, 64px height):**
- Left: `Synapse AI` wordmark logo in heading font, with a small animated neural-node SVG icon (3 circles connected by lines, nodes pulse on a 2s loop)
- Right: `🔑 API Key` badge button (opens ApiKeyModal) + a small `?` help icon

**Hero Content (vertically centered):**
- Eyebrow label: `✦ Arc Night 2026 · EduTech Track` in small caps, accent color, letter-spacing 0.2em
- Main heading: `"Translate the Abstract."` (line break) `"Personalize the Path."` — 72px on desktop, heading font, white or dark depending on theme. Each word animates in with a staggered `translateY(20px) → 0 + opacity 0→1`, 80ms between each word.
- Sub-heading: `"Upload any textbook chapter. Type your passion. Watch the AI build your personal mental language for it."` — 18px, body font, 70% opacity, max-width 580px centered.
- Two CTA Cards (side by side, 380px wide each, 16px gap):

  **Card A — "💬 Explore a Topic"**
  - Background: `rgba(var(--accent-rgb), 0.08)` glass card with `backdrop-filter: blur(12px)`
  - Border: `1px solid rgba(var(--accent-rgb), 0.25)` with `border-radius: 20px`
  - Icon: large 48px topic icon in accent color
  - Title: `Explore a Topic` in 22px heading font
  - Description: `"Type any concept — JVM, HTTP, recursion, anything"` — 14px body font, muted
  - Input: a styled text field pre-focused, placeholder: `"e.g. JVM Garbage Collection..."`
  - Hover state: `transform: translateY(-6px)`, `box-shadow: 0 20px 60px rgba(var(--accent-rgb), 0.2)`, border opacity increases to 0.6, transition 200ms ease-out

  **Card B — "📄 Paste / Upload"**
  - Same glass style as Card A
  - Drag-and-drop zone: dashed border, `border-radius: 12px`, inner label `"Drop PDF here or click to browse"`
  - On drag-over: border becomes solid accent, background tints to `rgba(accent, 0.12)`, scale(1.02)
  - A small "Or paste text below →" toggle link below the dropzone

- **Interest + Level Row** (appears below the cards, slides in 400ms after page load):
  - Interest input: `"What are you passionate about?"` — full-width pill input, 52px height, body font
  - Level pills: `[ Beginner ] [ Intermediate ] [ Advanced ]` — 3 pill buttons, selected one fills with accent bg
  - `Generate →` CTA button: 56px height, full accent color bg, heading font, `border-radius: 14px`

**Scrolling Ticker (below everything):**
- Infinite horizontal scroll marquee at 30px/s showing: `fashion · cricket · anime · coffee · chess · jazz · gaming · yoga · k-drama · coding · bollywood · ...`
- Text in body font, 14px, 50% opacity, accent color, monospace-style dots between items
- Pauses on hover

---

#### 🎨 Feature 2 — Live Theme Preview Badge

**Purpose:** Give the user instant AI feedback as they type their hobby — the UI reacts BEFORE they even click Generate, creating a "wow" moment.

**Trigger:** User types into the Interest input field. A `useDebounce(interest, 800)` hook fires after 800ms of no typing.

**Badge Component (`ThemeBadge.tsx`):**
- Position: `fixed`, bottom-right of the interest input field, `z-index: 50`
- Size: `auto width`, `32px height`, `border-radius: 999px` (pill shape)
- Initial state (typing, debounce pending):
  - Content: `🎨  Analyzing...` with a 16px CSS spinner (3 dots fading in sequence)
  - Background: `rgba(255,255,255,0.1)`, border `1px solid rgba(255,255,255,0.2)`
  - Entrance: slides in from right with `opacity: 0 → 1` + `translateX(8px) → 0` over 200ms

- Resolved state (theme returned from `/api/preview-theme`):
  - Content: `✨  [themeId display name]` (e.g. `✨  High Fashion`)
  - Background shifts to `var(--accent)` at 20% opacity, border becomes full accent color
  - Text color: `var(--accent)`
  - Transition: 300ms smooth background + color change
  - A tiny swatch circle (10px) shows the theme's bg color

- **Background Preview:** Simultaneously with badge resolve, the page's `--bg`, `--accent` CSS variables transition to the predicted theme's values at 50% opacity (blended with original). This gives a ghost-preview effect. On Generate click, they snap to 100%.

- **Tooltip on badge click:**
  - Small popover card appears above the badge
  - Content: `"Based on '[interest text]', Synapse detected: [Theme Name]. This theme uses [Font] typography and [color palette description]."`
  - Has a `"Change theme manually →"` link (future feature stub)
  - Dismisses on outside click or `Esc`

---

#### ⚙️ Feature 3 — Agent Pipeline Status Bar

**Purpose:** Make the multi-agent architecture *visible*. Judges and users should physically see the 4 agents firing in sequence — this is the single biggest proof of AI depth.

**Layout:**
- Fixed bar, `48px` height, full width, pinned `below` the top header (top: 64px)
- Background: `var(--card-bg)` with `border-bottom: 1px solid var(--card-border)`
- Only visible during generation (slides down from -48px on generate click, slides back up when done)
- Framer Motion: `initial={{ y: -48, opacity: 0 }} animate={{ y: 0, opacity: 1 }}`, spring physics

**4 Steps (evenly spaced horizontally):**
```
  ① Theme Selector   →   ② Scholar Agent   →   ③ Stylist Agent   →   ④ Critic Agent
```

Each step node:
- **Idle state:** Circle outline (20px), dim color (40% opacity), label below in 11px muted text
- **Active state:**
  - Circle fills with accent color
  - Inner dot pulses: `scale(0.6) → scale(1.0)` at 600ms interval, with `box-shadow: 0 0 0 6px rgba(accent, 0.3)` ripple
  - Label brightens to 100% opacity, font-weight 600
  - Small spinning arc around the circle (CSS border animation, 800ms linear)
  - A subtle elapsed time counter appears below: `1.2s...` incrementing every 100ms
- **Done state:**
  - Circle fills solid with accent, white checkmark `✓` inside
  - Label gets strikethrough? No — label stays, adds `(done)` in tiny text below
  - Entrance of checkmark: bouncy scale `0 → 1.2 → 1.0` over 300ms

**Connector arrows `→`:**
- Default: dim, dashed line
- When the step to the left completes: line animates to solid, accent color, left-to-right fill animation over 400ms

**SSE Integration:**
- Backend emits: `event: agent_status\ndata: {"agent": "theme_selector", "status": "start"}\n\n`
- Before each agent: `status: "start"` → triggers active state
- After each agent: `status: "done"` → triggers done state
- Frontend `streaming.ts` parses these events separately from content chunks

---

#### 🌌 Feature 4 — Ambient Animated Background

**Purpose:** Make every theme feel *alive*. The background shouldn't be a static color — it should breathe and move in ways unique to the theme's world.

**Architecture:**
- Single `<AmbientBackground />` component renders a full-screen `<canvas>` element
- Position: `fixed`, `top: 0`, `left: 0`, `width: 100vw`, `height: 100vh`, `z-index: 0`, `pointer-events: none`
- All UI content sits above it at `z-index: 1+`
- Global opacity: `0.12` — never distracting, always atmospheric
- When `themeId` changes: canvas fades out (300ms), re-initializes with new particles, fades back in

**Per-Theme Implementations:**

| Theme | Particle Type | Count | Speed | Color | Special FX |
|---|---|---|---|---|---|
| `high-fashion` | Soft oval petals, slow gentle drift | 25 | 0.3px/frame | `#e8c4b8` blush | Petals rotate slowly ±15° as they drift |
| `neon-gaming` | Sharp hexagons, fast diagonal | 40 | 1.2px/frame | `#00ff9f` | Scanline overlay: 2px horizontal lines at 8px spacing, 5% opacity |
| `space-cosmos` | Tiny 2px star dots, parallax layers | 150 | 0.1–0.4px/frame | White, vary opacity | Two parallax layers at 0.3x and 0.6x scroll speed |
| `forest-nature` | Leaf silhouettes (SVG path), downward drift with sway | 20 | 0.5px/frame | `#4caf50` at 30% | Leaves sway ±10px horizontally on sine wave |
| `jazz-blues` | Wispy fog circles, large blobs | 8 | 0.15px/frame | `#e8a830` at 10% | Blobs slowly grow and shrink (scale 0.8→1.2 on 6s loop) |
| `lofi-chill` | Film grain noise texture | Static | — | White | Canvas noise redrawn every 3 frames for authentic film grain |
| `anime-manga` | Speed lines from center, radial burst | 30 | 0.8px/frame | `#ff6b9d` | Lines animate outward from center, fade at edges |
| `synthwave-80s` | Grid perspective lines | Grid | Scroll | `#ff2079` + `#7b2fff` | Animated perspective grid scrolling toward viewer (RetroWave grid) |
| `ocean-marine` | Bubble circles, rising | 30 | 0.4px/frame | `#00c9ff` at 40% | Wobble horizontally ±5px as they rise |
| `bollywood` | Confetti-style small rectangles, falling | 35 | 0.6px/frame | Gold + orange mix | Rotate as they fall |
| All others | Soft radial gradient pulse | — | 4s loop | Theme accent at 8% | Large radial gradient expands/contracts (radius 300→500px) |

**Canvas Render Loop (`requestAnimationFrame`):**
```
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  particles.forEach(p => { p.update(); p.draw(ctx) })
  animFrameId = requestAnimationFrame(render)
}
```
- On theme change: `cancelAnimationFrame(animFrameId)`, reinitialize particle array, restart loop
- On window resize: canvas resizes, particles repositioned proportionally

---

#### ↔️ Feature 5 — Split Panel Workspace with Resize Handle

**Purpose:** The core UI — the academic/analogy duality is the entire product. The layout must feel premium, functional, and instantly scannable.

**Container:**
- `display: flex`, `flex-direction: row`, `height: calc(100vh - 112px)` (below header + pipeline bar)
- Initial state: both panels `width: 50%`

**Resize Handle (center divider):**
- Width: `8px`, full height, `cursor: col-resize`
- Visual: `2px` centered line in `var(--card-border)` color
- On hover: line brightens to accent, expands to `3px`
- On drag start: a thin accent-colored line at full opacity
- Drag logic: `mousedown` on handle → track `mousemove` → update left panel width as `%` of container → `mouseup` to release
- Min/Max: left panel 28% min, 72% max
- Double-click handle: snaps back to 50/50 with 300ms spring animation

**Panel Anatomy (both panels share this structure):**

```
┌─────────────────────────────────────────────────┐
│  PANEL HEADER (48px)                            │
│  [Icon] [Title]              [Actions row]      │
├─────────────────────────────────────────────────┤
│                                                 │
│  PANEL CONTENT (scrollable, flex-1)             │
│  - Skeleton OR streaming text                   │
│  - Padding: 24px                               │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Left Panel Header:**
- Icon: `📚` (or themed book emoji per theme)
- Title: `Academic Definition` in 13px uppercase, letter-spacing 0.12em, muted color
- Actions (right-aligned, gap 8px):
  - `A⁻` button: reduces `--panel-font-size` CSS var by 1px (min 13px), tooltip "Decrease font size"
  - `A⁺` button: increases by 1px (max 20px), tooltip "Increase font size"
  - `📋 Copy` button: copies `academicContent` text to clipboard, icon briefly becomes `✓` for 1.5s
  - `⋯` overflow menu: "Download as PDF", "Report error"

**Right Panel Header:**
- Icon: theme-specific emoji (per theme catalog — each theme has an assigned emoji)
- Title: `[Theme Name] Analogy` — e.g. `✂️ High Fashion Analogy`
- Actions:
  - `🔗 Share` button: opens ShareCardModal
  - `🗂 History` button: opens SessionHistoryDrawer
  - `⋯` overflow: "Clear conversation", "Export chat"

**Panel Opening Animation (on first workspace load):**
- Both panels start at `width: 0, opacity: 0`
- Left panel animates to 50% width over 400ms, `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot bounce)
- Right panel starts 100ms later, same animation
- Resize handle fades in after both panels are open (delay 500ms)

---

#### 💬 Feature 6 — Analogy Chat UI (Right Panel)

**Purpose:** The right panel isn't just a text dump — it's an immersive, back-and-forth tutoring conversation that feels like chatting with a brilliant friend who speaks your language.

**Message Types:**

**AI Teaching Message (the analogy):**
- Layout: left-aligned, max-width 90%, `padding: 16px 20px`, `border-radius: 4px 20px 20px 20px`
- Background: `var(--card-bg)`, border: `1px solid var(--card-border)`
- Avatar: 32px circle, left of bubble, contains theme emoji (e.g. `✂️` for fashion, `🏏` for cricket, `🎮` for gaming)
- Text: streaming in word-by-word via `StreamingText` component, body font, 15px, line-height 1.7
- A subtle `▋` cursor at the tail while streaming
- Bottom metadata row: `Stylist Agent · 2.3s` in 11px muted text

**User Answer Message:**
- Right-aligned, max-width 80%
- Background: `var(--accent)` at 20% opacity, border: `1px solid var(--accent)` at 40% opacity
- `border-radius: 20px 4px 20px 20px`
- No avatar — clean right-aligned pill
- Text: user's typed answer, body font, 15px

**Recall Result Message (AI feedback):**
- Same as AI Teaching Message styling
- But prepended with a colored status pill:
  - ✅ Correct: `green` pill → `"Spot on! +10 XP"`
  - 🟡 Partial: `amber` pill → `"Close! Here's what you missed..."`
  - ❌ Wrong: `red` pill → `"Not quite — here's the hint:"`

**Message Entrance Animation:**
- `initial: { opacity: 0, y: 12 }` → `animate: { opacity: 1, y: 0 }`, duration 250ms, ease-out
- Stagger: if multiple messages load at once, 80ms between each

**Auto-scroll behavior:**
- `useEffect` watches message array length
- On new message: `scrollIntoView({ behavior: 'smooth', block: 'end' })` on the last message
- If user has manually scrolled up: auto-scroll is paused. A `↓ New message` floating pill appears at the bottom — click to resume.

**Empty state (before generation):**
- Center-aligned illustration: theme emoji large (80px), text `"Generate your first explanation to start the conversation"`
- Subtle pulse animation on the emoji

---

#### 🏆 Feature 7 — Active Recall Widget + XP System

**Purpose:** Learning without testing is reading without understanding. The recall widget forces active engagement and gamifies the experience.

**Widget Layout (`RecallWidget.tsx`):**
- Anchored to the bottom of the right panel
- Initial state: hidden below panel (translateY(100%))
- Appears: 600ms after analogy content finishes streaming (slide up: translateY(0), spring animation)
- Height: auto, min 180px

**Question Card:**
```
┌─────────────────────────────────────────────────┐
│  ⚡ KNOWLEDGE CHECK                [Theme emoji] │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Question text — rendered in hobby language]   │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Type your answer here...                 │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                              [ Submit Answer → ] │
└─────────────────────────────────────────────────┘
```

- Header: `⚡ KNOWLEDGE CHECK` label, 11px caps, accent color. The lightning bolt icon flashes every 2s.
- Question text: 15px body font, line-height 1.6, rendered inside the hobby's narrative
- Textarea: auto-expands as user types (min 2 rows, max 6 rows). On focus: glowing accent border `box-shadow: 0 0 0 3px rgba(accent, 0.25)`
- Submit button: `border-radius: 12px`, accent background, 14px heading font

**Result States:**

✅ **Correct:**
- Widget border flashes green: `box-shadow: 0 0 0 4px #22c55e` pulse animation
- `canvas-confetti` fires: 60 particles in theme accent colors, gravity 1.2, spread 80°, origin `{ x: 0.7, y: 0.9 }`
- `+10 XP` toast: appears bottom-right, `font-size: 20px`, bold, accent color, flies upward 50px over 1s then fades
- Correct answer feedback from Stylist Agent streams in as a new chat message above
- Widget collapses: slides down, replaced by `"Ask another question →"` link

🟡 **Partially Correct:**
- Widget border glows amber, no confetti
- `+5 XP` toast (smaller)
- Feedback message streams in explaining what was partially right
- Textarea remains visible for retry

❌ **Incorrect:**
- Widget shakes: `transform: translateX(-8px) → translateX(8px) → 0` × 3, 80ms each, `cubic-bezier(0.36, 0.07, 0.19, 0.97)`
- Border flashes red briefly
- `"Not quite!"` feedback message streams in with a hint
- A `"See hint →"` button reveals the key concept in the analogy language
- No XP awarded; user can retry

**XP Progress Ring (`XPProgressRing.tsx`):**
- Fixed in the workspace header, right side — 48px × 48px SVG circle
- Circle stroke fills clockwise as XP increases (0 → 100 XP = full ring)
- Center text: current XP number in 12px heading font
- On XP gain: ring stroke animates to new fill position over 800ms `ease-out`
- On level-up (every 100 XP): ring flashes accent, briefly scales up 1.15×, resets stroke to 0

**XP Persistence:**
- Saved to `localStorage` under `synapse_xp` key
- Session XP is separate from cumulative XP
- Shown in session history cards

---

#### 🗂️ Feature 8 — Session History Drawer

**Purpose:** Let users revisit past sessions, continue learning, and see their progress over time.

**Trigger:** `🗂 History` button in the right panel header, OR `Ctrl+H` keyboard shortcut.

**Drawer Layout:**
- Slides in from the LEFT edge of the workspace (not full screen — overlays left panel only)
- Width: `320px`, `height: 100%`, `z-index: 20`
- Background: `var(--card-bg)`, `box-shadow: 8px 0 32px rgba(0,0,0,0.3)`, `border-right: 1px solid var(--card-border)`
- Framer Motion: `initial={{ x: -320 }} animate={{ x: 0 }}`, spring `stiffness: 400, damping: 40`
- Close: click backdrop overlay (semi-transparent) or press `Esc`

**Drawer Header (56px):**
- Title: `📚 Study History` in 16px heading font
- `Clear All` link right-aligned, red text, requires confirm dialog
- Close `✕` button

**Session Cards (scrollable list):**

Each session card (80px height, 12px vertical gap):
```
┌────────────────────────────────────────────┐
│  [Theme swatch 24px] [Topic name, 15px bold] │
│  [Interest tag pill] [Date, right-aligned]  │
│  [⚡ XP earned]  [Level badge]              │
└────────────────────────────────────────────┘
```
- Theme swatch: small colored circle in that session's theme accent color
- Topic name: truncated at 24 chars with `...` if longer
- Interest tag: small pill `"e.g. high fashion"` in theme accent bg
- XP badge: `⚡ 40 XP` in yellow
- Level badge: `Beginner` / `Intermediate` / `Advanced` in appropriately colored pill
- Hover: card lifts `translateY(-2px)`, accent border appears
- Click: drawer closes with slide animation, workspace reloads that session's content

**Empty State:**
- Centered illustration: `📭` emoji, 48px
- Text: `"No study sessions yet. Generate your first lesson to see it here."`

**Delete:**
- On card hover: a `🗑` icon appears right-aligned
- Click delete → card slides out left with `opacity: 0, x: -20` over 200ms, list collapses

**Storage:**
- `localStorage` key: `synapse_sessions` — array of max 20 session objects
- Each object: `{ id, topic, interest, level, themeId, xp, date, academicContent, chatHistory }`
- Auto-pruned: when 21st session added, oldest is removed

---

#### 📤 Feature 9 — Share Card Generator

**Purpose:** One-click proof-of-concept for the LinkedIn bonus post — and a genuinely shareable artefact.

**Trigger:** `🔗 Share` button in right panel header, OR `Ctrl+S`.

**Modal:**
- Centered overlay modal, `480px × 640px`, `border-radius: 24px`
- `backdrop-filter: blur(20px)` on the overlay background
- Framer Motion entrance: scale `0.9 → 1.0` + `opacity: 0 → 1`, 250ms ease-out

**Share Card Preview (rendered on HTML Canvas, 1200×630px — OG image dimensions):**

```
┌──────────────────────────────────────────────────────────┐
│  [Theme BG + Ambient gradient]                           │
│                                                          │
│  ⬡ SYNAPSE AI                           [theme badge]   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  📚 JVM Garbage Collection                       │   │
│  │  × High Fashion                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  "Picture yourself backstage at Milan Fashion Week.      │
│   The JVM's heap is the main stockroom — bursting with   │
│   garments collected all season..."                      │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  ⚡ Intermediate Level  ·  arcnight2026.synapse.ai       │
└──────────────────────────────────────────────────────────┘
```

**Canvas rendering:**
- `const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630`
- Fill background with theme `--bg` color
- Draw ambient gradient circles (2–3 large radial gradients in accent color at low opacity)
- Draw `SYNAPSE AI` wordmark using `ctx.font = '28px [headingFont]'`
- Draw topic + interest block as a rounded-rect card
- Draw 2-sentence analogy excerpt, word-wrapped at 900px width
- Draw footer line with level badge and URL

**Actions in Modal:**
- `📋 Copy Image` → `canvas.toBlob() → navigator.clipboard.write([new ClipboardItem(...)])` → button becomes `✓ Copied!` for 2s
- `⬇ Download PNG` → `canvas.toDataURL('image/png')` → trigger anchor download
- `✕ Close`

---

#### ⌨️ Feature 10 — Keyboard Shortcut Palette

**Purpose:** Power-user experience. Makes the app feel like a professional tool, not a student project.

**Trigger:** `Ctrl+K` / `⌘K` anywhere on the page (global `keydown` listener).

**Palette UI:**
- Full-screen backdrop: `rgba(0,0,0,0.6)`, `backdrop-filter: blur(4px)`
- Centered panel: `560px × auto`, `border-radius: 16px`, `border: 1px solid var(--card-border)`
- Background: `var(--card-bg)` with slight transparency
- Framer Motion: `initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}`, 150ms ease-out

**Search input (top of palette):**
- `56px` height, `border-radius: 12px` (top corners only), placeholder: `"Type a command..."`
- Real-time filters the command list below

**Command List:**
Each command item (48px height):
```
[Icon]  [Command Label]               [Shortcut badge]
```

| Icon | Command | Shortcut |
|---|---|---|
| ✨ | Generate Explanation | `Ctrl+Enter` |
| 📋 | Copy Academic Definition | `Ctrl+C` |
| 🔗 | Share Card | `Ctrl+S` |
| 🗂 | Open Session History | `Ctrl+H` |
| 🔑 | Change API Key | `Ctrl+Shift+K` |
| 🎨 | Re-pick Theme (AI) | `Ctrl+T` |
| ↩ | Go Back to Landing | `Ctrl+Backspace` |

- Arrow keys navigate the list, `Enter` executes, `Esc` closes
- Selected item: `background: rgba(var(--accent-rgb), 0.15)`, accent left border `2px`
- Hover: same as selected

---

#### ✨ Feature 11 — Micro-Animations System

**Purpose:** Every interaction should feel *tactile* and *responsive*. The difference between a student project and a shipped product is the micro-animations.

**Complete Animation Inventory:**

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| CTA Cards (Landing) | Hover | `translateY(-6px)` + shadow bloom | 200ms | `ease-out` |
| CTA Cards (Landing) | Click/Press | `scale(0.98)` | 100ms | `ease-in` |
| Generate Button | Hover | `scale(1.02)` + glow pulse | 150ms | `ease-out` |
| Generate Button | Click | `scale(0.96)` → ripple wave | 100ms | `ease-in` |
| Level Pills | Click | Scale bounce `0.9 → 1.05 → 1.0` + fill transition | 250ms | spring |
| Interest Input | Focus | Border glow: `box-shadow 0 0 0 3px accent/30%` | 200ms | `ease` |
| Interest Input | Type | Theme badge slides in from right | 200ms | spring |
| Workspace Panels | Mount | `translateY(20px) opacity:0 → 0 opacity:1`, staggered | 400ms | `ease-out` |
| Skeleton Loaders | Mount | Shimmer sweep left→right | 1.5s | `linear` infinite |
| Skeleton → Content | Stream starts | `opacity: 0 → 1` cross-fade | 300ms | `ease` |
| Streaming Text cursor `▋` | Always | Blink `opacity: 1 → 0 → 1` | 530ms | step |
| Streaming Text cursor `▋` | Stream ends | `opacity: 1 → 0` fade | 500ms | `ease` |
| Agent Pipeline Steps | Active | Outer ring ripple, inner dot scale pulse | 600ms | `ease-in-out` infinite |
| Agent Pipeline Steps | Done → ✓ | Checkmark bounces in: `scale(0 → 1.3 → 1.0)` | 300ms | spring |
| Recall Widget | Mount | `translateY(100%) → 0` slide up | 400ms | spring `stiffness:300` |
| Recall Textarea | Focus | Border + outer glow transition | 200ms | `ease` |
| Submit button | Hover | Accent bg brightens 10%, `translateY(-1px)` | 150ms | `ease` |
| Correct Answer | Result | Widget border flash green → confetti burst | 0ms / 1s | instant / ease-out |
| Wrong Answer | Result | Horizontal shake `±8px × 3` | 240ms | `cubic-bezier(.36,.07,.19,.97)` |
| XP Ring | XP gain | Stroke fill animates clockwise | 800ms | `ease-out` |
| XP Toast `+10 XP` | XP gain | Fly up 50px + fade out | 1200ms | `ease-out` |
| Theme Switch | `applyTheme()` | All CSS vars transition simultaneously | 600ms | `cubic-bezier(0.4,0,0.2,1)` |
| Chat Bubble | Mount | `translateY(12px) opacity:0 → 0 opacity:1` | 250ms | `ease-out` |
| Session Drawer | Open | `translateX(-320px) → 0` | 300ms | spring `stiffness:400` |
| Session Card | Hover | `translateY(-2px)` + border appear | 150ms | `ease-out` |
| Session Card | Delete | `translateX(-20px) opacity:0` + list collapse | 200ms | `ease-in` |
| Share Modal | Open | `scale(0.9) opacity:0 → 1 opacity:1` | 250ms | `ease-out` |
| Command Palette | Open | `scale(0.95) opacity:0 → 1 opacity:1` | 150ms | `ease-out` |
| Command Items | Hover | `background rgba transition` | 100ms | `ease` |
| All Buttons | Press | `scale(0.97)` | 80ms | `ease-in` |
| All Modal Close | Dismiss | Reverse of open animation | 150ms | `ease-in` |
| Error Toast | Mount | Slide in from bottom-right | 300ms | spring |
| Error Toast | Auto-dismiss | Slide out right + fade | 300ms | `ease-in` |

**Implementation notes:**
- All Framer Motion animations use `AnimatePresence` for exit animations
- CSS `transition` used for theme variable changes (not Framer Motion — CSS handles bulk property transitions efficiently)
- `will-change: transform` applied to frequently animated elements to promote GPU compositing
- `prefers-reduced-motion` media query respected — all animations set to `duration: 0` if enabled

---

#### 📱 Feature 12 — Responsive Layout

**Purpose:** The app must work and impress on any screen — especially for demo day where judges might view on phones or tablets.

**Breakpoints:**

**Desktop (≥1024px) — Primary Target:**
- Full side-by-side resizable split panel
- Header: full 64px with all controls visible
- Agent Pipeline Bar: visible (48px)
- Landing: two-column CTA cards side by side
- All animations at full fidelity

**Tablet (768–1024px):**
- Workspace layout switches to `flex-direction: column` (panels stacked)
- A `Tab` bar appears at the top of the workspace:
  - `[ 📚 Academic ] [ 🎨 Analogy ]` — 2 toggle tabs
  - Active tab content visible, inactive hidden (not destroyed — data preserved)
  - Tab switch: `opacity: 0 → 1` crossfade + subtle horizontal slide (40px)
- Resize handle hidden
- CTA cards on landing go to single-column (full width each)
- Agent Pipeline Bar becomes a compact 4-dot indicator (no text labels, just colored circles)
- Share Card modal: full-screen on tablet

**Mobile (<768px):**
- Landing: single-column, full-viewport
- Interest input + Level selector stacked vertically
- Workspace: right panel (Analogy) is the default full-screen view
- A bottom drawer (bottom sheet) holds the Academic content — drag up to expand
  - Collapsed: 64px peek showing topic title + "View Academic →" label
  - Expanded: 60vh drawer with full academic content, drag handle at top
  - Framer Motion drag gesture: `dragConstraints`, spring physics
- RecallWidget: full-width, simplified layout
- Session History: full-screen overlay slide-in (not sidebar drawer)
- Keyboard Shortcut Palette: hidden on mobile (touch-only)
- Share Card: modal becomes full-screen bottom sheet
- All font sizes scaled down by 2px across the board
- Ambient background particle count halved (performance)

---

### Component 3: AI-Selected Adaptive Theme Engine (148 Themes)

**Architecture:** No client-side keyword matching. The `Theme Selector Agent` (Gemini 2.5 Flash) reads the user's raw interest string and picks the single best-fit `themeId` from the 148-theme catalog. It is returned as the **first SSE event** — the UI morphs visually before any content text arrives.

`lib/themeEngine.ts` exports `THEME_CATALOG` (148 theme config objects) and `applyTheme(themeId)` which injects all CSS custom properties at `:root` with a smooth `0.6s cubic-bezier` transition.

#### Full Theme Catalog (148 Themes)

| # | Theme ID | Vibe | BG | Accent | Heading Font | Body Font |
|---|---|---|---|---|---|---|
| 1 | `high-fashion` | Luxury editorial runway | `#fdf6f0` | `#c9a97a` | Playfair Display | Lora |
| 2 | `neon-gaming` | Cyberpunk esports arena | `#050510` | `#00ff9f` | JetBrains Mono | Rajdhani |
| 3 | `slate-tech` | Clean premium SaaS | `#0f172a` | `#6366f1` | Plus Jakarta Sans | Inter |
| 4 | `anime-manga` | Vibrant Akihabara streets | `#1a0a2e` | `#ff6b9d` | Zen Dots | Nunito |
| 5 | `synthwave-80s` | Retrowave neon sunset | `#0d0221` | `#ff2079` | Bebas Neue | Orbitron |
| 6 | `lofi-chill` | Cozy rain-window café | `#1e1b18` | `#d4a853` | Merriweather | Source Serif 4 |
| 7 | `forest-nature` | Deep woodland earthiness | `#0d1f0f` | `#4caf50` | Rokkitt | Crimson Text |
| 8 | `ocean-marine` | Deep-sea bioluminescence | `#040d1a` | `#00c9ff` | Oswald | Raleway |
| 9 | `space-cosmos` | NASA mission control | `#020818` | `#a78bfa` | Exo 2 | Space Grotesk |
| 10 | `hip-hop-street` | Urban graffiti culture | `#111111` | `#ff6b00` | Bebas Neue | Barlow Condensed |
| 11 | `cottagecore` | Floral vintage English garden | `#f5ede0` | `#8b5e3c` | Libre Baskerville | EB Garamond |
| 12 | `kpop-idol` | Pastel idol stage lights | `#fff0f8` | `#ff7eb3` | Quicksand | Nunito |
| 13 | `jazz-blues` | Smoky late-night jazz club | `#120c08` | `#e8a830` | Abril Fatface | Spectral |
| 14 | `metal-rock` | Dark concert stage chaos | `#0a0a0a` | `#ff3030` | Metal Mania | Barlow |
| 15 | `bollywood` | Vibrant Diwali festival glow | `#1a0a00` | `#ff9100` | Tiro Devanagari Hindi | Hind |
| 16 | `zen-minimalist` | Japanese wabi-sabi calm | `#f7f5f0` | `#2d6a4f` | Noto Serif JP | Noto Sans JP |
| 17 | `cricket-sports` | Green pitch stadium energy | `#0a1a08` | `#76c442` | Anton | Barlow |
| 18 | `basketball-nba` | Hardwood court drama | `#0d0800` | `#ff6600` | Bebas Neue | Roboto Condensed |
| 19 | `football-soccer` | Stadium roar green turf | `#061206` | `#1de954` | Oswald | Roboto |
| 20 | `formula1-racing` | Carbon fibre speed blur | `#0a0000` | `#e10600` | Titillium Web | IBM Plex Sans |
| 21 | `photography-film` | Darkroom analog grain | `#1a1410` | `#d4af7a` | DM Serif Display | DM Sans |
| 22 | `architecture` | Brutalist concrete lines | `#f0ece4` | `#1a1a1a` | Space Grotesk | IBM Plex Mono |
| 23 | `culinary-chef` | Michelin-star kitchen | `#faf7f2` | `#b5451b` | Cormorant Garamond | Jost |
| 24 | `coffee-cafe` | Artisan third-wave roastery | `#1a120b` | `#c8864e` | Playfair Display | Lato |
| 25 | `skateboarding` | Street park raw concrete | `#141414` | `#faff00` | Permanent Marker | Barlow Condensed |
| 26 | `ballet-dance` | Swan Lake soft elegance | `#fdf4f8` | `#d4a0b5` | Cormorant | Josefin Sans |
| 27 | `film-noir` | 1940s black-and-white cinema | `#0f0f0f` | `#c8a96e` | Abril Fatface | IM Fell English |
| 28 | `fantasy-medieval` | Enchanted forest castle | `#0e0b16` | `#c0a060` | MedievalSharp | Cinzel |
| 29 | `steampunk` | Victorian clockwork brass | `#1a1008` | `#c8860a` | Cinzel Decorative | Philosopher |
| 30 | `gothic-horror` | Haunted mansion darkness | `#080408` | `#8b0000` | UnifrakturMaguntia | Crimson Text |
| 31 | `pop-art` | Andy Warhol bold halftone | `#ffffff` | `#ff0066` | Lilita One | Bangers |
| 32 | `tropical-summer` | Ibiza beach club sunset | `#001a2e` | `#ffb347` | Pacifico | Poppins |
| 33 | `arctic-ice` | Frozen tundra aurora borealis | `#010d18` | `#7dd3fc` | Raleway | Montserrat |
| 34 | `surf-beach` | Pacific coast wave energy | `#001a33` | `#00d4ff` | Pacifico | Open Sans |
| 35 | `hiking-adventure` | Rugged mountain terrain | `#0d1a0d` | `#ff7043` | Fjord One | Cabin |
| 36 | `music-studio` | Pro recording booth warmth | `#0a080f` | `#7c3aed` | Syne | DM Sans |
| 37 | `poetry-literary` | Aged library candlelight | `#f5f0e8` | `#5c3d2e` | Cormorant Garamond | Gentium Plus |
| 38 | `mythology-greek` | Marble Parthenon grandeur | `#f8f4ec` | `#8b6914` | Cinzel | Philosopher |
| 39 | `superhero-comics` | Dynamic panel action lines | `#0a0a14` | `#ffd700` | Bangers | Roboto Condensed |
| 40 | `neon-tokyo` | Harajuku Shibuya crossing | `#0a0014` | `#ff006e` | Zen Dots | M PLUS Rounded 1c |
| 41 | `wilderness-safari` | Golden savanna dusk | `#1a1000` | `#d4a017` | Rokkitt | Merriweather Sans |
| 42 | `classical-music` | Vienna concert hall opulence | `#1a1208` | `#b8962e` | Cormorant SC | Crimson Pro |
| 43 | `street-food` | Night market neon signs | `#0d0800` | `#ff4500` | Permanent Marker | Barlow |
| 44 | `astronomy-telescope` | Observatory dark sky | `#020408` | `#9d4edd` | Exo 2 | Space Grotesk |
| 45 | `vintage-retro` | Mid-century modern print | `#f5e6c8` | `#c0392b` | Alfa Slab One | Josefin Slab |
| 46 | `travel-wanderlust` | Airport terminal world map | `#0a1628` | `#f59e0b` | Nunito | Open Sans |
| 47 | `wrestling-mma` | Under the lights arena | `#0d0000` | `#ff2200` | Bebas Neue | Barlow |
| 48 | `luxury-watch` | Swiss horology precision | `#1a1a1a` | `#c8a96e` | Cormorant Garamond | Montserrat |
| 49 | `k-drama` | Korean drama romance | `#1a0a1e` | `#ff85c2` | Nanum Myeongjo | Noto Sans KR |
| 50 | `chess-strategy` | Grandmaster tournament hall | `#1a1a18` | `#d4af37` | Libre Baskerville | Spectral |
| 51 | `yoga-wellness` | Sunrise rooftop retreat | `#fff8f0` | `#f4845f` | Josefin Sans | Nunito |
| 52 | `astrology-zodiac` | Cosmic celestial map | `#0d0820` | `#c77dff` | Cinzel | IM Fell English |
| 53 | `sneaker-hype` | Limited drop culture | `#0a0a0a` | `#ff6b35` | Bebas Neue | Barlow |
| 54 | `minecraft-pixel` | Blocky pixelated world | `#1a2f1a` | `#5da832` | Press Start 2P | VT323 |
| 55 | `baking-pastry` | French patisserie warmth | `#fdf5e4` | `#d4763b` | Playfair Display | Lato |
| 56 | `true-crime` | Dark detective thriller | `#0d0d0d` | `#cc3333` | Special Elite | Courier Prime |
| 57 | `bookworm-library` | Academic candlelit library | `#f5efe6` | `#704214` | Libre Baskerville | Crimson Text |
| 58 | `rock-climbing` | Rugged cliff face outdoor | `#1a1008` | `#e8501a` | Fjord One | Cabin |
| 59 | `veganism-eco` | Clean green plant-based life | `#f0f7f0` | `#38a169` | Quicksand | Nunito |
| 60 | `tattoo-ink` | Tattoo parlour dark grit | `#0a0808` | `#e63946` | Metal Mania | Barlow Condensed |
| 61 | `martial-arts` | Dojo discipline silence | `#0f0f0a` | `#e63946` | Oswald | Roboto Condensed |
| 62 | `cycling-velodrome` | Pro peloton speed rush | `#0a0d1a` | `#ffdd00` | Titillium Web | Open Sans |
| 63 | `swimming-aquatics` | Olympic pool blue lanes | `#001a2e` | `#00b4d8` | Raleway | Montserrat |
| 64 | `tennis-wimbledon` | Wimbledon grass court | `#0a1a0a` | `#c8ff00` | Oswald | Roboto |
| 65 | `badminton` | Indoor sports hall energy | `#0a0a14` | `#00e5ff` | Anton | Barlow |
| 66 | `boxing-fight` | Fight night championship | `#0d0000` | `#ff3a20` | Bebas Neue | Barlow Condensed |
| 67 | `marathon-running` | Dawn road race endurance | `#0d1a0d` | `#f4a261` | Oswald | Open Sans |
| 68 | `gym-bodybuilding` | Iron warehouse sweat grind | `#0a0a0a` | `#ff4500` | Anton | Barlow Condensed |
| 69 | `meditation-mindfulness` | Serene floating stillness | `#f7f3ee` | `#9b8ea0` | Josefin Sans | Source Serif 4 |
| 70 | `tarot-mystical` | Candlelit occult reading | `#100820` | `#9d4edd` | Cinzel Decorative | IM Fell English |
| 71 | `stand-up-comedy` | Comedy club spotlight | `#0d0a00` | `#f7c948` | Permanent Marker | Barlow |
| 72 | `podcasting` | Studio mic recording booth | `#0f0f0f` | `#8b5cf6` | Syne | DM Sans |
| 73 | `youtube-creator` | Creator studio thumbnail | `#0a0000` | `#ff0000` | Bebas Neue | Roboto |
| 74 | `twitch-streaming` | Live stream purple arena | `#050511` | `#9146ff` | Rajdhani | Barlow |
| 75 | `origami-paper` | Japanese paper folding calm | `#faf9f7` | `#e76f51` | Noto Serif JP | Noto Sans JP |
| 76 | `knitting-crochet` | Cozy yarn craft hygge | `#fdf0e6` | `#c77e5e` | Libre Baskerville | Lato |
| 77 | `pottery-ceramics` | Earthy clay studio craft | `#f5ede0` | `#a0522d` | Rokkitt | Merriweather |
| 78 | `woodworking` | Workshop timber grain | `#1a0f08` | `#c8760a` | Oswald | Cabin |
| 79 | `watercolor-painting` | Soft pigment wash studio | `#fdf8f5` | `#74b7e5` | Cormorant Garamond | Josefin Sans |
| 80 | `calligraphy-art` | Ink brush stroke elegance | `#faf8f5` | `#2d2d2d` | IM Fell English | Cormorant |
| 81 | `birdwatching` | Quiet forest trail dawn | `#0d1a0d` | `#76b041` | Fjord One | Merriweather Sans |
| 82 | `fishing-angling` | Misty lakeside morning | `#061218` | `#5ba4cf` | Rokkitt | Source Serif 4 |
| 83 | `gardening-plants` | Sunlit greenhouse bloom | `#0d1f0f` | `#a8c957` | Merriweather | Nunito |
| 84 | `aquarium-fishkeeping` | Underwater reef tank glow | `#010d14` | `#00b4d8` | Raleway | Open Sans |
| 85 | `cosplay-convention` | Convention hall character | `#0a0514` | `#ff6b9d` | Zen Dots | Nunito |
| 86 | `tabletop-rpg-dnd` | D&D dungeon candlelit map | `#100c08` | `#c8860a` | Cinzel | Philosopher |
| 87 | `card-games-poker` | Vegas casino table felt | `#061206` | `#d4af37` | Abril Fatface | Barlow |
| 88 | `puzzle-solving` | Rubik speed solve focus | `#0a0a14` | `#ff6b35` | Space Grotesk | Inter |
| 89 | `philosophy-stoic` | Ancient marble stoicism | `#f8f4ec` | `#5c4a1e` | Cinzel | Philosopher |
| 90 | `investing-stocks` | Bloomberg terminal green | `#030c03` | `#00ff41` | IBM Plex Mono | IBM Plex Sans |
| 91 | `cryptocurrency-web3` | Blockchain digital gold | `#050510` | `#f7931a` | Orbitron | Rajdhani |
| 92 | `startup-hustle` | Silicon Valley pitch deck | `#0a0f1a` | `#6366f1` | Plus Jakarta Sans | Inter |
| 93 | `psychology-mind` | Clinical mind map calm | `#f5f0fa` | `#7c3aed` | Josefin Sans | Lato |
| 94 | `military-history` | War room tactical ops map | `#0d120a` | `#8a9a5b` | Oswald | Barlow Condensed |
| 95 | `ancient-egypt` | Pharaoh tomb hieroglyphs | `#1a1200` | `#d4a017` | Cinzel Decorative | Philosopher |
| 96 | `horror-movies` | Slasher film blood scream | `#050000` | `#ff0000` | Creepster | Crimson Text |
| 97 | `disney-animation` | Magical fairy tale wonder | `#0a0a2e` | `#4fc3f7` | Pacifico | Nunito |
| 98 | `studio-ghibli` | Miyazaki pastoral meadow | `#f0f7e8` | `#4a90d9` | Noto Serif JP | Nunito |
| 99 | `edm-rave` | Festival strobe lights | `#050510` | `#ff00ff` | Orbitron | Rajdhani |
| 100 | `country-music` | Southern porch sunset | `#1a0f08` | `#d4763b` | Abril Fatface | Merriweather |
| 101 | `reggae-culture` | Caribbean island sun vibes | `#0a1a08` | `#f7c948` | Pacifico | Open Sans |
| 102 | `latin-salsa-dance` | Havana dance floor heat | `#1a0808` | `#ff4500` | Bebas Neue | Barlow |
| 103 | `folk-indie-music` | Acoustic campfire session | `#1a1008` | `#c8a060` | Merriweather | Source Serif 4 |
| 104 | `opera-grand` | Grand opera house velvet | `#0f0808` | `#d4af37` | Cormorant SC | Crimson Pro |
| 105 | `theater-broadway` | Spotlit Broadway stage | `#0a0800` | `#ffd700` | Playfair Display | Lato |
| 106 | `slam-poetry` | Underground spoken word mic | `#0d0808` | `#e63946` | Permanent Marker | Barlow Condensed |
| 107 | `wine-sommelier` | Bordeaux cellar candlelight | `#1a0808` | `#800020` | Cormorant Garamond | Lora |
| 108 | `whiskey-bourbon` | Kentucky distillery amber | `#1a0f00` | `#c8760a` | Libre Baskerville | Spectral |
| 109 | `cocktail-mixology` | Speakeasy neon bar glow | `#0d0808` | `#ff6b9d` | Abril Fatface | Barlow |
| 110 | `luxury-cars` | Supercar carbon fibre track | `#0a0a0a` | `#d4af37` | Titillium Web | IBM Plex Sans |
| 111 | `motorcycles-biker` | Open road freedom wind | `#0a0a08` | `#ff6600` | Bebas Neue | Barlow |
| 112 | `aviation-pilot` | Cockpit blue sky horizon | `#020c1a` | `#74b7e5` | Orbitron | IBM Plex Sans |
| 113 | `sailing-yacht` | Mediterranean blue sail | `#001828` | `#00b4d8` | Raleway | Montserrat |
| 114 | `scuba-diving` | Deep ocean coral reef glow | `#000d1a` | `#00e5ff` | Exo 2 | Open Sans |
| 115 | `extreme-sports` | Adrenaline freefall blur | `#0a0a0a` | `#ff2200` | Bebas Neue | Barlow Condensed |
| 116 | `snowboarding-alpine` | Alpine powder white slopes | `#f0f8ff` | `#00b4d8` | Raleway | Open Sans |
| 117 | `equestrian-horse` | English countryside stable | `#f5ede0` | `#8b4513` | Libre Baskerville | Merriweather |
| 118 | `archery-precision` | Zen target focus silence | `#0d1a0d` | `#c8860a` | Cinzel | Philosopher |
| 119 | `gymnastics-artistic` | Artistic floor routine grace | `#fff0f8` | `#ff69b4` | Josefin Sans | Nunito |
| 120 | `figure-skating` | Ice rink crystalline light | `#f0f8ff` | `#7dd3fc` | Cormorant Garamond | Raleway |
| 121 | `esports-pro` | Championship arena stage | `#050510` | `#00ff9f` | Rajdhani | Barlow Condensed |
| 122 | `mobile-gaming` | Casual bright phone game | `#0a0514` | `#ff6b9d` | Quicksand | Nunito |
| 123 | `retro-gaming-8bit` | NES pixel nostalgia | `#0a0a0a` | `#fc3f03` | Press Start 2P | VT323 |
| 124 | `vr-metaverse` | Virtual reality wireframe | `#020814` | `#00e5ff` | Orbitron | Space Grotesk |
| 125 | `lego-building` | Primary color brick joy | `#fafafa` | `#e3000b` | Lilita One | Nunito |
| 126 | `drones-photography` | Aerial sky pilot view | `#020c1a` | `#74b7e5` | Exo 2 | DM Sans |
| 127 | `robotics-maker` | Circuit board lab workshop | `#050a0f` | `#00ff9f` | JetBrains Mono | IBM Plex Sans |
| 128 | `data-science` | Analytics visualization dash | `#0a0f1a` | `#06b6d4` | Space Grotesk | IBM Plex Mono |
| 129 | `environmental-activism` | Climate urgency green march | `#061206` | `#16a34a` | Quicksand | Nunito |
| 130 | `cooking-indian-spice` | Spice market turmeric heat | `#1a0a00` | `#ff7043` | Hind | Poppins |
| 131 | `cooking-italian` | Rustic Tuscan trattoria | `#1a1008` | `#c0392b` | Libre Baskerville | Lato |
| 132 | `sushi-japanese-food` | Omakase minimalist counter | `#f7f5f0` | `#e63946` | Noto Serif JP | Noto Sans JP |
| 133 | `streetwear-fashion` | Hype drop street culture | `#0a0a0a` | `#ffffff` | Bebas Neue | Barlow Condensed |
| 134 | `vinyl-records` | Record store analog warmth | `#1a1208` | `#d4763b` | Alfa Slab One | Merriweather |
| 135 | `detective-mystery` | Sherlock fog investigation | `#0f0f0f` | `#c8a96e` | Special Elite | Courier Prime |
| 136 | `gaming-speedrun` | World record timer dash | `#0a0514` | `#faff00` | JetBrains Mono | Rajdhani |
| 137 | `interior-design` | Architectural digest luxe | `#f7f4ef` | `#c8a96e` | Cormorant Garamond | Jost |
| 138 | `pet-lover-dogs` | Golden hour puppy warmth | `#fdf5e6` | `#d4763b` | Quicksand | Nunito |
| 139 | `cat-aesthetic` | Mysterious feline aesthetic | `#1a1620` | `#c77dff` | Josefin Sans | Lato |
| 140 | `camping-survival` | Wilderness night fire | `#0d1a0d` | `#f4a261` | Fjord One | Cabin |
| 141 | `minimalism-lifestyle` | Swedish clean simple life | `#f7f7f7` | `#2d2d2d` | Plus Jakarta Sans | Inter |
| 142 | `luxury-travel` | Five-star resort opulence | `#0a0a14` | `#c9a97a` | Cormorant Garamond | Montserrat |
| 143 | `anime-isekai` | Portal fantasy new world | `#0d0a20` | `#7c3aed` | Zen Dots | Nunito |
| 144 | `economics-finance` | Trading floor data rush | `#020c02` | `#00ff41` | IBM Plex Mono | IBM Plex Sans |
| 145 | `oil-painting-art` | Impressionist studio light | `#1a1208` | `#d4763b` | Cormorant Garamond | Lora |
| 146 | `social-media-influencer` | Instagram golden hour glow | `#1a0a2e` | `#ff6b9d` | Quicksand | Nunito |
| 147 | `neuroscience-brain` | Neural network mind map | `#050514` | `#a78bfa` | Exo 2 | Inter |
| 148 | `streetball-urban` | NYC playground court | `#0a0800` | `#ff6600` | Bebas Neue | Barlow |

Each theme object carries: `{ id, bg, fg, accent, fontHeading, fontBody, cardBg, cardBorder, shimmerFrom, shimmerTo }`. The `applyTheme()` function sets all of these as CSS custom properties in one call.

---

### Component 4: Skeleton Loader System (YouTube-style)

- Before the first streaming token arrives, both panels show **animated shimmer skeletons** matching the panel content shape:
  - Title bar placeholder
  - 4–5 text line placeholders (varying widths for realism)
  - A question card placeholder at the bottom
- The shimmer colors come from the active theme's `--shimmer-from` / `--shimmer-to` CSS variables — automatically match all 48 theme palettes
- The moment the **first content token streams in**, the skeleton cross-fades out and real text begins typing
- Pure CSS `@keyframes shimmer` with `background-size: 200%` — no extra library needed

---

### Component 5: Real-Time Streaming Text Renderer

- Both `AcademicPanel` and `AnalogPanel` use the shared `StreamingText` component
- Each incoming SSE token is appended to a `useState` string and rendered immediately
- A **blinking cursor `▋`** trails the text as it renders
- A subtle **typewriter speed normalization** buffers burst token arrivals so output always looks smooth and natural (never jumpy)
- Once the stream ends, the cursor disappears with a 0.5s fade-out animation

---

### Component 6: API Key Modal (In-App Onboarding)

- On first visit (or if no key found in `localStorage`), a **full-screen modal overlay** appears
- Sleek input field + "Get your free key →" link pointing to `aistudio.google.com`
- On submit: key is validated by a lightweight `/api/validate-key` ping, then saved to `localStorage`
- A small **key indicator badge** on the header lets users reset/change their key at any time
- The backend reads the key from the `X-Gemini-Key` request header — no disk writes, no `.env` required

---

### Component 7: Active Recall Loop

- After Synapse response loads, `RecallWidget` slides up with a themed question card
- Student types answer → submitted with full `chat_history` to `/api/learn`
- Stylist Agent evaluates + generates next teaching block
- Correct answer → confetti + XP reward
- Incorrect → shake animation + hint revealed
- Creates a full **back-and-forth tutoring loop** that persists across turns

---

## 💬 Component 8: Gossip Mode — WhatsApp Chat Renderer

### What It Is

**Gossip Mode** is a secret 4th output mode that sits alongside `Beginner`, `Intermediate`, and `Advanced` in the level selector row. When activated, instead of the normal split-panel academic/analogy output, the **entire right panel transforms into a WhatsApp chat UI** — where two Gen Z besties gossip the textbook content at each other in real time.

It is not a skin. It is not a joke. It is a **legitimate pedagogical device** — students absorb and remember information dramatically better when it is delivered as gossip, drama, and social context. It is also the single most viral, demo-day-winning feature in the app.

---

### Mode Selector UI Change

The Level Selector row currently has 3 pills:
```
[ Beginner ]  [ Intermediate ]  [ Advanced ]
```

With Gossip Mode, it becomes:
```
[ Beginner ]  [ Intermediate ]  [ Advanced ]  |  [ 💬 Gossip Mode ]
```

- A thin `|` vertical divider separates the difficulty pills from the Gossip Mode toggle
- Gossip Mode pill has a distinct style: pink/purple gradient border, `💬` emoji prefix, slightly larger than the others
- Gossip Mode is **mutually exclusive** with difficulty levels — selecting it deselects any active difficulty, and vice versa
- When Gossip Mode is selected, a secondary `[EASY 🌸] [INTERMEDIATE 🔥] [HARD 💣]` sub-selector slides down below the main row (Framer Motion: `height: 0 → auto`, 300ms spring)
- These map to the 3 gossip intensity levels (not the same as academic difficulty)

---

### Output UI: WhatsApp Chat Renderer (`GossipChatUI.tsx`)

When Gossip Mode is active, the **right panel is completely replaced** by a WhatsApp-style chat window. The left Academic panel still shows the textbook definition as normal.

#### Chat Container

```
┌─────────────────────────────────────────────────────────────┐
│  WhatsApp Header Bar (48px)                                 │
│  [Back ←]  [Avatar 🟢]  [Name: Priya & Meera]  [⋮ menu]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Chat Viewport (scrollable, flex-col, gap 4px)              │
│  Background: #e5ddd5 (WhatsApp default wallpaper color)     │
│  Background-image: subtle tiled WhatsApp pattern (future)   │
│                                                             │
│  Messages render here, bottom-up, newest at bottom          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Footer (36px) — read-only, no input                        │
│  [🔒 This conversation is end-to-end encrypted]             │
└─────────────────────────────────────────────────────────────┘
```

#### WhatsApp Header Bar
- Background: `#075e54` (WhatsApp green)
- Avatar: circular 36px div with initials or emoji, green online dot overlay
- Name: `[SenderName] & [ReceiverName]` in 15px white, semi-bold
- Sub-label: `online · gossiping rn 👀` in 12px, 70% white opacity
- `⋮` menu icon: right-aligned, white

#### Chat Background
- `background-color: #e5ddd5` — exact default WhatsApp wallpaper hex
- For now: solid color. Later: `background-image: url('/whatsapp-wallpaper.png')` tiled pattern

#### Chat Footer
- Background: `#f0f0f0`
- Text: `🔒 Messages are end-to-end encrypted` — 11px, centered, muted — for full WhatsApp authenticity
- No input field (this is a read-only gossip output, not a chat interface)

---

### Message Bubble Specification

#### Sender Bubble (right side — green):
```
                     ┌──────────────────────────────┐
                     │  [tagged reply block if any]  │
                     │  message text goes here 👀    │
                     │                    11:42 PM ✓✓│
                     └──────────────────────────────┘
```
- Float: right-aligned (`align-self: flex-end`)
- Background: `#dcf8c6` (WhatsApp sender green)
- `border-radius: 8px 0px 8px 8px` (flat top-right corner — WhatsApp signature)
- Max-width: 75% of chat container
- Padding: `8px 12px`
- Font: `-apple-system, 'Segoe UI'` (native WhatsApp system font), 14.5px
- Tail: small CSS triangle `::after` at top-right pointing right

#### Receiver Bubble (left side — white):
```
┌──────────────────────────────┐
│  [tagged reply block if any] │
│  message text goes here 💀   │
│  11:43 PM                    │
└──────────────────────────────┘
```
- Float: left-aligned (`align-self: flex-start`)
- Background: `#ffffff`
- `border-radius: 0px 8px 8px 8px` (flat top-left corner)
- Same max-width and padding as sender
- Tail: CSS triangle `::after` at top-left pointing left

#### Timestamp + Read Status (inside bubble, bottom-right):
- Font: 11px, color `rgba(0,0,0,0.45)`
- Format: `"11:42 PM"` — direct from the `time` field in JSON
- Read status icons (right of timestamp):
  - `read: false` → single grey tick `✓` (sent, not delivered)
  - `read: true` + role is sender → double blue ticks `✓✓` in `#4fc3f7`
  - role is receiver → no tick shown (receiver messages never show ticks in WhatsApp)

#### Tagged Reply Block (inside bubble, above message text):
- Only rendered when `tagged !== null`
- Background: `rgba(0,0,0,0.07)` for receiver, `rgba(0,0,0,0.07)` for sender
- Left border: `3px solid var(--accent)` (or WhatsApp green `#25d366` in gossip mode)
- Border-radius: `4px`
- Content: `"[Name]: [preview text]"` — truncated at 35 chars
- Font: 13px, italic, muted

#### Standalone Reaction Message (just emojis):
- Same bubble styling but text is just `"💀"` or `"😭😭😭"`
- Bubble width shrinks to fit (no max-width expansion)
- Font size: `28px` for single emoji, `22px` for emoji sequences

#### Voice Note Message:
- Special bubble: shows a waveform placeholder (3 animated bars in `#128c7e` green)
- Left: play button circle `▶`
- Center: animated equalizer bars (CSS animation, 3 bars varying height)
- Right: duration `"0:17"` + microphone icon `🎤`
- Sender name label: `[Name] sent a voice note`

---

### Message Streaming / Render Behaviour

- Messages do **not** all appear at once. They **stream in one by one** with realistic typing delays:
  - Each message appears after a delay = `index * 400ms` (first message: 0ms, second: 400ms, third: 800ms, etc.)
  - Before a message appears: show a `...` typing indicator bubble on the correct side (left for receiver, right for sender) — 3 animated dots, `200ms` stagger, 600ms total
  - The typing indicator disappears and the real message bubble pops in (scale `0.95 → 1.0`, 150ms spring)
- This creates the effect of **watching a real-time WhatsApp conversation unfold**

---

### JSON Output Schema (from GOSSIP GPT Agent)

The backend calls the GOSSIP GPT system prompt and receives a raw JSON array. No SSE streaming for gossip mode — the full JSON is returned in one shot, then the frontend renders it message-by-message using the timed delay system above.

```typescript
interface GossipMessage {
  id: number;           // Integer, 1-indexed, unique, incrementing
  role: "sender" | "receiver";  // sender = right green, receiver = left white
  name: string;         // e.g. "Priya" — no emoji in name (enforced by prompt)
  text: string;         // The WhatsApp message text, may include emojis
  time: string;         // "h:mm AM/PM" format e.g. "11:42 PM"
  tagged: null | {
    ref_id: number;     // Must point to an existing earlier message id
    preview: string;    // First ~35 chars of the referenced message's text
  };
  read: boolean;        // true = double blue ticks, false = single grey tick
}
```

#### Frontend Parsing:
```typescript
const messages: GossipMessage[] = JSON.parse(response);
// Map role → alignment:
// "sender" → right-aligned green bubble
// "receiver" → left-aligned white bubble
// tagged !== null → render quote block above text using ref_id to find preview
// read + role === "sender" → show blue double ticks
// read === false → show single grey tick
// time → display directly as-is from the field
```

---

### Backend API Endpoint for Gossip Mode

```
POST /api/gossip
Headers: X-Gemini-Key: [user's key]
Body: {
  "content": "string — the topic or pasted passage",
  "gossip_level": "EASY" | "INTERMEDIATE" | "HARD"
}
Response: {
  "messages": GossipMessage[]   // full JSON array from model
}
```

- This is a **non-streaming** endpoint (unlike `/api/learn`)
- The model is called with the full GOSSIP GPT system prompt below
- Response is parsed and validated — if JSON.parse fails, the backend retries once with a stricter prompt
- No Critic Agent needed — the prompt itself is strict enough about JSON format

---

### GOSSIP GPT Master System Prompt

```
You are GOSSIP GPT 🫦 — the ultimate tea-spiller and certified main character bestie. Take ANY passage, story, or info dump and reframe it as two Gen Z besties texting on WhatsApp — gossiping, reacting, occasionally getting a detail wrong, and correcting each other like real people do.

━━ CHARACTERS ━━
Sender  = initiates the tea, dramatic, uses ALL CAPS, sometimes misremembers a detail
Receiver = reacts, skeptical bestie, catches mistakes, asks follow-up questions
Pick culturally fitting names with emojis e.g. "Priya 🫦" / "Meera 💀". Use names from the passage if available.

━━ HARD LIMITS — READ BEFORE GENERATING ━━
⛔ Maximum 3 tagged replies across the ENTIRE conversation (including correction tags)
⛔ Exactly 1 mistake in Easy mode, exactly 2 mistakes in Intermediate and Hard mode — no more
⛔ Every "correction": "correct" message counts toward the 3 tag limit
⛔ Do NOT tag a message just for drama — only tag when directly replying to or correcting a specific message
⛔ If you have used 3 tags already, all remaining messages must have "tagged": null

━━ GOSSIP MODE LEVELS ━━

EASY 🌸
• 6–8 messages total
• 1 mistake + 1 correction (uses 1 tag)
• Max 2 more tags for normal replies = 3 tags total max
• Emojis: 😱🫢👀💀😭😂✨
• Vibe: light, playful, wholesome shade

INTERMEDIATE 🔥
• 8–12 messages total
• 2 mistakes + 2 corrections (uses 2 tags)
• Max 1 more tag for normal replies = 3 tags total max
• Emojis: 💀☠️🫦🫠👁️🤭🤡🗣️
• 1 standalone reaction message e.g. just "💀" or "😭😭😭"
• Vibe: petty, spicy, mid drama

HARD 💣
• 12–16 messages total
• 2 mistakes + 2 corrections (uses 2 tags)
• Max 1 more tag for normal replies = 3 tags total max
• Emojis: 💣🚨🔥🫠😵💅🤯😤
• 1 voice note message: "(voice note 0:17 🎤)"
• 1 "OMG WAIT" escalation moment mid-convo
• Vibe: full unhinged bestie emergency mode

━━ MISTAKE + CORRECTION RULES ━━
• The wrong detail must come directly from the passage — a real fact that gets slightly misremembered (wrong number, wrong person, wrong order, mild exaggeration)
• The correction MUST use "tagged" pointing to the exact wrong message
• After being corrected, the original person responds — pick one style:
  - Embarrassed: "wait really?? omg I've been telling everyone the wrong thing 💀💀"
  - Defensive: "ok FINE but the point still stands 😭"
  - Doubling down: "ok that's worse actually so my point is MORE valid 😤"
• The correction does NOT kill the gossip energy — conversation continues after it

CORRECTION PHRASE BANK:
"wait no bestie that's not what happened—"
"actually?? it was [X] not [Y] 💀"
"hold on i need to fact check u rn 🧐"
"NOOO ur getting it wrong omg"
"bestie u fumbled the details ngl 😭"
"babe. BABE. that's not it at all"
"nah u misread that fr"
"ur so wrong for this I cannot 💀"

━━ GEN Z LANGUAGE ━━
no cap · fr fr · lowkey · highkey · slay · it's giving · main character · rent free · ate and left no crumbs · understood the assignment · not me ___ · delulu · the audacity · periodt · we move · bestie · ngl · idk · omg · lmaooo · wym · rn · nah · smh · bc · gonna · tryna · ur · pls · ik · ofc
Short burst messages. Occasional mid-thought send ("wait" alone). ALL CAPS for emphasis. Rare typos for realism.

━━ STRICT OUTPUT FORMAT ━━
Return ONLY a valid JSON array. Nothing before [. Nothing after ]. No markdown fences. No explanation.

Each object has EXACTLY these 8 keys:

"id"         → integer starting at 1
"role"       → "sender" or "receiver" only
"name"       → consistent name+emoji per role throughout e.g. "Priya 🫦"
"text"       → the WhatsApp message text with emojis and Gen Z slang
"time"       → "h:mm AM/PM" format, messages 1–4 mins apart e.g. "11:42 PM"
"tagged"     → null OR { "ref_id": , "preview":  }
"read"       → boolean. sender messages always true. receiver: mostly true, last 1–2 can be false
"correction" → "wrong" | "correct" | "none"

━━ CORRECTION FIELD RULES ━━
"wrong"   = this message has a factual mistake about the passage
"correct" = this message corrects a previous wrong message — MUST have tagged pointing to the wrong message
"none"    = normal message

━━ TAG COUNTING — TRACK THIS AS YOU WRITE ━━
Before adding any "tagged" value that is not null, count how many non-null tagged values you have already written. If the count is already 3, you MUST set "tagged": null for all remaining messages, no exceptions.

━━ EXAMPLE (3 messages showing a correction arc) ━━
[
  {
    "id": 3,
    "role": "sender",
    "name": "Meera 💀",
    "text": "she literally got fired omg the disrespect 😭",
    "time": "11:44 PM",
    "tagged": null,
    "read": true,
    "correction": "wrong"
  },
  {
    "id": 4,
    "role": "receiver",
    "name": "Priya 🫦",
    "text": "wait no bestie she QUIT they didn't fire her 💀 u fumbled the details ngl",
    "time": "11:45 PM",
    "tagged": { "ref_id": 3, "preview": "she literally got fired omg the" },
    "read": true,
    "correction": "correct"
  },
  {
    "id": 5,
    "role": "sender",
    "name": "Meera 💀",
    "text": "ok FINE but she still LEFT and that's the drama 😤",
    "time": "11:46 PM",
    "tagged": null,
    "read": true,
    "correction": "none"
  }
]

━━ ABSOLUTE RULES ━━
• Output is ONLY the JSON array — starts with [ ends with ]
• All 8 keys present on every single message
• "correction" is only "wrong", "correct", or "none"
• "role" is only "sender" or "receiver"
• Every "correction": "correct" message has a non-null "tagged"
• Total non-null "tagged" values across entire array ≤ 3
• Wrong details must come from the actual passage — never invent unrelated facts
• Do NOT summarize — DRAMATIZE
```

---

### Gossip Mode UI State Machine

```
User selects [💬 Gossip Mode]
    ↓
Sub-selector slides down: [EASY 🌸] [INTERMEDIATE 🔥] [HARD 💣]
    ↓
User selects intensity + clicks Generate
    ↓
Right panel transforms: normal Analogy chat → GossipChatUI component
    ↓
POST /api/gossip → returns full GossipMessage[] array
    ↓
Messages render one-by-one with 400ms stagger + typing indicator
    ↓
Conversation fully loaded — user can scroll up to re-read
    ↓
Share Card Generator also works in Gossip Mode:
    Canvas card shows a 3-message excerpt styled as WhatsApp bubbles
```

---

### Gossip Mode Theme Overrides

When Gossip Mode is active, the theme engine is **partially suspended**:
- The ambient background and accent colors still apply to the left (Academic) panel
- The **right panel (GossipChatUI)** always uses WhatsApp's native color palette regardless of theme:
  - Chat bg: `#e5ddd5`
  - Sender bubble: `#dcf8c6`
  - Receiver bubble: `#ffffff`
  - Header: `#075e54`
  - Ticks: `#4fc3f7` (read) / `#999` (unread)
- The theme's heading font is still used for the WhatsApp header bar name text
- A small `🎨 [Theme Name]` badge in the Academic panel header reminds the user the theme is still active

---



### Agent 0 — Theme Selector Agent

```
SYSTEM PROMPT:
You are the Theme Selector for Synapse AI, an intelligent educational platform.
Your sole job is to read the user's hobby or interest text and select the single
best-matching theme ID from the catalog below.

RULES:
- You MUST return ONLY a single theme ID string from the list. Nothing else.
- No explanation. No JSON. No markdown. Just the raw theme ID.
- Pick semantically — understand the vibe and culture of the interest, not just keywords.
- If the interest is ambiguous or unclear, pick the closest cultural/lifestyle match.
- Never return a theme not in this list. If genuinely stuck, return "slate-tech".

THEME CATALOG (148 options):
high-fashion, neon-gaming, slate-tech, anime-manga, synthwave-80s, lofi-chill,
forest-nature, ocean-marine, space-cosmos, hip-hop-street, cottagecore, kpop-idol,
jazz-blues, metal-rock, bollywood, zen-minimalist, cricket-sports, basketball-nba,
football-soccer, formula1-racing, photography-film, architecture, culinary-chef,
coffee-cafe, skateboarding, ballet-dance, film-noir, fantasy-medieval, steampunk,
gothic-horror, pop-art, tropical-summer, arctic-ice, surf-beach, hiking-adventure,
music-studio, poetry-literary, mythology-greek, superhero-comics, neon-tokyo,
wilderness-safari, classical-music, street-food, astronomy-telescope, vintage-retro,
travel-wanderlust, wrestling-mma, luxury-watch, k-drama, chess-strategy, yoga-wellness,
astrology-zodiac, sneaker-hype, minecraft-pixel, baking-pastry, true-crime,
bookworm-library, rock-climbing, veganism-eco, tattoo-ink, martial-arts,
cycling-velodrome, swimming-aquatics, tennis-wimbledon, badminton, boxing-fight,
marathon-running, gym-bodybuilding, meditation-mindfulness, tarot-mystical,
stand-up-comedy, podcasting, youtube-creator, twitch-streaming, origami-paper,
knitting-crochet, pottery-ceramics, woodworking, watercolor-painting, calligraphy-art,
birdwatching, fishing-angling, gardening-plants, aquarium-fishkeeping, cosplay-convention,
tabletop-rpg-dnd, card-games-poker, puzzle-solving, philosophy-stoic, investing-stocks,
cryptocurrency-web3, startup-hustle, psychology-mind, military-history, ancient-egypt,
horror-movies, disney-animation, studio-ghibli, edm-rave, country-music, reggae-culture,
latin-salsa-dance, folk-indie-music, opera-grand, theater-broadway, slam-poetry,
wine-sommelier, whiskey-bourbon, cocktail-mixology, luxury-cars, motorcycles-biker,
aviation-pilot, sailing-yacht, scuba-diving, extreme-sports, snowboarding-alpine,
equestrian-horse, archery-precision, gymnastics-artistic, figure-skating, esports-pro,
mobile-gaming, retro-gaming-8bit, vr-metaverse, lego-building, drones-photography,
robotics-maker, data-science, environmental-activism, cooking-indian-spice,
cooking-italian, sushi-japanese-food, streetwear-fashion, vinyl-records,
detective-mystery, gaming-speedrun, interior-design, pet-lover-dogs, cat-aesthetic,
camping-survival, minimalism-lifestyle, luxury-travel, anime-isekai, economics-finance,
oil-painting-art, social-media-influencer, neuroscience-brain, streetball-urban

USER INTEREST: {interest}
```

---

### Agent 1 — Scholar Agent (The Academic)

```
SYSTEM PROMPT:
You are Scholar, an elite academic content specialist inside the Synapse AI learning platform.

Your sole responsibility is to produce the ACADEMIC CONTENT block for a given topic. This is the left panel — it must read like a rigorous textbook or lecture note.

RULES:
1. Language: precise, formal, jargon-intact. Never simplify vocabulary. Use field-standard terminology exactly as an examiner or professor would.
2. Structure your output in this exact order:
   a. One-sentence canonical definition (bold the key term)
   b. Mechanistic explanation (2–4 sentences): HOW it works, not just WHAT it is
   c. Critical properties / constraints (bullet list, max 5 items)
   d. One concrete numerical example or worked illustration where relevant
   e. One "exam trap" — the single most common misconception students hold, stated and corrected in ≤2 sentences
3. Difficulty calibration — adapt depth to the `level` field:
   - Beginner: avoid second-order effects; define every technical term inline
   - Intermediate: assume prerequisite vocabulary; surface edge cases
   - Advanced: include formal notation, complexity bounds, or derivation sketches where applicable
4. Length: 180–280 words. Never shorter, never longer.
5. Output plain text only — no Markdown headers, no code fences, no emoji.
6. Do NOT produce analogies, metaphors, or casual language. That is the Stylist's job.

LEVEL: {level}
TOPIC / SOURCE TEXT: {content}
CHAT HISTORY: {chat_history}
```

---

### Agent 2 — Stylist Agent (The Translator)

```
SYSTEM PROMPT:
You are Stylist, a master analogy architect and personal tutor inside the Synapse AI platform.

You receive:
 - The Scholar's rigorous academic definition of a concept
 - The student's personal interest / hobby
 - The student's level
 - Optional prior chat history (for multi-turn follow-up sessions)

Your job is to produce TWO outputs:

━━ OUTPUT 1 — PERSONALIZED TRANSLATION ━━
Restate the EXACT same concept the Scholar explained, but entirely through the lens of the student's hobby.
Requirements:
 • Every technical element must map 1:1 to a real element in the hobby's universe.
 • Use authentic jargon/slang from the hobby.
 • Sequence matches the Scholar's content exactly.
 • Length: 200–300 words.

━━ OUTPUT 2 — ACTIVE RECALL CHECKPOINT ━━
A single active-recall question testing the core mechanism of the concept, but set entirely within the hobby's world.
Requirements:
 • No academic terms in the question.
 • Must require understanding the mechanism (e.g. how it behaves or how you'd fix a problem).
 • Length: ≤60 words.

━━ OUTPUT FORMAT ━━
Return a JSON object with exactly these two keys:
{
  "personalizedTranslation": "...",
  "nextCheckinQuestion": "..."
}

SCHOLAR OUTPUT: {academic_content}
USER INTEREST: {interest}
CHAT HISTORY: {chat_history}
```

---

### Agent 3 — Critic Agent (The Validator)

```
SYSTEM PROMPT:
You are Critic, a strict quality auditor inside Synapse AI.
Your job is to run a multi-phase audit on the outputs of both Scholar and Stylist.

━━ Phase 1: Scholar Audit ━━
Run these checks:
 [S1] Is the first sentence a bolded, one-sentence canonical definition? If not → rewrite it.
 [S2] Are there exactly 2-4 sentences of mechanistic explanation? If not → edit.
 [S3] Are there max 5 bullet points of constraints/properties? If not → trim.
 [S4] Is there a worked numerical example or illustration? If missing → write one.
 [S5] Is there an "exam trap" correcting a misconception in ≤2 sentences? If not → write/edit.

━━ Phase 2: Stylist Audit ━━
Run these checks:
 [T1] Is the JSON valid and does it contain exactly the two keys "personalizedTranslation" and "nextCheckinQuestion"? If not → fix the JSON structure.
 [T2] Does the analogy map 1:1 structurally to the concept, or is it loose/decorative? If loose → rewrite the weakest analogy link to be structurally isomorphic.
 [T3] Does the recall question stay entirely inside the hobby world? If it leaks academic language → rewrite it.
 [T4] Does the recall question require retrieving the mechanism (not just a definition)? If it only asks "what is X" → escalate to a predict/explain/design question.
 [T5] Word count of personalizedTranslation: 200–300? If outside range → adjust.
 [T6] Word count of nextCheckinQuestion: ≤60? If longer → trim.

━━ OUTPUT FORMAT ━━
Return a single JSON object:
{
  "passed": true | false,
  "audit": [],
  "academicContent": "...(final Scholar text, corrected if needed)...",
  "personalizedTranslation": "...(final Stylist text, corrected if needed)...",
  "nextCheckinQuestion": "...(final question, corrected if needed)...",
  "aiPersonaFeedback": "...(one warm, 1–2 sentence motivational note tuned to the hobby — e.g. for chess: 'You are already thinking like a grandmaster who studies endgame theory before the opening.')..."
}

Notes:
 • "passed": true only if ZERO fixes were required across all 11 checks.
 • "audit": array of strings, one per fix applied. Empty array [] if passed = true.
 • "aiPersonaFeedback": always generate this fresh — it is NOT in the Scholar or Stylist output.
 • Never include Markdown fences, extra keys, or preamble.

RAW INPUT FROM SCHOLAR: {scholar_output}
RAW INPUT FROM STYLIST: {stylist_output}
```

---

### Program Parsing & Data Flow Understanding

All these prompts output structured or text formats. To ensure the program understands and processes them properly:
1. **Response Validation**:
   - The backend runs a validation wrapper around Critic's response. It attempts to load the output using Python's `json.loads`.
   - If a JSON decoding error occurs, it strips any markdown formatting backticks (e.g. ````json` and ````) and attempts a regex fallback `\{.*?\}`.
   - If validation still fails, it automatically retries the Critic Agent call once with a corrective prompt showing the JSON parse error.
2. **SSE Streaming Flow**:
   - As soon as the `themeId` is selected, the server emits a `theme` event: `event: theme\ndata: {"themeId": "high-fashion"}\n\n`.
   - While the Scholar, Stylist, and Critic pipeline runs, the client displays the **Dynamic Phase-Aware Loading UI** (detailed below).
   - Once Critic generates the audited payload, it is sent to the client as a final structured payload.

---

### Dynamic Phase-Aware Loading UI Spec

To prevent the user from thinking the system is broken while the sequential agents execute, the application implements a dynamic loading overlay.

#### The 8 Processing Phases
As the backend progresses, the loading UI transitions through the following phases based on backend progress updates (sent via SSE events or estimated via timed updates if non-streaming):

| Phase | Display Message | Estimated Progress |
|---|---|---|
| `PHASE_1` | "Analyzing input content and extracting core concepts..." | 0% – 12% |
| `PHASE_2` | "Invoking Theme Selector Agent to choose the visual aesthetic..." | 12% – 25% |
| `PHASE_3` | "Invoking Scholar Agent to generate academic content..." | 25% – 38% |
| `PHASE_4` | "Structuring textbook definitions and exam guidelines..." | 38% – 50% |
| `PHASE_5` | "Invoking Stylist Agent to draft 1:1 hobby analogies..." | 50% – 63% |
| `PHASE_6` | "Creating active recall questions in the analogy world..." | 63% – 75% |
| `PHASE_7` | "Invoking Critic Agent to validate JSON schemas and verify pedagogical links..." | 75% – 90% |
| `PHASE_8` | "Streaming final validated payload to workspace..." | 90% – 100% |

#### UI Presentation (`LoadingOrb.tsx` & `SkeletonPanel.tsx`)
- **Visual Orb**: A central glassmorphic sphere that pulses and shifts color palette dynamically to hint at the upcoming theme.
- **Progress Track**: A slim, high-contrast progress bar indicating current percent completion.
- **Micro-animations**: Tiny particle animations orbiting the central orb, speeding up as the phases progress.
- **Skeleton Shimmer**: Animated shimmer boxes appear in the background layout representing the split panes, showing users the layout structure they are waiting for.

---

---

## Execution Stages

### Stage 1 — Project Init (30 min)
1. Create `frontend/` and `backend/` directory structure
2. Initialize Git repo with `.gitignore`
3. Scaffold Next.js 15 with TypeScript + Tailwind + Framer Motion
4. Create Python venv + install backend dependencies

### Stage 2 — Backend (2–3 hours)
1. Build `SynapseOutputSchema` Pydantic model
2. Build PDF/text parser utility (`pdf_parser.py`)
3. Implement Scholar Agent (structured Gemini call, level-aware)
4. Implement Stylist Agent (analogy + recall question generation)
5. Implement Critic Agent (JSON validation + auto-retry)
6. Build SSE streaming endpoint `/api/learn`
7. Build `/api/upload-pdf` file ingestion endpoint
8. Add `/api/validate-key` lightweight ping for frontend onboarding
9. Configure CORS for `localhost:3000`
10. Test via Swagger at `http://localhost:8000/docs`

### Stage 3 — Frontend Foundation (2–3 hours)
1. Set up `ThemeProvider` + CSS custom property system
2. Build `themeEngine.ts` keyword → theme mapper
3. Build `LandingScreen` with two entry cards
4. Build `ApiKeyModal` with localStorage persistence
5. Build all input components (topic, paste, file, interest, level)
6. Build `SkeletonPanel` with per-theme shimmer
7. Build `StreamingText` component with cursor + speed normalization
8. Build split-panel `WorkspaceLayout`
9. Build `AcademicPanel` and `AnalogPanel` using `StreamingText`
10. Build `RecallWidget` with answer submission

### Stage 4 — Integration + Polish (1–2 hours)
1. Wire `api.ts` SSE reader to live backend streaming endpoint
2. Connect `useSynapse` hook to all components
3. Implement Framer Motion transitions (landing → workspace, theme morphs)
4. Add `ErrorToast` error boundary handling
5. End-to-end test with 5+ diverse hobby types to validate AI theme selection

### Stage 5 — Submission Prep
1. Record 2–3 min screen demo (JVM + fashion theme demo route)
2. Write final `README.md` with architecture diagram + run instructions
3. Git commit + push all branches

---

## Verification Plan

### Automated Backend Test
```bash
# Test streaming endpoint
curl -X POST http://localhost:8000/api/learn \
  -H "Content-Type: application/json" \
  -H "X-Gemini-Key: YOUR_KEY_HERE" \
  -d '{"topic":"JVM Garbage Collection","interest":"high fashion","level":"Beginner","chat_history":[]}'
```

### Manual Verification Checklist
- [ ] First visit → API Key modal appears
- [ ] Key saved → modal doesn't reappear on refresh
- [ ] Upload a PDF → text extracted cleanly
- [ ] Type "high fashion" → AI picks `high-fashion` theme (cream, Playfair Display)
- [ ] Type "gaming" → AI picks `neon-gaming` theme (dark, JetBrains Mono)
- [ ] Type "cricket" → AI picks `cricket-sports` theme (green stadium)
- [ ] Type "anime" → AI picks `anime-manga` theme (pink, Zen Dots)
- [ ] Type "coffee" → AI picks `coffee-cafe` theme (dark roast browns)
- [ ] Type unexpected input → AI picks a sensible fallback theme
- [ ] `themeId` arrives as first SSE event → UI morphs before content appears
- [ ] Skeleton shimmer appears on both panels (shimmer colors match active theme)
- [ ] Text streams in word-by-word with blinking cursor `▋`
- [ ] Skeleton cross-fades out as first tokens arrive
- [ ] Left panel shows rigorous academic definition
- [ ] Right panel shows hobby analogy narrative
- [ ] Active recall question appears at bottom
- [ ] Answering question continues the conversation (chat history maintained)
- [ ] API error shows graceful `ErrorToast` (no crash)
- [ ] Works with: topic entry / pasted text / PDF upload
