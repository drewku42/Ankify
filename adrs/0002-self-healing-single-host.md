# ADR-0002: Self-healing on a single host (swap + PM2 boot persistence)

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Drew

## Context

The 2026-07-06 outage was a chain, not a single fault:

1. The AI server ate ~3 GB rendering a PDF → OOM-killer → with **no swap** for
   headroom, the whole OS wedged (`impaired`, dropping all packets for 6+ hours).
2. After a manual reboot, **PM2 did not come back** — the `pm2 startup` systemd unit
   had never been installed (skipped in the original `ec2-setup.sh`), so prod returned
   502 until PM2 was started by hand.

ADR-0001 fixed link #1 *at the cause* (memory is now bounded). This ADR addresses the
**residual resilience gaps** on the one box: no spike cushion, and no automatic recovery
after a reboot. The goal is a box that **heals itself** without a 6am SSH session — not
high availability.

## Decision

Codify two host-level changes in an idempotent, committed script
(`deploy/harden-host.sh`), and apply it to prod:

1. **4 GB swapfile** (`/swapfile`), persisted in `/etc/fstab`, with `vm.swappiness=10`
   so the OS prefers RAM and only spills under real pressure. This is a **cushion** for
   brief render spikes — belt-and-suspenders on top of ADR-0001, not a substitute for it.
2. **PM2 boot persistence** — install the `pm2-<user>` systemd unit (`pm2 startup`) and
   snapshot the running apps (`pm2 save`), so a reboot relaunches PM2 and both services
   automatically.

Keeping it a script (not a one-off SSH session) means it's repeatable on a rebuilt box
and self-documents the intended host state.

## Alternatives considered

- **Multi-host HA** (second instance + load balancer, managed DB, health-check
  replacement). Rejected as **premature at ~zero users** — real cost and complexity to
  solve a problem we don't have. The constraint is users, not uptime. Revisit when real
  traffic genuinely can't fit one box.
- **Bigger instance for more RAM.** Already rejected in ADR-0001 — it *moves* the OOM
  cliff rather than removing it, and adds ongoing cost. Swap here is only a spike cushion,
  not a capacity play.
- **Status quo (manual reboot + manual `pm2 start`).** That *is* what produced a 6+ hour
  outage. Rejected.

## Consequences

**Better**
- A reboot no longer takes prod down — services come back on their own.
- A memory spike now has a disk cushion instead of wedging the OS.
- Host state is reproducible via one idempotent script.

**Worse / neutral**
- If swap is ever used *heavily* (sustained, not spikes) the box will thrash and crawl —
  acceptable because ADR-0001 already keeps steady-state memory in RAM; swap should only
  catch rare bursts. Sustained swap usage is a signal to actually scale, and worth alarming
  on later.
- `deploy.sh` does **not** run this — it's applied separately (`bash deploy/harden-host.sh`
  on the box). Deploy stays a code-only step; host setup is deliberately its own action.

**Follow-ups (not in this ADR)**
- **CloudWatch alarm → EC2 auto-recovery** on `StatusCheckFailed_Instance`: closes the
  remaining case where the OS wedges at a level PM2/systemd can't recover from, by having
  AWS reboot the instance automatically. This is an AWS-side setting, not a host command,
  so it's out of scope for the script.
- Alarm on sustained swap / low memory so we hear about pressure before users do.

## Verification (measured 2026-07-06)

Applied to prod (`i-08f0038b89881700a`) via `deploy/harden-host.sh`:

- `swapon --show`: `/swapfile 4G` active; `/etc/fstab` has the entry; `vm.swappiness=10`.
- `systemctl is-enabled pm2-ubuntu` → `enabled`; `~/.pm2/dump.pm2` written by `pm2 save`.
- Not exercised by an actual reboot (won't bounce prod to test), but all persistent
  artifacts are in place per standard PM2/systemd practice.
