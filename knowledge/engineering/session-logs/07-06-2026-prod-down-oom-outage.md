# 07-06-2026 — Prod outage: EC2 wedged (OOM), login hung. Half-fixed, PAUSED mid-restore.

**Status: IN PROGRESS — paused because Drew had to drive to work. Prod is NOT fully back yet.**
Pick up at "NEXT STEP" below.

## What happened / today's pivot
Drew opened intending to start the distribution plan (get 10 med students on Ankify, ask 3 for $10 — see `07-05-2026-ankify-strategy`). Blocker surfaced immediately: **prod `ankify.io` login hangs indefinitely, no errors.** Pivoted to debugging. Drew also stated a broader goal for coming sessions: make Ankify debugging/testing *seamless* (computer-use or run/test backend + AI server), add **Playwright** frontend tests, add tests generally, and build **CI/CD + linting + guardrails** — currently there are none. (My flag on record: a big test/CI buildout with zero users is the engineer's-comfort-zone trap the strategy log warned about. Fixing prod IS on the distribution critical path, so it was legit. Keep the infra buildout scoped to "just enough": repeatable local run + a smoke test of the login path. Don't gold-plate before there are users.)

Note: Drew calls the product **"Oncify"**; repo + all docs say **"Ankify"**. Assumed voice/typo; still called it Ankify. Confirm if a rename is actually intended.

## Root cause (fully diagnosed, systematic-debugging)
1. **Symptom:** login hangs, no error. Frontend `ankify.io` (Vercel) = HTTP 200 fine. Backend `api.ankify.io` (EC2 `3.20.9.24`) = **connection TIMED OUT** on all paths (packets dropped, not refused).
2. **Proximate cause:** EC2 instance `i-08f0038b89881700a` (ankify-server, t2.medium, us-east-2b) was **`impaired`** (InstanceStatus check failed 6+ hrs straight; SystemStatus ok). OS hung → drops all packets → browser spins forever. Ruled out: DNS ✓, Elastic IP ✓ (eipassoc-0f3b1ceddac103b6f), security group ✓ (443/80 open to world, 22 locked to Drew's 3 IPs incl. 136.34.78.245), instance not stopped, no recent code deploy.
3. **DEEPER root cause (the real fix target):** previous-boot kernel log shows **`uvicorn` (AI server) repeatedly OOM-killed** — balloons to **~2.9–3.0 GB RSS** (PDF→image render in memory). Box is **3.8 GB RAM, ZERO swap**, + MySQL + Node co-resident. No headroom → OOM thrash → OS wedges. **Will recur** until memory is fixed.

## What I DID (state changes made)
- **Rebooted** `i-08f0038b89881700a` (13:27 UTC). Soft reboot WORKED — status check recovered to `ok` at 13:29:23Z.
- After reboot, 443 went from timeout → **HTTP 502**. Cause: **PM2 apps did not auto-start** (`pm2 list` empty; daemon wasn't even running). `pm2 save`/`pm2 startup` was never configured (ec2-setup.sh step 13 skipped). nginx + mysql DID auto-start (systemd enabled), repo intact at `/home/ubuntu/Ankify`, `backend/dist/index.js` present.

## Access confirmed (how to get on the box)
- SSH works: `ssh -i ~/.ssh/ankify.pem ubuntu@3.20.9.24` (my egress IP 136.34.78.245 already in SG; key name on instance = `ankify-prod`).
- **SSM is NOT set up** (no IAM instance profile; agent logged "instance management role not configured"). Setting up SSM Session Manager = the clean durable "seamless access" fix Drew wants (no SSH keys / no IP allowlist).

## NEXT STEP (do this first when we resume) — brings prod back
Drew **rejected/interrupted** the PM2-start command only because he had to leave — not a "no." Resume by running (SSH in):
```
export PATH="$HOME/.local/bin:$PATH"
pm2 start /home/ubuntu/Ankify/deploy/ecosystem.config.cjs
sleep 8 && pm2 list
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/    # backend :3000
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/    # ai :8000
```
Then verify externally: `curl -sS -o /dev/null -w "%{http_code}\n" https://api.ankify.io/` should stop being 502. Then have Drew try login on ankify.io.

## THEN (in order)
1. **Persist across reboots:** `pm2 save` + `pm2 startup` (run the systemd command it prints) so this never recurs on boot.
2. **Fix the OOM root cause (or it wedges again):** quickest = add **swap** (e.g. 4 GB swapfile) for headroom; also verify AI-server memory per generation and whether PM2 `max_memory_restart: 1G` on `ankify-ai` actually fires before OOM (it clearly didn't). Consider bigger instance or capping concurrency/image detail. THIS is the durable fix — reboot alone only bought time.
3. **Monitoring:** CloudWatch alarm on StatusCheckFailed_Instance + memory, so we hear about it before users do.
4. Only after prod is stable → back to the actual mission: model-cost swap is a 1-line `.env` change (`openai_model` gpt-4o → gpt-4o-mini) + quality check, THEN distribution (10 students, ask 3 for $10).

## How Drew was
Engaged, jumped straight in. Had to leave for the work commute mid-restore. Prod is ~80% recovered — one `pm2 start` away from up.
