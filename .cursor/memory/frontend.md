# Frontend Memory — Jordan

> This file is Jordan's (frontend developer) persistent brain. Append-only.
> Read this at the start of every task. Write to it at the end.

---

## [INIT] — Memory initialized
- **What**: Memory file created for the frontend developer persona
- **Status**: No prior context. Awaiting first task from CEO.
- **Stack**: Not yet determined — will be set on first feature work
- **Open**: What framework/stack is the project using? Need to discover on first run.

---

## [2026-04-19] — Onboarding: codebase discovery

### Stack
- **React 19** + **Vite 6** + **React Router 7** + **Redux Toolkit 2.5** + **RTK Query** + **global SCSS**
- Package manager: **Yarn**
- No UI library, no Tailwind, no CSS modules — single global SCSS with BEM-style classes
- No axios — native `fetch` via RTK Query's `fetchBaseQuery`

### File map (`frontend/src/` — ~14 files total, small surface area)

```
src/
├── main.tsx                  # Bootstrap: StrictMode → Provider → BrowserRouter → App
├── App.tsx                   # Route table
├── config.ts                 # API_URL = VITE_API_URL || "/api"
├── layouts/
│   └── AuthLayout.tsx        # Auth gate + app shell (sidebar, outlet, logout)
├── pages/
│   ├── LoginPage.tsx         # Google OAuth redirect + dev login (DEV only)
│   ├── AuthCallbackPage.tsx  # OAuth return: ?token= → store → redirect home
│   ├── DashboardPage.tsx     # Deck list, delete deck
│   ├── DeckPage.tsx          # Single deck: cards, edit modal, generate, export
│   └── UploadPage.tsx        # Create deck + PDF upload + trigger generation
├── store/
│   ├── index.ts              # configureStore (api + auth slices)
│   ├── api.ts                # RTK Query: all endpoints + domain types (Card, Deck, etc.)
│   ├── authSlice.ts          # JWT in localStorage (key: ankify_token), user in Redux
│   └── hooks.ts              # Typed useAppDispatch / useAppSelector
└── styles/
    └── global.scss           # All styles + CSS custom properties (design tokens)
```

### Routes

| Path | Component | Auth |
|------|-----------|------|
| `/login` | LoginPage | Public |
| `/auth/callback` | AuthCallbackPage | Public |
| `/` | DashboardPage | Protected (AuthLayout) |
| `/decks/:id` | DeckPage | Protected |
| `/upload` | UploadPage | Protected |

### API layer (RTK Query — `store/api.ts`)
- Base: `fetchBaseQuery` with `credentials: "include"` + Bearer token from localStorage
- Endpoints: `getMe`, `getDecks`, `getDeck`, `createDeck` (FormData), `updateDeck`, `deleteDeck`, `updateCard`, `deleteCard`, `generateDeck`
- Tag invalidation: `Deck`, `DeckList`
- **Raw fetch used for**: dev login, `/auth/me` in AuthLayout, export `.apkg` (blob download)
- After login: `api.util.resetApiState()` to clear stale cache

### Auth flow
1. Unauthenticated → AuthLayout redirects to `/login`
2. "Sign in with Google" → `window.location.href = API_URL + "/auth/google"`
3. Backend OAuth → redirects to `/auth/callback?token=<jwt>`
4. AuthCallbackPage stores token, fetches `/auth/me`, sets user, navigates home
5. Dev mode only: "Dev Login" button → `POST /auth/dev-login`
6. Token persisted in `localStorage` key `ankify_token`

### Styling
- Single `global.scss` imported from `main.tsx`
- CSS custom properties on `:root` (colors, fonts, radius, shadows, sidebar width)
- BEM-style class names (e.g. `deck-card__header`, `sidebar__link--active`)
- Notion-inspired neutral palette, system font stack
- No dark mode, no theme provider

### Domain types (in `api.ts`)
- `Card`: id, deckId, cardType, front, back, sourcePageNum, sortOrder, media[]
- `CardMedia`: id, cardId, fileKey, fileName, mimeType
- `Deck`: id, name, description, status, sourceFileName, cards[], _count, createdAt/updatedAt
- `User` defined separately in both `api.ts` and `authSlice.ts` (slight duplication)

### No components directory
- All UI is in pages. Reusable-looking pieces (StatusBadge, CardEditor, CardTypeIcon) are local to their page files
- No shared component library yet

### Config
- Vite alias: `@` → `./src`
- Dev proxy: `/api` → `http://localhost:3000` (strip prefix)
- Prod: `VITE_API_URL` set in Vercel env, `vercel.json` SPA rewrites

### Key observations for Sprint 0
- **ANKIFY-001 (error feedback)**: No toast/notification system exists. API errors caught in try/catch but not surfaced to users. No error boundary.
- **ANKIFY-002 (duplicate names)**: No frontend validation on deck name before submit.
- **ANKIFY-003 (upload progress)**: UploadPage creates deck then immediately triggers generation, navigates to DeckPage. No progress/status polling. User sees nothing until cards appear.
- **ANKIFY-004 (image cards)**: DeckPage renders card HTML via `dangerouslySetInnerHTML`. CardMedia type exists but unclear if images are actually rendered.

- **Status**: Onboarded. Ready for Sprint 0 work.
- **Next**: Await ticket assignment from Sam/CEO.

---

## [2026-04-19] — ANKIFY-001 shipped: error feedback system

### What was built
- **Toast system**: Redux slice (`toastSlice.ts`) + `ToastContainer` component (bottom-right, animated, auto-dismiss 5s, max 5 stacked)
- **RTK Query error middleware** (`apiErrorMiddleware.ts`): auto-catches all rejected RTK Query actions and shows error toasts
- **Error boundary** (`ErrorBoundary.tsx`): class component wrapping Routes, shows fallback UI on unrecoverable crashes
- **Toast SCSS**: added to end of `global.scss` — BEM classes, uses existing CSS custom properties, entry/exit animations

### What was wired up
- `App.tsx`: `<ErrorBoundary>` wraps Routes, `<ToastContainer>` outside it (still works if app crashes)
- `DeckPage.tsx`: success toasts for export/save/delete, error toast replaces `alert()` on export failure
- `DashboardPage.tsx`: success toast on deck delete
- `LoginPage.tsx`: error toast on dev login failure
- `UploadPage.tsx`: unchanged — keeps inline form errors, middleware catches unexpected API errors
- `AuthLayout.tsx` / `AuthCallbackPage.tsx`: unchanged — redirect to login on auth failure, no toast

### New files
- `frontend/src/store/toastSlice.ts`
- `frontend/src/store/apiErrorMiddleware.ts`
- `frontend/src/components/ToastContainer.tsx`
- `frontend/src/components/ErrorBoundary.tsx`

### Store changes
- `store/index.ts`: added `toastReducer` + `apiErrorMiddleware` to chain

- **Status**: ANKIFY-001 complete.

---

## [2026-04-19] — Replaced custom toast with react-toastify

### What changed
- **Removed**: `toastSlice.ts`, `ToastContainer.tsx`, custom toast SCSS (80+ lines)
- **Removed**: `toastReducer` from Redux store
- **Added**: `react-toastify` (yarn) — CSS imported in `main.tsx`, `<ToastContainer>` from library in `App.tsx`
- **Simplified**: `apiErrorMiddleware.ts` now calls `toast.error()` directly (no Redux dispatch needed)
- **Updated pages**: `DeckPage`, `DashboardPage`, `LoginPage` — `toast.success()` / `toast.error()` instead of `dispatch(addToast(...))`
- **Kept**: `ErrorBoundary.tsx` (still needed for render crashes), `apiErrorMiddleware.ts` (still needed for RTK Query error interception)

### Store state
- Redux has 2 slices: `api` (RTK Query) + `auth`
- Toast is NOT in Redux anymore — react-toastify manages its own state
- `apiErrorMiddleware` still in the middleware chain but no longer imports from store

### UploadPage cleanup
- Removed inline `error` state and `{error && <p>}` element
- Validation errors now use `toast.warning()` 
- API errors caught by middleware — no manual parsing

- **Next**: ANKIFY-002 (duplicate deck names) or ANKIFY-003 (upload progress).

---

## [2026-04-19] — ANKIFY-003 shipped: upload-to-complete flow

### What changed

#### UploadPage
- **No longer calls `generateDeck`**. Upload creates the deck (status `uploaded`) and immediately navigates to `/decks/:id`.
- Button text during submit changed from "Generating cards..." to "Uploading..." since generation is no longer awaited here.
- `useGenerateDeckMutation` import removed — page only uses `useCreateDeckMutation`.

#### DeckPage — generation lifecycle owner
- **Auto-triggers generation**: `useEffect` watches for `status === "uploaded"` + `sourceFileKey` present → calls `generateDeck(id)`. Ref guard prevents double-fire.
- **Polls for status**: `useGetDeckQuery` with `pollingInterval: 3000` enabled while deck status is `generating` or `uploaded`. Polling stops once status flips to `ready` or `error`.
- **Status transition toasts**: Tracks `prevStatus` ref. `generating → ready` = success toast. `generating → error` = error toast.
- **Error state UI**: New `deck-page__error` block shown when status is `error` with a "Try Again" button to re-trigger generation.
- **Hides card list / count during generation** — only the generating indicator is visible while in-flight.
- **Regenerate button hidden during generation** to prevent double-fires.

#### SCSS
- Added `&__error` styles to `.deck-page` block (red background, danger color, centered text).

### Architecture
- Backend is unchanged — `POST /generate/deck/:deckId` is still synchronous (sets status generating → does work → sets ready/error).
- The frontend no longer blocks on that long request. Instead, the mutation fires and DeckPage polls `GET /decks/:id` to observe the status transition.
- If the user navigates away mid-generation and comes back, polling resumes because the deck status is still `generating`.

- **Next**: ANKIFY-004 (image cards don't include images).

---

## [2026-04-19] — Card types removed (ANKIFY-004 cancelled)

### What changed
- **Removed `CardTypeIcon`** component from `DeckPage.tsx` — no more type badges on cards or in the editor
- **Removed `cardType`** from `Card` interface in `api.ts` and from `updateCard` mutation params
- **Removed `.card-type` SCSS** — the `--basic`, `--cloze`, `--image` badge styles
- All cards are now basic front/back — no type distinction in the UI

### Why
Image card support requires a full pipeline (PDF image extraction → storage → media attachment → rendering) that's too complex for v1. Cloze adds AI complexity. Simplifying to basic Q/A for v1.

### Still in schema
- `CardMedia` model still exists in Prisma — kept for potential future media features but nothing creates media rows currently.

- **Status**: Sprint 0 complete. All 4 urgent tickets resolved (3 shipped, 1 cancelled).
