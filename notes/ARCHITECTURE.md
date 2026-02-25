# Architecture

## Stack
- Next.js 15, App Router, TypeScript, `src/` directory
- Tailwind CSS v4 + shadcn/ui (new-york style, dark mode always)
- Font: Roboto Mono (monospace throughout)
- Accent: Lime `oklch(0.82 0.19 130)` — user-configurable via `--accent-hue` / `--accent-chroma` CSS vars
- Zustand for state (wizard: session-scoped, profiles: localStorage-persisted)
- fal.ai: `@fal-ai/client` + `@fal-ai/server-proxy`
- Remotion: `@remotion/player` for GridLoader animations
- JSZip for training dataset bundling

## Directory Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout (dark, Roboto Mono, FalConfigProvider, AppNav)
│   ├── page.tsx            # Redirects to /train
│   ├── globals.css         # Tailwind v4, CSS vars, dark theme, shimmer-sweep keyframe
│   ├── train/              # LoRA trainer wizard
│   ├── profiles/           # Saved LoRA profiles
│   └── api/
│       ├── fal/proxy/      # fal.ai server proxy (when no user API key)
│       ├── fal/status/     # Returns { hasServerKey: boolean }
│       └── train/          # ZIP creation + LoRA training submission
├── components/
│   ├── face-trainer/       # Wizard components (GenerationRound, ImageGrid, FinalReview, etc.)
│   ├── layout/             # AppNav
│   ├── providers/          # FalConfigProvider
│   ├── settings/           # ApiKeyPrompt
│   └── ui/                 # shadcn primitives + GridLoader Remotion components
├── store/
│   ├── trainer-store.ts    # Wizard state (session-scoped, no persist)
│   ├── profile-store.ts    # Saved profiles (localStorage persist)
│   ├── api-key-store.ts    # User API key (localStorage persist)
│   └── accent-store.ts     # Accent color customization (localStorage persist)
├── lib/
│   ├── color.ts            # Accent color utilities
│   ├── fal.ts              # fal.ai client helpers
│   ├── grid-cropper.ts     # Canvas API grid cropping
│   ├── mock-data.ts        # Mock mode seed data
│   └── utils.ts            # cn() and general utils
└── types/
    └── index.ts            # All types + ROUND_CONFIGS constant
```

## Key Patterns

### Auth: Dual API key
User key (localStorage) OR server-side `FAL_KEY` via proxy. User key takes priority. Training route receives key via `x-fal-key` header.

### Wizard Flow
Upload → Generating (4 or 6 rounds) → Final Review → Training Config → Training → Complete

### State Architecture
- `trainer-store`: Session-scoped, no persistence. Drives the entire wizard flow.
- `profile-store`: localStorage-persisted. Saved LoRA profiles survive refresh.
- `api-key-store`: localStorage-persisted. User's fal.ai API key.
- `accent-store`: localStorage-persisted. Custom accent hue/chroma.

### Mock Mode
`?mock=true` query param on `/train` or `/profiles`. Seeds placeholder data, shows phase navigator, no API calls.

## API Models
- NanoBanana: `fal-ai/nano-banana-pro/edit` (generation, 2K or 4K)
- LoRA Training: `fal-ai/flux-lora-fast-training` (~$2)
