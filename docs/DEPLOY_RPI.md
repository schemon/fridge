# Deploy to Raspberry Pi (sixten@raspberrypi.local)

## Files in this repo

- `rpi/bin/`
  - `fridge-usb-trigger` – reads Arduino serial (`/dev/ttyACM0`) and calls `fridge-vid-start/stop`
  - `build_and_upload_arduino` – build+upload a sketch folder (or a `.ino` -> parent folder)
  - `fridge-cleanup` – safe cleanup of `fridge-captures/sessions` + trims plots
- `rpi/systemd/fridge-usb-trigger.service` – systemd unit
- `arduino/uno/ldr_usb/` – Arduino sketches used during bringup

## Install / update on Pi

### 1) Copy scripts

```bash
# from repo root on Mac
rsync -av rpi/bin/ sixten@raspberrypi.local:/home/sixten/bin/
```

### 2) Install systemd unit

```bash
rsync -av rpi/systemd/fridge-usb-trigger.service sixten@raspberrypi.local:/tmp/
ssh sixten@raspberrypi.local 'sudo mv /tmp/fridge-usb-trigger.service /etc/systemd/system/ && sudo systemctl daemon-reload'
ssh sixten@raspberrypi.local 'sudo systemctl enable --now fridge-usb-trigger.service'
```

### 3) Arduino sketches

```bash
rsync -av arduino/uno/ldr_usb/ sixten@raspberrypi.local:/home/sixten/ldr_usb/
```

## Notes

- Arduino Uno appears as `/dev/ttyACM0`.
- Stop the service when manually reading the port:

```bash
sudo systemctl stop fridge-usb-trigger.service
stty -F /dev/ttyACM0 115200 raw -echo
timeout 5 cat /dev/ttyACM0
sudo systemctl start fridge-usb-trigger.service
```
