# Video capture workflow

## One-shot (recommended)

Record a clip, wait N seconds, stop, and fetch:
```bash
./bin/fridge-vid-clip            # default 5s
./bin/fridge-vid-clip 10         # 10s
./bin/fridge-vid-clip 3 test1    # 3s + explicit session id
```

## Deterministic frames (for tracking)

Extract frames at exact timestamps (e.g. every 100ms) and name them by time:
```bash
./bin/fridge-frames-deterministic ./captures/video-YYYY.../clip.mp4 --step-ms 100 --duration-s 5
# outputs: captures/frames-100ms-<timestamp>/t_0000ms.png ... t_4900ms.png
```

## Manual (3-step)

1) Start recording (returns remote session dir):
```bash
./bin/fridge-vid-start-remote
```

2) Stop recording (prints remote session dir + remote file path):
```bash
./bin/fridge-vid-stop-remote <remote_session_dir>
```

3) Fetch the resulting file (mp4 if created, else h264):
```bash
./bin/fridge-vid-fetch <remote_file_path>
```

Notes:
- Configure host/user via env vars `FRIDGE_PI_HOST` and `FRIDGE_PI_USER`.
- Default remote scripts live in `/home/sixten/bin`.
- Pi script source-of-truth is versioned in this repo under `rpi/bin/`.

/nix
