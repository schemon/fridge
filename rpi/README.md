# Raspberry Pi scripts

This directory is the **source of truth** for scripts that run on the Raspberry Pi.

## Rule

Edit scripts here first (commit to git), then deploy them to the Pi.

## Deploy

Default remote path used by the local wrapper scripts is:

- `/home/sixten/bin`

Deploy helper (recommended):
```bash
./bin/fridge-rpi-deploy
# or
FRIDGE_PI_HOST=raspberrypi.local FRIDGE_PI_USER=sixten FRIDGE_PI_BIN=/home/sixten/bin ./bin/fridge-rpi-deploy
```

Manual deploy:
```bash
scp -O rpi/bin/fridge-vid-start rpi/bin/fridge-vid-stop sixten@raspberrypi.local:/home/sixten/bin/
ssh sixten@raspberrypi.local "chmod +x /home/sixten/bin/fridge-vid-start /home/sixten/bin/fridge-vid-stop"
```
