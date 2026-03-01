#!/usr/bin/env bash
set -euo pipefail

# push-to-pi.sh
# Deploy repo-managed scripts/config to the Raspberry Pi.
# IMPORTANT: This script only runs when YOU execute it.
#
# Usage:
#   ./scripts/push-to-pi.sh                          # deploy everything
#   ./scripts/push-to-pi.sh rpi-web                  # fridge-api web service (docker)
#   ./scripts/push-to-pi.sh rpi-door-listener        # fridge-usb-trigger script + systemd unit
#   ./scripts/push-to-pi.sh rpi-cam-recorder         # capture scripts (vid-start/stop, burst, sessions-list, reset, tx-list)
#   ./scripts/push-to-pi.sh arduino-firmware         # ldr_usb sketch: rsync + compile + flash
#   ./scripts/push-to-pi.sh rpi-analyze              # fridge-vid-analyze + stills analyze/finalize scripts
#   ./scripts/push-to-pi.sh rpi-analyze-watcher      # fridge-session-watcher script + systemd unit
#   ./scripts/push-to-pi.sh rpi-web rpi-door-listener  # multiple components
#   DRY_RUN=1 ./scripts/push-to-pi.sh               # show what would happen (no changes)
#
# Assumptions:
# - SSH host is reachable and key-based auth is set up.
# - Remote user has sudo for docker and systemd operations.

### ===== Config =====
HOST="${HOST:-sixten@raspberrypi.local}"
REMOTE_BIN_DIR="${REMOTE_BIN_DIR:-/home/sixten/bin}"
REMOTE_ARDUINO_DIR="${REMOTE_ARDUINO_DIR:-/home/sixten/ldr_usb}"
REMOTE_SYSTEMD_DIR="${REMOTE_SYSTEMD_DIR:-/etc/systemd/system}"
REMOTE_API_DIR="${REMOTE_API_DIR:-/home/sixten/fridge-api}"
SYSTEMD_UNIT="fridge-usb-trigger.service"
WATCHER_UNIT="fridge-session-watcher.service"

LOCAL_RPI_BIN="rpi/bin/"
LOCAL_TRIGGER_SCRIPT="rpi/bin/fridge-usb-trigger"
LOCAL_SYSTEMD_UNIT="rpi/systemd/${SYSTEMD_UNIT}"
LOCAL_ARDUINO_DIR="arduino/uno/ldr_usb/"
LOCAL_API_DIR="rpi/fridge-api/"

CAPTURE_SCRIPTS=(
  fridge-vid-start
  fridge-vid-stop
  fridge-burst
  fridge-sessions-list
  fridge-reset
  fridge-tx-list
)

DRY_RUN="${DRY_RUN:-0}"
RSYNC_FLAGS=(-av --delete)
RSYNC_FILE_FLAGS=(-av)
[[ "$DRY_RUN" == "1" ]] && RSYNC_FLAGS+=(-n)
[[ "$DRY_RUN" == "1" ]] && RSYNC_FILE_FLAGS+=(-n)
### ===================

say()  { printf "%s\n" "$*"; }
run()  { say "+ $*"; [[ "$DRY_RUN" == "1" ]] || eval "$@"; }
dryn() { say "(dry-run) $*"; }

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

# ---- component functions ----

deploy_rpi_web() {
  say "==> [rpi-web] syncing fridge-api..."
  rsync "${RSYNC_FLAGS[@]}" --exclude='node_modules' "$LOCAL_API_DIR" "$HOST:$REMOTE_API_DIR/"
  if [[ "$DRY_RUN" == "1" ]]; then
    dryn "docker-compose up -d --build"
  else
    say "==> [rpi-web] rebuilding container..."
    ssh "$HOST" "cd '$REMOTE_API_DIR' && sudo docker-compose up -d --build --force-recreate"
  fi
}

deploy_rpi_door_listener() {
  say "==> [rpi-door-listener] syncing fridge-usb-trigger script..."
  rsync "${RSYNC_FILE_FLAGS[@]}" "$LOCAL_TRIGGER_SCRIPT" "$HOST:$REMOTE_BIN_DIR/fridge-usb-trigger"
  if [[ "$DRY_RUN" == "0" ]]; then
    ssh "$HOST" "chmod +x '$REMOTE_BIN_DIR/fridge-usb-trigger'"
  fi

  say "==> [rpi-door-listener] installing systemd unit..."
  rsync "${RSYNC_FILE_FLAGS[@]}" "$LOCAL_SYSTEMD_UNIT" "$HOST:/tmp/${SYSTEMD_UNIT}"
  if [[ "$DRY_RUN" == "1" ]]; then
    dryn "systemctl daemon-reload + enable + restart $SYSTEMD_UNIT"
  else
    ssh "$HOST" "sudo mv /tmp/${SYSTEMD_UNIT} ${REMOTE_SYSTEMD_DIR}/${SYSTEMD_UNIT}"
    ssh "$HOST" "sudo systemctl daemon-reload"
    ssh "$HOST" "sudo systemctl enable --now ${SYSTEMD_UNIT}"
    ssh "$HOST" "sudo systemctl status ${SYSTEMD_UNIT} --no-pager -n 20"
  fi
}

deploy_rpi_cam_recorder() {
  say "==> [rpi-cam-recorder] syncing capture scripts..."
  for script in "${CAPTURE_SCRIPTS[@]}"; do
    rsync "${RSYNC_FILE_FLAGS[@]}" "$LOCAL_RPI_BIN/$script" "$HOST:$REMOTE_BIN_DIR/$script"
  done
  if [[ "$DRY_RUN" == "0" ]]; then
    ssh "$HOST" "chmod +x $(printf "'$REMOTE_BIN_DIR/%s' " "${CAPTURE_SCRIPTS[@]}")"
  fi
}

deploy_arduino_firmware() {
  say "==> [arduino-firmware] syncing ldr_usb sketch..."
  rsync "${RSYNC_FLAGS[@]}" "$LOCAL_ARDUINO_DIR" "$HOST:$REMOTE_ARDUINO_DIR/"
  if [[ "$DRY_RUN" == "1" ]]; then
    dryn "build_and_upload_arduino $REMOTE_ARDUINO_DIR/ldr_usb.ino"
  else
    say "==> [arduino-firmware] compiling and flashing..."
    ssh "$HOST" "$REMOTE_BIN_DIR/build_and_upload_arduino '$REMOTE_ARDUINO_DIR/ldr_usb.ino'"
  fi
}

deploy_rpi_analyze() {
  say "==> [rpi-analyze] syncing analyze scripts..."
  local scripts=(fridge-vid-analyze fridge-stills-start fridge-stills-stop fridge-analyze-session fridge-finalize-session)
  for script in "${scripts[@]}"; do
    rsync "${RSYNC_FILE_FLAGS[@]}" "$LOCAL_RPI_BIN/$script" "$HOST:$REMOTE_BIN_DIR/$script"
  done
  if [[ "$DRY_RUN" == "0" ]]; then
    ssh "$HOST" "chmod +x $(printf "'$REMOTE_BIN_DIR/%s' " "${scripts[@]}")"
  fi
}

deploy_rpi_analyze_watcher() {
  say "==> [rpi-analyze-watcher] syncing fridge-session-watcher script..."
  rsync "${RSYNC_FILE_FLAGS[@]}" "$LOCAL_RPI_BIN/fridge-session-watcher" "$HOST:$REMOTE_BIN_DIR/fridge-session-watcher"
  if [[ "$DRY_RUN" == "0" ]]; then
    ssh "$HOST" "chmod +x '$REMOTE_BIN_DIR/fridge-session-watcher'"
  fi

  say "==> [rpi-analyze-watcher] installing systemd unit..."
  rsync "${RSYNC_FILE_FLAGS[@]}" "rpi/systemd/${WATCHER_UNIT}" "$HOST:/tmp/${WATCHER_UNIT}"
  if [[ "$DRY_RUN" == "1" ]]; then
    dryn "systemctl daemon-reload + enable + restart $WATCHER_UNIT"
  else
    ssh "$HOST" "sudo mv /tmp/${WATCHER_UNIT} ${REMOTE_SYSTEMD_DIR}/${WATCHER_UNIT}"
    ssh "$HOST" "sudo systemctl daemon-reload"
    ssh "$HOST" "sudo systemctl enable --now ${WATCHER_UNIT}"
    ssh "$HOST" "sudo systemctl status ${WATCHER_UNIT} --no-pager -n 20"
  fi
}

# ---- parse args ----

ALL_COMPONENTS=(rpi-web rpi-door-listener rpi-cam-recorder arduino-firmware rpi-analyze rpi-analyze-watcher)

if [[ $# -eq 0 ]]; then
  COMPONENTS=("${ALL_COMPONENTS[@]}")
else
  COMPONENTS=("$@")
fi

say "Deploying to: $HOST  components: ${COMPONENTS[*]}"
[[ "$DRY_RUN" == "1" ]] && say "DRY_RUN=1 (no changes will be made)"

for component in "${COMPONENTS[@]}"; do
  case "$component" in
    rpi-web)           deploy_rpi_web ;;
    rpi-door-listener) deploy_rpi_door_listener ;;
    rpi-cam-recorder)  deploy_rpi_cam_recorder ;;
    arduino-firmware)  deploy_arduino_firmware ;;
    rpi-analyze)         deploy_rpi_analyze ;;
    rpi-analyze-watcher) deploy_rpi_analyze_watcher ;;
    *)
      say "Unknown component: $component  (valid: ${ALL_COMPONENTS[*]})" >&2
      exit 2
      ;;
  esac
done

say "Done."
