# fridge — Project definition (draft)

## Purpose
Build a system that keeps track of what’s in Simon’s fridge by observing **real interactions** with the fridge, not by manual entry.

Core idea: treat every interaction as a **transaction**.

## Hardware / data source
- Raspberry Pi 5 (reachable via SSH) with a camera attached.
- The camera will be mounted at the **top of the fridge**.
- It will capture **images and/or short videos** during fridge interactions.

## What the system should do (v1)
### 1) Capture
Detect or trigger recording when the fridge is interacted with (examples):
- door opens
- an item is placed in
- an item is taken out

Output: a sequence of frames (from video) or a burst of images representing the event.

### 2) Analyze the event
From the captured frames/video, infer:
- Did an item get **removed**?
- Did an item get **added**?
- What item(s) were involved?

This is based on computer vision over a series of images (a video is just many images).

### 3) Maintain an inventory database
Maintain a database of items believed to be present in the fridge.

The database should store, per item:
- a human-readable **description** (e.g. “milk carton”, “kimchi jar”)
- a reference to a **proof image** (an image of that specific item, captured in-context)
- optional metadata (later): quantity, timestamps, confidence, etc.

### 4) Record transactions
Maintain a transaction log of detected events:
- type: `ADD` or `REMOVE` (or similar)
- timestamp
- item references (one or many)
- source media references (video/frames)
- confidence/notes (optional)

## Goal state
Over time the system should build a reliable inventory of what’s in the fridge, backed by visual evidence per item, by continuously updating state based on observed transactions.

## Notes / constraints
- The “truth” comes from camera observations.
- Inventory is derived state; transactions are the primary record.

/nix
