#!/bin/bash
set -euo pipefail

# Ankify host hardening — make the single EC2 box survive memory spikes and
# reboots without manual intervention. Idempotent: safe to re-run.
# Requires sudo (swapfile + systemd unit).
#
# Usage on the box:  bash /home/ubuntu/Ankify/deploy/harden-host.sh
# Rationale + rejected alternatives: adrs/0002-self-healing-single-host.md

SWAPFILE=/swapfile
SWAP_SIZE=4G

echo "=== 1/2 Swap ($SWAP_SIZE) — headroom so a PDF-render spike can't wedge the OS ==="
if sudo swapon --show=NAME --noheadings | grep -qx "$SWAPFILE"; then
  echo "swap already active."
elif [ -f "$SWAPFILE" ]; then
  echo "$SWAPFILE exists but inactive; enabling."
  sudo swapon "$SWAPFILE"
else
  # fallocate can create files unusable as swap on some filesystems; dd is the safe fallback.
  sudo fallocate -l "$SWAP_SIZE" "$SWAPFILE" || \
    sudo dd if=/dev/zero of="$SWAPFILE" bs=1M count=4096 status=progress
  sudo chmod 600 "$SWAPFILE"
  sudo mkswap "$SWAPFILE"
  sudo swapon "$SWAPFILE"
fi

# Persist swap across reboots.
if ! grep -qs "^$SWAPFILE " /etc/fstab; then
  echo "$SWAPFILE none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
  echo "added $SWAPFILE to /etc/fstab"
fi

# Prefer RAM; only spill to (slow) swap under real pressure.
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-ankify-swappiness.conf >/dev/null
sudo sysctl -q vm.swappiness=10

echo "--- memory now ---"
free -m

echo "=== 2/2 PM2 boot persistence — so a reboot doesn't leave prod 502ing ==="
export PATH="$HOME/.local/bin:$PATH"
PM2_BIN="$(command -v pm2)"
# Install the systemd unit that launches PM2 on boot (root-owned; needs sudo).
sudo env PATH="$PATH:/usr/bin" "$PM2_BIN" startup systemd -u "$USER" --hp "$HOME"
# Snapshot the currently-running apps so the unit relaunches them.
pm2 save
systemctl is-enabled "pm2-$USER" >/dev/null && echo "pm2-$USER is enabled on boot"

echo "=== Host hardening complete ==="
echo "NOTE: EC2 auto-recovery (CloudWatch StatusCheckFailed_Instance) is an AWS-side"
echo "setting, not applied here — see adrs/0002 follow-ups."
