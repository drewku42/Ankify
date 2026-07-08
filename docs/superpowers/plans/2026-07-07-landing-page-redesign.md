# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare `/login` screen with a real "Editorial Bold" landing page that sells Ankify's one real capability (PDF lecture slides → atomic Anki cards → `.apkg` export), built as a shared component library plus three layout variations in separate worktrees for comparison.

**Architecture:** Build a small, focused library of landing components (`PdfToCardsVisual`, `SignInCTA`, `LandingHero`, `HowItWorks`, `SampleCard`) plus a landing-scoped SCSS token/style partial on a shared baseline branch. Then create three sibling git worktrees that each wire one composition (Minimal / Standard / Long editorial scroll) into the existing `/login` route via `LoginPage`. The auth flow is untouched — the redesign is presentational over the same Google sign-in.

**Tech Stack:** React 19, Vite 6, TypeScript 5.7, SCSS (BEM + CSS custom properties), react-router-dom v7, Redux Toolkit. Tests via Vitest + React Testing Library + jsdom (added by this plan; none exist today).

## Global Constraints

- **Framework/versions:** React `^19`, Vite `^6`, TypeScript `^5.7`, SCSS via `sass`. No Tailwind, no new UI framework.
- **Path alias:** import from `@/…` (maps to `frontend/src/*`, configured in `vite.config.ts` and `tsconfig.json`).
- **Auth wiring must be preserved exactly:** Google login navigates via `window.location.href = ${API_URL}/auth/google`; a DEV-only ("Dev Login") button POSTs to `${API_URL}/auth/dev-login`, dispatches `setCredentials`, calls `api.util.resetApiState()`, and navigates to `/`. `API_URL` comes from `@/config`.
- **Landing palette tokens (exact):** ink `#12140f`, off-white bg `#f4f5f0`, emerald `#0f7a52`, chartreuse `#c6f26b`, muted body `#4a4d43`, panel border `#d9ddd0`.
- **Type:** display = `"Helvetica Neue", ui-sans-serif, system-ui` weight 800, tracking `-0.035em`; mono label = `ui-monospace`.
- **Style isolation:** all landing styles live under a `.landing` root class in `frontend/src/styles/landing.scss`. Do NOT modify the authed app's existing tokens in `global.scss`.
- **Copy is fixed by the spec:** headline "Stop making cards by hand. Ankify it." (chartreuse mark on "Ankify it."); kicker "01 — LECTURE PDF → ANKI"; CTA "Continue with Google"; export note "✓ Exports to .apkg". Do not overpromise a card studio, pricing, or review features.
- **Commit style:** end commit messages with the two trailer lines used in this repo (`Co-Authored-By:` and `Claude-Session:`).
- **No return-type annotations on components:** match the existing codebase (`App.tsx`, `LoginPage.tsx` don't annotate) and avoid React 19 `@types/react` global-`JSX`-namespace issues — let TypeScript infer component return types (do not write `: JSX.Element`).

---

## Part A — Shared foundation (baseline branch `worktree-landing-redesign`)

All Part A tasks run in the current worktree at
`/Users/drewmeyer/Projects/ankify/.claude/worktrees/landing-redesign`. Work inside
`frontend/`. Do NOT modify `App.tsx` or `LoginPage.tsx` in Part A — the baseline must
keep compiling and the old login must keep working until a variation wires itself in.

### Task 1: Test tooling + landing SCSS tokens

**Files:**
- Modify: `frontend/package.json` (add devDeps + `test` script)
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/styles/landing.scss`
- Modify: `frontend/src/main.tsx` (import `landing.scss`)
- Test: `frontend/src/test/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `yarn test` (Vitest, jsdom env, `@testing-library/jest-dom` matchers, `@/` alias resolvable in tests); the `.landing` style scope with all CSS custom properties above.

- [ ] **Step 1: Install test dependencies**

Run:
```bash
cd frontend
yarn add -D vitest@^2 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14
```
Expected: packages added to `devDependencies`.

- [ ] **Step 2: Add the `test` script to `package.json`**

In `frontend/package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `frontend/vitest.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
```

- [ ] **Step 4: Create `frontend/src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Write a smoke test that fails**

Create `frontend/src/test/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("runs and has jest-dom matchers", () => {
    const el = document.createElement("div");
    el.textContent = "ok";
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("ok");
  });
});
```

- [ ] **Step 6: Run the smoke test**

Run: `yarn test`
Expected: PASS (1 test). If `toBeInTheDocument` is not a function, setup import is wrong — fix Step 4.

- [ ] **Step 7: Create the landing SCSS token/base partial**

Create `frontend/src/styles/landing.scss`:
```scss
.landing {
  --l-ink: #12140f;
  --l-bg: #f4f5f0;
  --l-emerald: #0f7a52;
  --l-chartreuse: #c6f26b;
  --l-muted: #4a4d43;
  --l-border: #d9ddd0;
  --l-display: "Helvetica Neue", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --l-mono: ui-monospace, "SFMono-Regular", Menlo, monospace;

  min-height: 100vh;
  background: var(--l-bg);
  color: var(--l-ink);
  font-family: var(--l-display);
  -webkit-font-smoothing: antialiased;

  &__kicker {
    font: 700 0.75rem/1 var(--l-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--l-emerald);
    margin: 0 0 1rem;
  }

  &__mark {
    background: var(--l-chartreuse);
    color: var(--l-ink);
    padding: 0 0.3em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }

  &__subcopy {
    color: var(--l-muted);
    font-size: 1rem;
    max-width: 26rem;
    margin: 0 0 1.5rem;
    line-height: 1.5;
  }
}
```

- [ ] **Step 8: Import the partial in `main.tsx`**

In `frontend/src/main.tsx`, add after the `global.scss` import line:
```ts
import "@/styles/landing.scss";
```

- [ ] **Step 9: Verify build still compiles**

Run: `yarn build`
Expected: `tsc -b` and `vite build` succeed with no errors.

- [ ] **Step 10: Commit**

```bash
git add frontend/package.json frontend/yarn.lock frontend/vitest.config.ts \
  frontend/src/test/setup.ts frontend/src/test/smoke.test.ts \
  frontend/src/styles/landing.scss frontend/src/main.tsx
git commit -m "chore(frontend): add vitest harness and landing style tokens

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T4DXMWpQsiUYSk3VcRDRin"
```

---

### Task 2: `PdfToCardsVisual` component

The signature hero graphic: fanned PDF pages (labeled "PDF") → arrow → fanned Anki cards.

**Files:**
- Create: `frontend/src/components/landing/PdfToCardsVisual.tsx`
- Modify: `frontend/src/styles/landing.scss` (append `&__flow`, `&__fan`, `&__page`, `&__pdfcard` blocks)
- Test: `frontend/src/components/landing/__tests__/PdfToCardsVisual.test.tsx`

**Interfaces:**
- Consumes: `.landing` scope (Task 1).
- Produces: `export function PdfToCardsVisual(): JSX.Element` — renders a container with class `landing__flow`, an element with text `PDF`, an arrow, and three sample cards each containing a `Q ·` label. Takes no props.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/landing/__tests__/PdfToCardsVisual.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { PdfToCardsVisual } from "@/components/landing/PdfToCardsVisual";

describe("PdfToCardsVisual", () => {
  it("labels the source as a PDF", () => {
    render(<PdfToCardsVisual />);
    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  it("renders generated cards with question labels", () => {
    render(<PdfToCardsVisual />);
    const qs = screen.getAllByText(/^Q ·/);
    expect(qs.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/landing/__tests__/PdfToCardsVisual.test.tsx`
Expected: FAIL — cannot resolve module `PdfToCardsVisual`.

- [ ] **Step 3: Write the component**

Create `frontend/src/components/landing/PdfToCardsVisual.tsx`:
```tsx
const CARDS = [
  { q: "Q · Site of ATP synthesis?", a: "Mitochondrion" },
  { q: "Q · ATP stands for?", a: "Adenosine triphosphate" },
  { q: "Q · Where in the cell?", a: "Inner membrane" },
];

export function PdfToCardsVisual() {
  return (
    <div className="landing__flow" aria-hidden="true">
      <div className="landing__fan">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`landing__page landing__page--p${i + 1}`}>
            <span className="landing__ln landing__ln--m" />
            <span className="landing__ln" />
            <span className="landing__ln landing__ln--s" />
          </div>
        ))}
        <div className="landing__page landing__page--p4">
          <span className="landing__pdftag">PDF</span>
          <span className="landing__ln landing__ln--m" />
          <span className="landing__ln" />
          <span className="landing__ln landing__ln--s" />
        </div>
      </div>

      <div className="landing__arrow">→</div>

      <div className="landing__fan">
        {CARDS.map((c, i) => (
          <div key={i} className={`landing__pdfcard landing__pdfcard--c${i + 1}`}>
            <span className="landing__pdfcard-q">{c.q}</span>
            <span className="landing__pdfcard-a">{c.a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Note: `getByText("PDF")` matches the `landing__pdftag` span; `getAllByText(/^Q ·/)` matches the three `landing__pdfcard-q` spans. The `aria-hidden` is fine — Testing Library still finds the text nodes.

- [ ] **Step 4: Append styles to `landing.scss`**

Append inside the `.landing { … }` block in `frontend/src/styles/landing.scss`:
```scss
  &__flow {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-shrink: 0;
  }

  &__fan {
    position: relative;
    width: 170px;
    height: 150px;
  }

  &__arrow {
    font: 800 1.6rem/1 var(--l-display);
    color: var(--l-emerald);
  }

  &__page {
    position: absolute;
    bottom: 0;
    left: 35px;
    width: 100px;
    height: 132px;
    background: #fff;
    border: 1px solid var(--l-border);
    border-radius: 6px;
    box-shadow: var(--shadow-md, 0 6px 16px rgba(0, 0, 0, 0.08));
    transform-origin: bottom center;

    &--p1 { transform: rotate(-16deg) translateX(-6px); }
    &--p2 { transform: rotate(-6deg); }
    &--p3 { transform: rotate(4deg) translateX(4px); }
    &--p4 { transform: rotate(14deg) translateX(8px); z-index: 3; }
    // the PDF tag is absolutely positioned; push the first line below it.
    // Target the --m modifier (the first line in p4) rather than :first-of-type,
    // since the absolutely-positioned .landing__pdftag is the first <span> child.
    &--p4 .landing__ln--m { margin-top: 34px; }
  }

  &__pdftag {
    position: absolute;
    top: 9px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--l-emerald);
    color: #eaffef;
    font: 800 0.7rem/1 var(--l-display);
    letter-spacing: 0.12em;
    padding: 5px 10px;
    border-radius: 4px;
  }

  &__ln {
    display: block;
    height: 5px;
    background: #e6e9de;
    border-radius: 3px;
    margin: 9px 12px 0;
    &--s { width: 52%; }
    &--m { width: 74%; }
  }

  &__pdfcard {
    position: absolute;
    bottom: 0;
    left: 20px;
    width: 120px;
    height: 78px;
    background: var(--l-ink);
    border-radius: 9px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
    padding: 11px 12px;
    box-sizing: border-box;
    transform-origin: bottom center;
    color: #eef2e6;

    &--c1 { transform: rotate(-14deg) translateX(-4px); }
    &--c2 { transform: rotate(-2deg); }
    &--c3 { transform: rotate(11deg) translateX(6px); z-index: 3; }
  }

  &__pdfcard-q {
    display: block;
    color: var(--l-chartreuse);
    font: 700 0.56rem/1.2 var(--l-display);
    letter-spacing: 0.03em;
    margin-bottom: 6px;
  }

  &__pdfcard-a {
    font: 600 0.62rem/1.25 var(--l-display);
    color: #dfe4d6;
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test src/components/landing/__tests__/PdfToCardsVisual.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/landing/PdfToCardsVisual.tsx \
  frontend/src/components/landing/__tests__/PdfToCardsVisual.test.tsx \
  frontend/src/styles/landing.scss
git commit -m "feat(landing): add PdfToCardsVisual signature hero graphic

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T4DXMWpQsiUYSk3VcRDRin"
```

---

### Task 3: `SignInCTA` component (auth wiring — behavioral)

Owns the Google sign-in + DEV dev-login logic (ported verbatim from `LoginPage`) plus the `.apkg` export note. This is the one component with real behavior; test it.

**Files:**
- Create: `frontend/src/components/landing/SignInCTA.tsx`
- Modify: `frontend/src/styles/landing.scss` (append `&__cta`, `&__btn`, `&__export`, `&__dev` blocks)
- Test: `frontend/src/components/landing/__tests__/SignInCTA.test.tsx`

**Interfaces:**
- Consumes: `useAppDispatch` from `@/store/hooks`, `setCredentials` from `@/store/authSlice`, `api` from `@/store/api`, `API_URL` from `@/config`, `useNavigate`/`toast`.
- Produces: `export function SignInCTA({ showExportNote }: SignInCTAProps): JSX.Element` where `interface SignInCTAProps { showExportNote?: boolean }` (default `true`). Renders a button with accessible name "Continue with Google" that sets `window.location.href = ${API_URL}/auth/google`; when `showExportNote` is true also renders text "✓ Exports to .apkg"; in DEV renders a "Dev Login" button.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/landing/__tests__/SignInCTA.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { SignInCTA } from "@/components/landing/SignInCTA";
import { API_URL } from "@/config";

function renderCTA(props = {}) {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <SignInCTA {...props} />
      </MemoryRouter>
    </Provider>,
  );
}

describe("SignInCTA", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("redirects to the Google auth endpoint on click", async () => {
    renderCTA();
    await userEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    expect(window.location.href).toBe(`${API_URL}/auth/google`);
  });

  it("shows the .apkg export note by default", () => {
    renderCTA();
    expect(screen.getByText(/exports to/i)).toHaveTextContent(".apkg");
  });

  it("hides the export note when showExportNote is false", () => {
    renderCTA({ showExportNote: false });
    expect(screen.queryByText(/exports to/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/landing/__tests__/SignInCTA.test.tsx`
Expected: FAIL — cannot resolve module `SignInCTA`.

- [ ] **Step 3: Write the component**

Create `frontend/src/components/landing/SignInCTA.tsx`:
```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { api } from "@/store/api";
import { API_URL } from "@/config";

interface SignInCTAProps {
  showExportNote?: boolean;
}

export function SignInCTA({ showExportNote = true }: SignInCTAProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/dev-login`, { method: "POST" });
      if (!res.ok) throw new Error("Dev login failed");
      const data = await res.json();
      dispatch(setCredentials({ user: data.user, token: data.token }));
      dispatch(api.util.resetApiState());
      navigate("/", { replace: true });
    } catch {
      toast.error("Dev login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="landing__cta">
      <button className="landing__btn" onClick={handleGoogleLogin}>
        Continue with Google
      </button>
      {showExportNote && (
        <span className="landing__export">
          ✓ Exports to <b>.apkg</b>
        </span>
      )}
      {import.meta.env.DEV && (
        <button
          className="landing__dev"
          onClick={handleDevLogin}
          disabled={isLoading}
        >
          {isLoading ? "Signing in…" : "Dev Login"}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Append styles to `landing.scss`**

Append inside `.landing { … }`:
```scss
  &__cta {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__btn {
    background: var(--l-ink);
    color: var(--l-bg);
    border: none;
    padding: 0.875rem 1.625rem;
    font: 700 0.8125rem/1 var(--l-display);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.15s;
    &:hover { opacity: 0.88; }
  }

  &__export {
    font: 600 0.75rem/1.4 var(--l-display);
    color: var(--l-emerald);
    b { color: var(--l-ink); }
  }

  &__dev {
    background: transparent;
    border: 1px solid var(--l-border);
    color: var(--l-muted);
    padding: 0.5rem 0.875rem;
    font: 600 0.75rem/1 var(--l-display);
    cursor: pointer;
    &:disabled { opacity: 0.5; }
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test src/components/landing/__tests__/SignInCTA.test.tsx`
Expected: PASS (3 tests). (DEV button renders under Vitest since `import.meta.env.DEV` is true in test mode; tests don't assert on it, so this is fine.)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/landing/SignInCTA.tsx \
  frontend/src/components/landing/__tests__/SignInCTA.test.tsx \
  frontend/src/styles/landing.scss
git commit -m "feat(landing): add SignInCTA with preserved google + dev auth

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T4DXMWpQsiUYSk3VcRDRin"
```

---

### Task 4: `LandingHero` component

Composes kicker + headline + subcopy + `SignInCTA` + `PdfToCardsVisual`.

**Files:**
- Create: `frontend/src/components/landing/LandingHero.tsx`
- Modify: `frontend/src/styles/landing.scss` (append `&__hero`, `&__hero-copy`, `&__headline` blocks)
- Test: `frontend/src/components/landing/__tests__/LandingHero.test.tsx`

**Interfaces:**
- Consumes: `SignInCTA` (Task 3), `PdfToCardsVisual` (Task 2).
- Produces: `export function LandingHero(): JSX.Element` — renders a `<section className="landing__hero">` containing an `<h1>` with accessible text "Stop making cards by hand. Ankify it." and the kicker "01 — LECTURE PDF → ANKI". Takes no props. Must be rendered within a Redux `<Provider>` and a router (because of `SignInCTA`).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/landing/__tests__/LandingHero.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { LandingHero } from "@/components/landing/LandingHero";

describe("LandingHero", () => {
  it("renders the headline and kicker", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <LandingHero />
        </MemoryRouter>
      </Provider>,
    );
    expect(
      screen.getByRole("heading", { name: /stop making cards/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/lecture pdf → anki/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/landing/__tests__/LandingHero.test.tsx`
Expected: FAIL — cannot resolve module `LandingHero`.

- [ ] **Step 3: Write the component**

Create `frontend/src/components/landing/LandingHero.tsx`:
```tsx
import { SignInCTA } from "@/components/landing/SignInCTA";
import { PdfToCardsVisual } from "@/components/landing/PdfToCardsVisual";

export function LandingHero() {
  return (
    <section className="landing__hero">
      <div className="landing__hero-copy">
        <p className="landing__kicker">01 — Lecture PDF → Anki</p>
        <h1 className="landing__headline">
          Stop making cards
          <br />
          by hand. <span className="landing__mark">Ankify it.</span>
        </h1>
        <p className="landing__subcopy">
          Upload your lecture slides. Ankify writes clean, atomic flashcards and
          exports them straight to Anki.
        </p>
        <SignInCTA />
      </div>
      <PdfToCardsVisual />
    </section>
  );
}
```

Note: the `<h1>` accessible name concatenates its text nodes to "Stop making cards by hand. Ankify it." (the `<br>` collapses to a space), which the test regex matches.

- [ ] **Step 4: Append styles to `landing.scss`**

Append inside `.landing { … }`:
```scss
  &__hero {
    display: flex;
    align-items: center;
    gap: 2.75rem;
    max-width: 1080px;
    margin: 0 auto;
    padding: 4.5rem 3rem;
    flex-wrap: wrap;
  }

  &__hero-copy {
    flex: 1;
    min-width: 300px;
  }

  &__headline {
    font: 800 clamp(2.25rem, 5vw, 2.875rem) / 0.97 var(--l-display);
    letter-spacing: -0.035em;
    margin: 0 0 1.125rem;
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test src/components/landing/__tests__/LandingHero.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/landing/LandingHero.tsx \
  frontend/src/components/landing/__tests__/LandingHero.test.tsx \
  frontend/src/styles/landing.scss
git commit -m "feat(landing): add LandingHero composition

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T4DXMWpQsiUYSk3VcRDRin"
```

---

### Task 5: `HowItWorks` component

Three-step explainer: upload PDF → AI writes atomic cards → export to Anki.

**Files:**
- Create: `frontend/src/components/landing/HowItWorks.tsx`
- Modify: `frontend/src/styles/landing.scss` (append `&__how`, `&__steps`, `&__step` blocks)
- Test: `frontend/src/components/landing/__tests__/HowItWorks.test.tsx`

**Interfaces:**
- Consumes: `.landing` scope.
- Produces: `export function HowItWorks(): JSX.Element` — renders a `<section className="landing__how">` with exactly three step items, each with a numbered label (`01`/`02`/`03`) and a heading. Takes no props.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/landing/__tests__/HowItWorks.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { HowItWorks } from "@/components/landing/HowItWorks";

describe("HowItWorks", () => {
  it("renders three numbered steps", () => {
    render(<HowItWorks />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText(/export/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/landing/__tests__/HowItWorks.test.tsx`
Expected: FAIL — cannot resolve module `HowItWorks`.

- [ ] **Step 3: Write the component**

Create `frontend/src/components/landing/HowItWorks.tsx`:
```tsx
const STEPS = [
  {
    n: "01",
    title: "Upload your slides",
    body: "Drop in a lecture PDF — a single deck or a whole semester.",
  },
  {
    n: "02",
    title: "Ankify writes the cards",
    body: "AI distills each slide into clean, atomic, high-yield flashcards.",
  },
  {
    n: "03",
    title: "Export to Anki",
    body: "Download a ready-to-import .apkg and study in the app you already use.",
  },
];

export function HowItWorks() {
  return (
    <section className="landing__how">
      <p className="landing__kicker">How it works</p>
      <div className="landing__steps">
        {STEPS.map((s) => (
          <div key={s.n} className="landing__step">
            <span className="landing__step-n">{s.n}</span>
            <h3 className="landing__step-title">{s.title}</h3>
            <p className="landing__step-body">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Append styles to `landing.scss`**

Append inside `.landing { … }`:
```scss
  &__how {
    max-width: 1080px;
    margin: 0 auto;
    padding: 3rem 3rem 4.5rem;
  }

  &__steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.75rem;
    margin-top: 1.5rem;
  }

  &__step {
    border-top: 2px solid var(--l-ink);
    padding-top: 1rem;
  }

  &__step-n {
    font: 700 0.75rem/1 var(--l-mono);
    letter-spacing: 0.12em;
    color: var(--l-emerald);
  }

  &__step-title {
    font: 800 1.25rem/1.1 var(--l-display);
    letter-spacing: -0.02em;
    margin: 0.75rem 0 0.5rem;
  }

  &__step-body {
    color: var(--l-muted);
    font-size: 0.9375rem;
    line-height: 1.5;
    margin: 0;
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test src/components/landing/__tests__/HowItWorks.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/landing/HowItWorks.tsx \
  frontend/src/components/landing/__tests__/HowItWorks.test.tsx \
  frontend/src/styles/landing.scss
git commit -m "feat(landing): add HowItWorks three-step section

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T4DXMWpQsiUYSk3VcRDRin"
```

---

### Task 6: `SampleCard` component

A beautifully typeset generated card to showcase card craft.

**Files:**
- Create: `frontend/src/components/landing/SampleCard.tsx`
- Modify: `frontend/src/styles/landing.scss` (append `&__sample*` blocks)
- Test: `frontend/src/components/landing/__tests__/SampleCard.test.tsx`

**Interfaces:**
- Consumes: `.landing` scope.
- Produces: `export function SampleCard({ question, answer }: SampleCardProps): JSX.Element` where `interface SampleCardProps { question: string; answer: string }`. Renders the question and answer text and a "GENERATED CARD" label.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/landing/__tests__/SampleCard.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { SampleCard } from "@/components/landing/SampleCard";

describe("SampleCard", () => {
  it("renders the question and answer passed in", () => {
    render(<SampleCard question="What makes ATP?" answer="Mitochondria" />);
    expect(screen.getByText("What makes ATP?")).toBeInTheDocument();
    expect(screen.getByText("Mitochondria")).toBeInTheDocument();
    expect(screen.getByText(/generated card/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/landing/__tests__/SampleCard.test.tsx`
Expected: FAIL — cannot resolve module `SampleCard`.

- [ ] **Step 3: Write the component**

Create `frontend/src/components/landing/SampleCard.tsx`:
```tsx
interface SampleCardProps {
  question: string;
  answer: string;
}

export function SampleCard({ question, answer }: SampleCardProps) {
  return (
    <div className="landing__sample">
      <div className="landing__sample-top">Generated card</div>
      <div className="landing__sample-body">
        <p className="landing__sample-q">{question}</p>
        <div className="landing__sample-divider" />
        <p className="landing__sample-a">{answer}</p>
      </div>
      <div className="landing__sample-foot">✦ atomic · exportable to Anki</div>
    </div>
  );
}
```

- [ ] **Step 4: Append styles to `landing.scss`**

Append inside `.landing { … }`:
```scss
  &__sample {
    width: 100%;
    max-width: 320px;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.13);
    overflow: hidden;
    border: 1px solid var(--l-border);
  }

  &__sample-top {
    background: var(--l-ink);
    color: var(--l-chartreuse);
    padding: 0.6rem 0.9rem;
    font: 700 0.625rem/1 var(--l-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  &__sample-body { padding: 1rem 1rem 1.125rem; }

  &__sample-q {
    font: 700 0.9375rem/1.25 var(--l-display);
    color: var(--l-ink);
    margin: 0 0 0.75rem;
  }

  &__sample-divider {
    height: 1px;
    background: #eceee6;
    margin: 0 0 0.75rem;
  }

  &__sample-a {
    font: 500 0.8125rem/1.35 var(--l-display);
    color: var(--l-muted);
    margin: 0;
  }

  &__sample-foot {
    padding: 0 1rem 0.875rem;
    font: 600 0.625rem/1 var(--l-display);
    color: var(--l-emerald);
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test src/components/landing/__tests__/SampleCard.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Run the full suite + build, then commit**

Run: `yarn test && yarn build`
Expected: all landing tests + smoke test PASS; build succeeds.
```bash
git add frontend/src/components/landing/SampleCard.tsx \
  frontend/src/components/landing/__tests__/SampleCard.test.tsx \
  frontend/src/styles/landing.scss
git commit -m "feat(landing): add SampleCard showcase component

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T4DXMWpQsiUYSk3VcRDRin"
```

- [ ] **Step 7: Push the baseline branch**

```bash
git push -u origin worktree-landing-redesign
```
Expected: branch pushed. This baseline (shared library) is what all three variation worktrees branch from.

---

## Part B — Three variation worktrees

Each variation is a thin page that composes the shared blocks and wires itself into
`/login` by making `LoginPage` render it. Each lives in its own worktree branched from
the baseline branch `worktree-landing-redesign` (NOT from `main`, so it inherits the
shared library). Create each with native git worktree from the main repo root.

**Repo root:** `/Users/drewmeyer/Projects/ankify`
**Worktree parent dir:** `/Users/drewmeyer/Projects/ankify/.claude/worktrees`

For each variation, the `LoginPage` change is identical in shape:
```tsx
// frontend/src/pages/LoginPage.tsx
import { <VariationName> } from "@/pages/landings/<VariationName>";

export default function LoginPage() {
  return <<VariationName> />;
}
```

Verification for each variation is **visual** (the payoff is look-and-feel): run
`yarn dev` in that worktree's `frontend/` and open `http://localhost:5173/login`.
Confirm: headline + chartreuse mark render, the PDF→cards visual shows the "PDF" tag
and three cards, "Continue with Google" and "✓ Exports to .apkg" appear, and clicking
Google navigates to the auth endpoint. Run `yarn test && yarn build` before committing.

### Task 7: Variation A — Minimal

**Files:**
- Create worktree: branch `landing-minimal`
- Create: `frontend/src/pages/landings/MinimalLanding.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`
- Test: `frontend/src/pages/landings/__tests__/MinimalLanding.test.tsx`

**Interfaces:**
- Consumes: `LandingHero` (Task 4).
- Produces: `export function MinimalLanding(): JSX.Element` — a single-screen page: `<main className="landing">` wrapping `<LandingHero />`.

- [ ] **Step 1: Create the worktree from the baseline branch**

```bash
git -C /Users/drewmeyer/Projects/ankify worktree add -b landing-minimal \
  /Users/drewmeyer/Projects/ankify/.claude/worktrees/landing-minimal \
  worktree-landing-redesign
```
Then do all remaining steps in `/Users/drewmeyer/Projects/ankify/.claude/worktrees/landing-minimal/frontend`.

- [ ] **Step 2: Write the failing test**

Create `frontend/src/pages/landings/__tests__/MinimalLanding.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { MinimalLanding } from "@/pages/landings/MinimalLanding";

describe("MinimalLanding", () => {
  it("renders the hero with the CTA", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <MinimalLanding />
        </MemoryRouter>
      </Provider>,
    );
    expect(
      screen.getByRole("heading", { name: /stop making cards/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn test src/pages/landings/__tests__/MinimalLanding.test.tsx`
Expected: FAIL — cannot resolve module `MinimalLanding`.

- [ ] **Step 4: Write the page**

Create `frontend/src/pages/landings/MinimalLanding.tsx`:
```tsx
import { LandingHero } from "@/components/landing/LandingHero";

export function MinimalLanding() {
  return (
    <main className="landing landing--minimal">
      <LandingHero />
    </main>
  );
}
```

- [ ] **Step 5: Wire it into `LoginPage`**

Replace the entire contents of `frontend/src/pages/LoginPage.tsx` with:
```tsx
import { MinimalLanding } from "@/pages/landings/MinimalLanding";

export default function LoginPage() {
  return <MinimalLanding />;
}
```

- [ ] **Step 6: Run test + build**

Run: `yarn test src/pages/landings/__tests__/MinimalLanding.test.tsx && yarn build`
Expected: PASS + build succeeds.

- [ ] **Step 7: Visual check**

Run: `yarn dev`, open `http://localhost:5173/login`. Confirm the checklist in the Part B intro. Stop the dev server when done.

- [ ] **Step 8: Commit + push**

```bash
git add frontend/src/pages/landings/MinimalLanding.tsx \
  frontend/src/pages/landings/__tests__/MinimalLanding.test.tsx \
  frontend/src/pages/LoginPage.tsx
git commit -m "feat(landing): minimal single-screen variation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T4DXMWpQsiUYSk3VcRDRin"
git push -u origin landing-minimal
```

- [ ] **Step 9: Open draft PR**

```bash
gh pr create --draft --base main --head landing-minimal \
  --title "Landing redesign — Minimal variation" \
  --body "$(cat <<'EOF'
Editorial-Bold landing, minimal single-screen composition (hero + sign-in).
One of three layout variations for comparison. See
docs/superpowers/specs/2026-07-07-landing-page-redesign-design.md.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

### Task 8: Variation B — Standard landing

**Files:**
- Create worktree: branch `landing-standard`
- Create: `frontend/src/pages/landings/StandardLanding.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`
- Test: `frontend/src/pages/landings/__tests__/StandardLanding.test.tsx`

**Interfaces:**
- Consumes: `LandingHero` (Task 4), `HowItWorks` (Task 5), `SampleCard` (Task 6), `SignInCTA` (Task 3).
- Produces: `export function StandardLanding(): JSX.Element` — hero → how-it-works → sample-card showcase → footer CTA.

- [ ] **Step 1: Create the worktree from the baseline branch**

```bash
git -C /Users/drewmeyer/Projects/ankify worktree add -b landing-standard \
  /Users/drewmeyer/Projects/ankify/.claude/worktrees/landing-standard \
  worktree-landing-redesign
```
Do remaining steps in `.claude/worktrees/landing-standard/frontend`.

- [ ] **Step 2: Write the failing test**

Create `frontend/src/pages/landings/__tests__/StandardLanding.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { StandardLanding } from "@/pages/landings/StandardLanding";

describe("StandardLanding", () => {
  it("renders hero, how-it-works, a sample card, and a footer CTA", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <StandardLanding />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: /stop making cards/i })).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText(/generated card/i)).toBeInTheDocument();
    // hero CTA + footer CTA => two Google buttons
    expect(screen.getAllByRole("button", { name: /continue with google/i }).length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn test src/pages/landings/__tests__/StandardLanding.test.tsx`
Expected: FAIL — cannot resolve module `StandardLanding`.

- [ ] **Step 4: Write the page**

Create `frontend/src/pages/landings/StandardLanding.tsx`:
```tsx
import { LandingHero } from "@/components/landing/LandingHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SampleCard } from "@/components/landing/SampleCard";
import { SignInCTA } from "@/components/landing/SignInCTA";

export function StandardLanding() {
  return (
    <main className="landing landing--standard">
      <LandingHero />
      <HowItWorks />
      <section className="landing__showcase">
        <div className="landing__showcase-copy">
          <p className="landing__kicker">The output</p>
          <h2 className="landing__showcase-title">
            Cards that follow real spaced-repetition principles.
          </h2>
          <p className="landing__subcopy">
            Atomic, minimal, one idea per card — the way high-yield decks are built.
          </p>
        </div>
        <SampleCard
          question="What organelle is the site of ATP synthesis?"
          answer="The mitochondrion — via oxidative phosphorylation on the inner membrane."
        />
      </section>
      <footer className="landing__footer">
        <h2 className="landing__footer-title">Turn your next lecture into a deck.</h2>
        <SignInCTA />
      </footer>
    </main>
  );
}
```

- [ ] **Step 5: Append styles to `landing.scss`**

Append inside `.landing { … }` in `frontend/src/styles/landing.scss`:
```scss
  &__showcase {
    display: flex;
    align-items: center;
    gap: 2.75rem;
    max-width: 1080px;
    margin: 0 auto;
    padding: 3rem 3rem 4.5rem;
    flex-wrap: wrap;
  }

  &__showcase-copy { flex: 1; min-width: 280px; }

  &__showcase-title {
    font: 800 1.75rem/1.1 var(--l-display);
    letter-spacing: -0.025em;
    margin: 0.75rem 0 0.75rem;
    max-width: 22rem;
  }

  &__footer {
    background: var(--l-ink);
    color: var(--l-bg);
    text-align: center;
    padding: 4rem 3rem;

    .landing__footer-title {
      font: 800 2rem/1.1 var(--l-display);
      letter-spacing: -0.03em;
      margin: 0 0 1.75rem;
    }
    .landing__cta { justify-content: center; }
    .landing__export { color: var(--l-chartreuse); b { color: var(--l-bg); } }
    .landing__btn { background: var(--l-chartreuse); color: var(--l-ink); }
  }
```

- [ ] **Step 6: Wire into `LoginPage`**

Replace the entire contents of `frontend/src/pages/LoginPage.tsx` with:
```tsx
import { StandardLanding } from "@/pages/landings/StandardLanding";

export default function LoginPage() {
  return <StandardLanding />;
}
```

- [ ] **Step 7: Run test + build**

Run: `yarn test src/pages/landings/__tests__/StandardLanding.test.tsx && yarn build`
Expected: PASS + build succeeds.

- [ ] **Step 8: Visual check**

Run: `yarn dev`, open `http://localhost:5173/login`. Confirm the Part B checklist plus: three steps, the sample card, and a dark footer with a chartreuse CTA. Stop the server.

- [ ] **Step 9: Commit + push + draft PR**

```bash
git add frontend/src/pages/landings/StandardLanding.tsx \
  frontend/src/pages/landings/__tests__/StandardLanding.test.tsx \
  frontend/src/pages/LoginPage.tsx frontend/src/styles/landing.scss
git commit -m "feat(landing): standard full-landing variation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T4DXMWpQsiUYSk3VcRDRin"
git push -u origin landing-standard
gh pr create --draft --base main --head landing-standard \
  --title "Landing redesign — Standard variation" \
  --body "$(cat <<'EOF'
Editorial-Bold landing, full composition: hero + how-it-works + sample-card
showcase + footer CTA. One of three layout variations for comparison.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

### Task 9: Variation C — Long editorial scroll

A narrative scroll with big type moments and a scroll-reveal of the transformation.

**Files:**
- Create worktree: branch `landing-editorial`
- Create: `frontend/src/hooks/useRevealOnScroll.ts`
- Create: `frontend/src/pages/landings/EditorialLanding.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/styles/landing.scss` (append `&__editorial*`, `&__reveal` blocks)
- Test: `frontend/src/pages/landings/__tests__/EditorialLanding.test.tsx`

**Interfaces:**
- Consumes: `LandingHero` (Task 4), `HowItWorks` (Task 5), `SampleCard` (Task 6), `SignInCTA` (Task 3), `PdfToCardsVisual` (Task 2).
- Produces: `export function EditorialLanding(): JSX.Element`; `export function useRevealOnScroll(): (el: HTMLElement | null) => void` — a ref callback that adds class `is-visible` when the element scrolls into view via IntersectionObserver.

- [ ] **Step 1: Create the worktree from the baseline branch**

```bash
git -C /Users/drewmeyer/Projects/ankify worktree add -b landing-editorial \
  /Users/drewmeyer/Projects/ankify/.claude/worktrees/landing-editorial \
  worktree-landing-redesign
```
Do remaining steps in `.claude/worktrees/landing-editorial/frontend`.

- [ ] **Step 2: Write the failing test**

Create `frontend/src/pages/landings/__tests__/EditorialLanding.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/store";
import { EditorialLanding } from "@/pages/landings/EditorialLanding";

beforeAll(() => {
  // jsdom has no IntersectionObserver
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test shim
  globalThis.IntersectionObserver = IO;
});

describe("EditorialLanding", () => {
  it("renders the narrative with a closing CTA", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <EditorialLanding />
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByRole("heading", { name: /stop making cards/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /continue with google/i }).length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `yarn test src/pages/landings/__tests__/EditorialLanding.test.tsx`
Expected: FAIL — cannot resolve module `EditorialLanding`.

- [ ] **Step 4: Write the reveal hook**

Create `frontend/src/hooks/useRevealOnScroll.ts`:
```ts
import { useCallback, useRef } from "react";

export function useRevealOnScroll(): (el: HTMLElement | null) => void {
  const observed = useRef<WeakSet<HTMLElement>>(new WeakSet());

  return useCallback((el: HTMLElement | null) => {
    if (!el || observed.current.has(el)) return;
    observed.current.add(el);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    io.observe(el);
  }, []);
}
```

- [ ] **Step 5: Write the page**

Create `frontend/src/pages/landings/EditorialLanding.tsx`:
```tsx
import { LandingHero } from "@/components/landing/LandingHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SampleCard } from "@/components/landing/SampleCard";
import { SignInCTA } from "@/components/landing/SignInCTA";
import { PdfToCardsVisual } from "@/components/landing/PdfToCardsVisual";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

export function EditorialLanding() {
  const reveal = useRevealOnScroll();

  return (
    <main className="landing landing--editorial">
      <LandingHero />

      <section ref={reveal} className="landing__editorial-statement landing__reveal">
        <p className="landing__kicker">The problem</p>
        <p className="landing__editorial-lead">
          Great decks take hours to write. So most people never make them —
          or make bad ones.
        </p>
      </section>

      <section ref={reveal} className="landing__editorial-transform landing__reveal">
        <PdfToCardsVisual />
        <p className="landing__editorial-caption">
          Your lecture PDF, distilled into atomic cards — automatically.
        </p>
      </section>

      <HowItWorks />

      <section ref={reveal} className="landing__editorial-proof landing__reveal">
        <div className="landing__editorial-proof-copy">
          <p className="landing__kicker">The craft</p>
          <h2 className="landing__editorial-h2">One idea per card. Every time.</h2>
        </div>
        <SampleCard
          question="What organelle is the site of ATP synthesis?"
          answer="The mitochondrion — via oxidative phosphorylation on the inner membrane."
        />
      </section>

      <footer className="landing__footer">
        <h2 className="landing__footer-title">From lecture hall to long-term memory.</h2>
        <SignInCTA />
      </footer>
    </main>
  );
}
```

- [ ] **Step 6: Append styles to `landing.scss`**

Append inside `.landing { … }`. (Includes the `&__footer` block — if building on top of Task 8's branch it already exists; here on the baseline branch it does not, so define it.)
```scss
  &__reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
    &.is-visible { opacity: 1; transform: none; }
  }

  &__editorial-statement {
    max-width: 760px;
    margin: 0 auto;
    padding: 4rem 3rem;
    text-align: center;
  }

  &__editorial-lead {
    font: 800 clamp(1.75rem, 4vw, 2.5rem) / 1.15 var(--l-display);
    letter-spacing: -0.03em;
    margin: 1rem 0 0;
  }

  &__editorial-transform {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 3rem 3rem 4.5rem;
  }

  &__editorial-caption {
    color: var(--l-muted);
    font-size: 1rem;
    max-width: 24rem;
    text-align: center;
  }

  &__editorial-proof {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.75rem;
    max-width: 1080px;
    margin: 0 auto;
    padding: 3rem 3rem 4.5rem;
    flex-wrap: wrap;
  }

  &__editorial-proof-copy { flex: 1; min-width: 280px; }

  &__editorial-h2 {
    font: 800 1.75rem/1.1 var(--l-display);
    letter-spacing: -0.025em;
    margin: 0.75rem 0 0;
    max-width: 20rem;
  }

  &__footer {
    background: var(--l-ink);
    color: var(--l-bg);
    text-align: center;
    padding: 4rem 3rem;

    .landing__footer-title {
      font: 800 2rem/1.1 var(--l-display);
      letter-spacing: -0.03em;
      margin: 0 0 1.75rem;
    }
    .landing__cta { justify-content: center; }
    .landing__export { color: var(--l-chartreuse); b { color: var(--l-bg); } }
    .landing__btn { background: var(--l-chartreuse); color: var(--l-ink); }
  }
```

- [ ] **Step 7: Wire into `LoginPage`**

Replace the entire contents of `frontend/src/pages/LoginPage.tsx` with:
```tsx
import { EditorialLanding } from "@/pages/landings/EditorialLanding";

export default function LoginPage() {
  return <EditorialLanding />;
}
```

- [ ] **Step 8: Run test + build**

Run: `yarn test src/pages/landings/__tests__/EditorialLanding.test.tsx && yarn build`
Expected: PASS + build succeeds.

- [ ] **Step 9: Visual check**

Run: `yarn dev`, open `http://localhost:5173/login`. Scroll: confirm sections fade/slide in, the transform visual reveals, and the dark closing footer CTA works. Stop the server.

- [ ] **Step 10: Commit + push + draft PR**

```bash
git add frontend/src/hooks/useRevealOnScroll.ts \
  frontend/src/pages/landings/EditorialLanding.tsx \
  frontend/src/pages/landings/__tests__/EditorialLanding.test.tsx \
  frontend/src/pages/LoginPage.tsx frontend/src/styles/landing.scss
git commit -m "feat(landing): long editorial-scroll variation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01T4DXMWpQsiUYSk3VcRDRin"
git push -u origin landing-editorial
gh pr create --draft --base main --head landing-editorial \
  --title "Landing redesign — Long editorial scroll variation" \
  --body "$(cat <<'EOF'
Editorial-Bold landing, long narrative scroll with reveal-on-scroll sections
and big type moments. One of three layout variations for comparison.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Final comparison

After all three worktrees exist, run each (`yarn dev` in its `frontend/`, one at a
time — they all use port 5173) and open `/login` to compare Minimal vs Standard vs
Editorial. Pick the winner; the losing branches can be closed.

---

## Notes on decomposition & sequencing

- **Part A must complete and be pushed first** — the three variation worktrees branch
  from `worktree-landing-redesign` and depend on the shared component library.
- Tasks 2–6 are independent of each other (they only depend on Task 1's tokens), so
  they can be built in any order or in parallel by separate subagents; each only
  appends its own blocks to `landing.scss`, so merge conflicts there are additive.
- Tasks 7–9 are fully independent of each other (separate worktrees/branches) once
  Part A is pushed, and can be built in parallel.
```
