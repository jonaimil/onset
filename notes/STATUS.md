# Status

## Current State
Workflow 1 (LoRA training from single face image) is functionally complete. UI polish pass in progress.

## Recent Changes
- Generation loading state redesigned: progressive reveal grid (cells resolve one-by-one with diagonal shimmer sweep, counter, Remotion GridLoader2 spinner)
- Image grids: generation screen → 3x3, review screen → 4x2
- Training config: trigger word defaults empty, auto-syncs from profile name (user can override)
- Default trigger word changed from "TOK" to empty

## Known Issues
- Training route blocks 5-10 min — will timeout on Vercel hobby (60s). Needs queue+poll for deployment.
- Mock mode seeds localStorage-persisted profile store — mock profiles stick around after leaving mock mode
- Turbopack `.next` cache can corrupt (slice/range panics) — requires `rm -rf .next`

## What's Next
- In-app prompting page (currently "Test LoRA" links to external fal.ai playground)
- Deployment strategy for long-running training route
