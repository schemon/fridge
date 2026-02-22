# fridge helper scripts

## fridge-snap-remote

Takes a still photo on the Raspberry Pi via SSH and downloads it to this repo.

Run from repo root:

```bash
./bin/fridge-snap-remote
```

It saves to:

`captures/<timestamp>/still.jpg`

Config via env vars:
- `FRIDGE_PI_HOST` (default `raspberrypi.local`)
- `FRIDGE_PI_USER` (default `sixten`)

