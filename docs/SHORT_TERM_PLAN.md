# Short-term plan (fridge)

Goal: move from “idea” to a working end-to-end prototype pipeline.

## Phase 1 — Understand the camera on the Raspberry Pi
**Outcome:** we can reliably capture images/video with known settings and file outputs.

Tasks:
- Confirm camera model + connection (CSI/USB) and which toolchain applies (`libcamera-*`, `rpicam-*`, ffmpeg, etc.).
- Validate the capture commands:
  - still image
  - short video clip
  - burst / timelapse
- Decide: capture format(s) and defaults
  - resolution
  - fps (for video)
  - exposure/white-balance strategy (fridge lighting is tricky)
  - storage path + naming convention
- Produce a small “camera sanity report” (1–2 sample images + 1 sample clip).

## Phase 2 — Capture sessions (start/stop)
**Outcome:** a repeatable “capture session” that starts, records, and ends cleanly.

Tasks:
- Define a session contract:
  - session id
  - start timestamp / end timestamp
  - where files land
  - metadata file written at end (JSON)
- Implement a script:
  - `capture-start` (start recording)
  - `capture-stop` (stop and finalize)
  - Optional: `capture-once` (fixed duration clip)
- Add robustness:
  - handle crashes (partial files)
  - ensure unique filenames
  - minimal logging

## Phase 3 — Analyze the captured images
**Outcome:** given a session, we produce a first-pass “what changed?” result.

Tasks:
- Extract frames (if video) at a chosen cadence.
- Baseline diffing:
  - compare “before” vs “after” frames to detect motion/change regions
- Produce an analysis artifact:
  - summary JSON (added/removed/unknown)
  - debug images (bounding boxes / change heatmaps)
- Decide the first classification strategy:
  - simple heuristics first
  - then plug in a vision model later (with confidence + proof images)

## Notes
- Keep each phase shippable and testable.
- Optimize for visibility: store outputs in a predictable folder structure.

/nix
