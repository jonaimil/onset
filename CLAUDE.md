# Onset

## What This Is
LoRA face trainer — multi-workflow app. Workflow 1: bootstrap a LoRA training dataset from a single face image using fal.ai NanoBanana, then train via fal.ai.

## Stack
- Next.js 15 (App Router, TypeScript, `src/` dir)
- Tailwind CSS v4 + shadcn/ui (new-york style, dark mode)
- Font: Roboto Mono (Google Fonts, monospace throughout)
- Accent: Lime `oklch(0.82 0.19 130)` / `#8BE83B`
- Zustand (wizard state: no persist, profile state: localStorage persist)
- fal.ai: `@fal-ai/client` + `@fal-ai/server-proxy` (proxy at `/api/fal/proxy`)
- Remotion: `@remotion/player` for inline GridLoader animation (training screen)
- JSZip for training dataset bundling (server-side) + client-side reference image downloads

## Key Patterns
- **Dual auth**: User API key (localStorage via `api-key-store.ts`) OR server-side `FAL_KEY` via proxy. User key takes priority. Training route receives key via `x-fal-key` header.
- **Proxy pattern**: When no user key, fal.ai calls go through `/api/fal/proxy` — FAL_KEY stays server-side
- **Client-side credentials**: When user provides key, `fal.config({ credentials })` bypasses proxy entirely
- **Wizard gating**: `/train` checks user key → server key (`/api/fal/status`) → shows `ApiKeyPrompt` if neither
- **Wizard state**: `trainer-store.ts` — session-scoped, no persistence, dies on refresh
- **Profile state**: `profile-store.ts` — persisted to localStorage, survives refresh
- **API key state**: `api-key-store.ts` — persisted to localStorage
- **Grid cropping**: Canvas API, client-side, divide by 3
- **Image URLs**: fal.storage for all images (needed for fal API access)
- **Mock mode**: `?mock=true` query param on `/train` or `/profiles` — seeds placeholder data, shows phase navigator, no API calls

## Routes
- `/` → redirects to `/train`
- `/train` → LoRA trainer wizard (4 or 6 rounds, user-selectable). `?mock=true` for design mode.
- `/profiles` → saved LoRA profiles. `?mock=true` seeds 3 mock profiles.
- `/api/fal/proxy` → fal.ai server proxy (used when no user API key)
- `/api/fal/status` → returns `{ hasServerKey: boolean }` for wizard gating
- `/api/train` → ZIP creation + LoRA training submission (accepts `x-fal-key` header)

## Generation Rounds (4 lite, 6 default)
1. **Expressions** — neutral, smiling, serious, surprised, laughing, eyes closed
2. **Angles** — left, right, 3/4 view, up, down, tilted
3. **Outfits & Lighting** — casual, formal, t-shirt, outdoor jacket (higher drift risk)
4. **Settings & Framing** — close-up, upper body, outdoor/indoor, side profile, over shoulder
5. **Accessories & Styling** — glasses, sunglasses, hat, scarf, earrings, headband
6. **Activities & Natural Poses** — reading, coffee, phone, chin rest, laughing with hands, laptop

## User-configurable Settings (Upload Step)
- **Resolution**: 4K default ($0.30/round), 2K lite ($0.15/round) — stored in trainer-store
- **Round count**: 6 default, 4 lite — stored in trainer-store

## API Models
- NanoBanano: `fal-ai/nano-banana-pro/edit` (generation, 2K or 4K resolution)
- LoRA Training: `fal-ai/flux-lora-fast-training` (training, ~$2)

## Design System Conventions
- **Page loading states**: Every page must show `<PageLoader />` (`src/components/ui/page-loader.tsx`) during async initialization (store hydration, API checks, mock seeding). Never render a blank page.
- **Page enter animation**: Content after loading uses `animate-in fade-in duration-300` (tw-animate-css)
- **Profile cards**: Variant A — all actions (download, copy, delete) hover-reveal top-right. Two images per card: default + hover swap via crossfade.
- **"Test LoRA" button**: On training complete screen (below card, primary CTA) and profiles page header (ghost, secondary). Links to fal.ai flux-lora playground (external, new tab). Temporary until in-app prompting page is built.

## Gotchas
- NanoBanano `image_urls` max is 14 — always include original, cap the rest
- JSZip needs ArrayBuffer, NOT Blob: `const ab = await blob.arrayBuffer(); zip.file(name, ab)`
- Training route blocks for 5-10 min — will timeout on Vercel hobby (60s). Use queue+poll for deployment.
- Grid cropping needs `crossOrigin = 'anonymous'` on image element for canvas access
- `startTraining` uploads any images missing `falUrl` before sending to API — don't assume all images have been uploaded
- Round 3 (outfits) has higher face drift risk — Round 4 adds variety via framing/settings
- `@fal-ai/server-proxy` exports `route.GET`, `route.POST`, `route.PUT` — destructure individually for Next.js 16
- `FalConfigProvider` wraps app in layout — syncs user API key to `fal.config()` reactively
- Training route calls `fal.config({ credentials })` per-request — uses `x-fal-key` header or falls back to env var
- Mock mode seeds `useProfileStore` (localStorage-persisted) — mock profiles stick around after leaving mock mode, delete manually
- Mock mode `trainingStatus` must be empty string `""` (not a message) for typewriter quips to display
- Turbopack `.next` cache can corrupt — if pages fail to compile with slice/range panics, `rm -rf .next` and restart
- Turbopack can serve stale CSS after `globals.css` changes — clear `.next` and restart if color/font changes don't appear
- localStorage keys changed from `frameforge-*` to `onset-*` — old data won't carry over
