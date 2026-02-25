# Plan

## Vision
Onset: LoRA face trainer that bootstraps a training dataset from a single face image, then trains a LoRA model. Eventually a multi-workflow creative tool.

## Workflow 1: LoRA Training (Current)
- [x] Upload single face image
- [x] Generate 4-6 rounds of face variations via NanoBanana
- [x] User curates images (select/deselect per round)
- [x] Final review of full dataset
- [x] Configure training (profile name, trigger word)
- [x] Submit training job to fal.ai
- [x] Save trained LoRA to profiles
- [x] Mock mode for design iteration

## Upcoming
- [ ] In-app prompting page (replace external "Test LoRA" link)
- [ ] Deployment: queue+poll for training route (Vercel 60s timeout)
- [ ] Profile management improvements (edit, rename)

## Scope — Out
- Multi-face training (one face per workflow)
- Non-face LoRA training (style, object)
- Self-hosted training (fal.ai only for now)
