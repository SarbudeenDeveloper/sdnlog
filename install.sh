#!/usr/bin/env bash
#
# SDNLog — install, update, and run in one command:
#
#   curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/install.sh | bash
#
# First run:  clones the app into ~/.sdnlog, installs dependencies, builds,
#             and starts it at http://localhost:3456.
# Re-running: checks GitHub for updates — if there are new commits it pulls,
#             rebuilds, and restarts; otherwise it just makes sure the app
#             is running.
#
# Configuration (environment variables):
#   SDNLOG_PORT      port to serve on             (default: 3456)
#   SDNLOG_HOME      install location             (default: ~/.sdnlog)
#   SDNLOG_DATA_DIR  where the SQLite db lives    (default: $SDNLOG_HOME/data)
#   SDNLOG_BRANCH    branch to track              (default: main)
#   SDNLOG_NO_OPEN   set to 1 to skip opening the browser
#
# Local subcommands (after install: bash ~/.sdnlog/app/install.sh <cmd>):
#   stop | status | logs | uninstall

set -euo pipefail

REPO_URL="${SDNLOG_REPO:-https://github.com/OWNER/REPO.git}"
BRANCH="${SDNLOG_BRANCH:-main}"
ROOT="${SDNLOG_HOME:-$HOME/.sdnlog}"
APP_DIR="$ROOT/app"
export SDNLOG_DATA_DIR="${SDNLOG_DATA_DIR:-$ROOT/data}"
LOG_FILE="$ROOT/server.log"
PID_FILE="$ROOT/server.pid"
BUILT_FILE="$ROOT/.built-commit"
# Remember the port across runs so `status`/`stop` work without SDNLOG_PORT set.
PORT="${SDNLOG_PORT:-$(cat "$ROOT/.port" 2>/dev/null || echo 3456)}"
URL="http://localhost:$PORT"

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ok\033[0m  %s\n' "$*"; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

server_pid() {
  [ -f "$PID_FILE" ] || return 1
  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null)" || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  printf '%s' "$pid"
}

server_healthy() {
  # Hit the loopback IP and bypass any configured proxy — corporate proxies
  # often intercept "localhost" and answer for it.
  curl -sf --noproxy '*' -o /dev/null "http://127.0.0.1:$PORT" 2>/dev/null
}

# Send a signal to a process and all of its descendants. `next start` spawns
# a separate next-server child that keeps the port if only the parent dies.
kill_tree() {
  local sig="$1" pid="$2" child
  for child in $(pgrep -P "$pid" 2>/dev/null); do
    kill_tree "$sig" "$child"
  done
  kill "-$sig" "$pid" 2>/dev/null || true
}

stop_server() {
  local pid p
  if pid="$(server_pid)"; then
    info "Stopping SDNLog (pid $pid)..."
    kill_tree TERM "$pid"
    for _ in $(seq 1 20); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
    kill_tree KILL "$pid"
  fi
  rm -f "$PID_FILE"
  # Fallback: reap an orphaned next-server still holding our port (e.g. from
  # an older version of this script). Only touch processes that are ours.
  if command -v lsof >/dev/null 2>&1; then
    for p in $(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null); do
      if ps -o command= -p "$p" 2>/dev/null | grep -Eq 'next-server|next start'; then
        kill "$p" 2>/dev/null || true
      fi
    done
  fi
}

cmd="${1:-run}"
case "$cmd" in
  stop)
    stop_server; ok "SDNLog stopped."; exit 0 ;;
  status)
    if server_pid >/dev/null && server_healthy; then
      ok "SDNLog is running at $URL (pid $(server_pid))."
    else
      echo "SDNLog is not running."
    fi
    exit 0 ;;
  logs)
    exec tail -n 100 -f "$LOG_FILE" ;;
  uninstall)
    stop_server
    rm -rf "$APP_DIR" "$PID_FILE" "$BUILT_FILE" "$LOG_FILE"
    ok "App removed. Your journal data was kept at $SDNLOG_DATA_DIR"
    echo "     (delete it with: rm -rf \"$SDNLOG_DATA_DIR\")"
    exit 0 ;;
  run) ;;
  *) die "Unknown command: $cmd (expected: stop | status | logs | uninstall)" ;;
esac

# ---------------------------------------------------------------- prerequisites
command -v git  >/dev/null 2>&1 || die "git is required. Install it from https://git-scm.com and re-run."
command -v curl >/dev/null 2>&1 || die "curl is required."
command -v node >/dev/null 2>&1 || die "Node.js 20+ is required. Install it from https://nodejs.org and re-run."
command -v npm  >/dev/null 2>&1 || die "npm is required (it ships with Node.js)."
node -e 'process.exit(parseInt(process.versions.node) >= 20 ? 0 : 1)' \
  || die "Node.js 20 or newer is required (found $(node -v)). Update it from https://nodejs.org and re-run."

mkdir -p "$ROOT" "$SDNLOG_DATA_DIR"
printf '%s' "$PORT" >"$ROOT/.port"

# ------------------------------------------------------------- clone or update
updated=0
if [ ! -d "$APP_DIR/.git" ]; then
  info "Installing SDNLog into $APP_DIR..."
  git clone --quiet --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  ok "Downloaded SDNLog."
  updated=1
else
  info "Checking for updates..."
  git -C "$APP_DIR" fetch --quiet --depth 1 origin "$BRANCH"
  local_rev="$(git -C "$APP_DIR" rev-parse HEAD)"
  remote_rev="$(git -C "$APP_DIR" rev-parse "origin/$BRANCH")"
  if [ "$local_rev" != "$remote_rev" ]; then
    info "Update found — applying..."
    git -C "$APP_DIR" reset --quiet --hard "origin/$BRANCH"
    ok "Updated to the latest version."
    updated=1
  else
    ok "Already up to date."
  fi
fi

# ------------------------------------------------------- install deps & build
current_rev="$(git -C "$APP_DIR" rev-parse HEAD)"
built_rev="$(cat "$BUILT_FILE" 2>/dev/null || true)"
needs_restart=0
if [ "$current_rev" != "$built_rev" ] || [ ! -f "$APP_DIR/.next/BUILD_ID" ]; then
  info "Installing dependencies (this can take a minute)..."
  (cd "$APP_DIR" && npm ci --no-audit --no-fund --loglevel=error)
  info "Building the app..."
  (cd "$APP_DIR" && npm run build >"$ROOT/build.log" 2>&1) \
    || die "Build failed — see $ROOT/build.log"
  printf '%s' "$current_rev" >"$BUILT_FILE"
  ok "Build complete."
  needs_restart=1
fi

# ------------------------------------------------------------------ start/stop
if [ "$needs_restart" -eq 0 ] && server_pid >/dev/null && server_healthy; then
  ok "SDNLog is already running."
else
  stop_server
  if server_healthy; then
    die "Port $PORT is in use by another app. Re-run with a different port, e.g.:
       SDNLOG_PORT=4567 bash install.sh"
  fi
  info "Starting SDNLog on port $PORT..."
  (cd "$APP_DIR" && nohup ./node_modules/.bin/next start -p "$PORT" >"$LOG_FILE" 2>&1 &
   echo $! >"$PID_FILE")
  started=0
  for _ in $(seq 1 60); do
    if server_healthy; then started=1; break; fi
    server_pid >/dev/null || break
    sleep 0.5
  done
  [ "$started" -eq 1 ] || die "The app did not start — see $LOG_FILE"
  ok "SDNLog is running."
fi

echo
printf '   \033[1mOpen %s in your browser.\033[0m\n' "$URL"
echo   "   Your journal is stored in $SDNLOG_DATA_DIR"
echo   "   Re-run this same command anytime to update and restart."
echo   "   Stop it with: bash $APP_DIR/install.sh stop"
echo

if [ "${SDNLOG_NO_OPEN:-0}" != "1" ] && [ "$updated" -eq 1 ]; then
  if command -v open >/dev/null 2>&1; then open "$URL" 2>/dev/null || true
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" 2>/dev/null || true
  fi
fi
