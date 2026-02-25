# Decisions

## Generation Loading State → Progressive Reveal Grid
**Context:** The 30-60s loading state during image generation was boring — skeleton boxes and a tiny spinner.
**Options:** Typography hero, progressive reveal, large centered loader, step-by-step narrative, ambient atmosphere.
**Choice:** Progressive reveal (Variant B) — cells resolve one-by-one with diagonal shimmer sweep.
**Rationale:** Gives a sense of forward motion during the wait. Keeps the 3x3 grid structure so the transition to real images is seamless. Minimal/editorial vibe without being too abstract.

## Trigger Word Default → Empty (Auto-sync from Profile Name)
**Context:** Default trigger word was "TOK" (fal.ai default). Users don't know what this means.
**Choice:** Empty default. Profile name auto-syncs to trigger word. User can override trigger word independently.
**Rationale:** Reduces friction. Most users want their trigger word to match their profile name anyway.

## Grid Columns
**Context:** Image grids were 5 columns.
**Choice:** Generation screen: 3x3. Review screen: 4 columns.
**Rationale:** 3x3 matches the NanoBanana output grid. 4 columns on review gives images more breathing room.

## Sidebar Layout (Generation Screen)
**Context:** Considered killing the sidebar during design exploration.
**Choice:** Keep sidebar. Left = round info + controls, right = grid.
**Rationale:** The split gives clear separation between navigation/status and content. Works well at the max-w-5xl layout width.
