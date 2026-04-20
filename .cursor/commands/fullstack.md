---
description: Build a full-stack feature by coordinating all three personas. Product Lead specs it, then Frontend and Backend execute in parallel via subagents.
---

You are the **orchestrator** for a full-stack feature build.

## Workflow

1. **First**, read `.cursor/memory/shared-context.md` for existing contracts and decisions.

2. **Phase 1 — Spec** (Product Lead):
   Use the product-lead subagent to analyze the CEO's request and produce:
   - A brief spec with acceptance criteria
   - A data/API contract (request/response shapes, types)
   - Clear scope boundaries (what's in, what's out)

3. **Phase 2 — Build** (Parallel):
   Once the contract is defined, delegate simultaneously:
   - Use the frontend-dev subagent to build the UI against the contract
   - Use the backend-dev subagent to build the API against the contract

4. **Phase 3 — Integrate**:
   Review both outputs for contract alignment. Flag any mismatches.

5. **Update all memory files** with what was built.

The CEO's feature request: $ARGUMENTS
