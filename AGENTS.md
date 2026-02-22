# AGENTS.md — fridge

This file is for the assistant (Nix) to quickly regain context.

## Start here
- Read `PROJECT.md` first — it defines the goal and scope.

## Repo intent
fridge tracks a real fridge inventory by observing **transactions** (ADD/REMOVE) from camera footage captured by a Raspberry Pi 5.

## Key files
- `PROJECT.md` — project definition (source of truth)
- `docs/` — design notes, decisions, workflows (add as we go)
- `schemas/` — data contracts (items, transactions) (planned)

## Working agreements
- Prefer small, reviewable steps.
- Don’t change scope without Simon’s confirmation.
- Before any deploy/external action: get explicit OK.

## Raspberry Pi script policy (important)
- Scripts that run on the Pi live in **`rpi/bin/`** in this repo (history + review).
- When a Pi script needs changes: **edit in repo first**, commit, then deploy/copy to the Pi.
- The Pi’s `/home/sixten/bin/*` should match what’s in `rpi/bin/`.

## Next suggested docs (create when needed)
- `docs/MVP.md` — milestones (capture → detect → classify → DB)
- `docs/DATA_MODEL.md` — item + transaction schema (and confidence/proof image rules)
- `docs/PI_SETUP.md` — camera, mounting, capture trigger, retention
- `docs/EVAL.md` — how we measure correctness (false adds/removes, confidence thresholds)

/nix
