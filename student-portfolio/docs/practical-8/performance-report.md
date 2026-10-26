# Practical 8 — Performance Optimization and Lazy Loading in React

**Student:** Patel Aneri  
**Course:** AWDF (Advanced Web Development Framework)  
**Date:** October 2026  

---

## Objective

Improve frontend performance using React.lazy(), Suspense, and route-based code
splitting. Identify and fix unnecessary component re-renders.

---

## Environment

| Tool       | Version   |
|------------|-----------|
| Node.js    | v24.13.1  |
| npm        | 11.8.0    |
| Vite       | 8.1.1     |
| React      | 19.2.7    |
| OS         | Windows   |
| Browser    | Chrome (manual testing) |

---

## Baseline Measurements (BEFORE lazy loading)

> Recorded before any lazy loading changes were applied.  
> Build command: `npm run build` (Vite production build)

| Asset                        | Size (raw) | Size (gzip) |
|------------------------------|-----------|-------------|
| `index-BWnN3pK5.js`          | 247.22 kB | 78.62 kB    |
| `index-BdKEySqx.css`         | 16.12 kB  | 3.44 kB     |
| **Total JS (initial load)**  | 247.22 kB | 78.62 kB    |

- Build time: ~307 ms
- **All JavaScript was in a single monolithic bundle.**
- All page code (Home, Projects, Contact, Tasks, NotFound) was downloaded on
  first page load regardless of which route the user visited.

### How to reproduce baseline
The baseline was recorded before `App.jsx` was modified. The current code already
includes lazy loading. To reproduce the baseline manually:
1. Temporarily revert `src/App.jsx` to use static imports for all pages.
2. Run `npm run build`.
3. Record `dist/assets/*.js` sizes.
4. Restore the lazy-loading version.

---

## Optimized Measurements (AFTER lazy loading)

> Recorded after implementing React.lazy() for Projects, Contact, Tasks, and
> NotFound routes.  
> Build command: `npm run build` (Vite production build)

| Asset                         | Size (raw) | Size (gzip) |
|-------------------------------|-----------|-------------|
| `index-Bkpb2d4I.js` (initial) | 238.22 kB | 76.36 kB    |
| `index-CAWRvAFX.css`          | 12.31 kB  | 2.96 kB     |
| `Tasks-Boy7hozO.css`          | 4.25 kB   | 1.17 kB     |
| `NotFound-*.js`               | 0.40 kB   | 0.27 kB     |
| `Contact-*.js`                | 1.61 kB   | 0.76 kB     |
| `Projects-*.js`               | 2.64 kB   | 0.97 kB     |
| `Tasks-*.js`                  | 5.54 kB   | 1.78 kB     |

- Build time: ~329–415 ms (varies per run)
- **Initial JS bundle reduced by ~9 kB raw / ~2.26 kB gzip**
- Route chunks are now downloaded only when the user navigates to that route.

---

## Before vs After Comparison

| Metric                      | Baseline        | Optimized       | Change         |
|-----------------------------|-----------------|-----------------|----------------|
| Initial JS (raw)            | 247.22 kB       | 238.22 kB       | −9.00 kB       |
| Initial JS (gzip)           | 78.62 kB        | 76.36 kB        | −2.26 kB       |
| Initial CSS (raw)           | 16.12 kB        | 12.31 kB        | −3.81 kB       |
| JS chunks generated         | 1               | 5               | +4 route chunks|
| Total JS all routes (raw)   | 247.22 kB       | ~248.41 kB      | +1.19 kB*      |

> *Total JS is marginally larger because Vite adds small per-chunk metadata.
> This is expected and normal — the benefit is that users only download what
> they visit, not the full total.

**Key insight:** The initial page load JavaScript decreases. A user who only
visits Home and Projects downloads ~241 kB total instead of 247 kB. A user
who visits every page downloads roughly the same total but in deferred chunks.

---

## Implementation Details

### A. Route-level Lazy Loading

**File modified:** `src/App.jsx`

```jsx
import { lazy, Suspense } from 'react';
import PageLoader from './components/PageLoader';

// Home stays eager — it is always the landing page
import Home from './pages/Home';

// All other routes are lazy-loaded
const Projects = lazy(() => import('./pages/Projects'));
const Contact  = lazy(() => import('./pages/Contact'));
const Tasks    = lazy(() => import('./pages/Tasks'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Suspense wraps only the Routes block, not NavBar or Footer
<Suspense fallback={<PageLoader />}>
  <Routes>...</Routes>
</Suspense>
```

**Why this placement?**  
Suspense is placed around the `<Routes>` block only. NavBar and Footer are
outside it, so they remain visible while a route chunk loads. This gives a
better user experience than wrapping the entire app.

### B. Loading Fallback Component

**File created:** `src/components/PageLoader.jsx`

- Uses the project's existing CSS variables (`--accent-green`, `--border`, etc.)
- Accessible: `role="status"`, `aria-live="polite"`, descriptive `aria-label`
- Shows a spinner and "Loading…" text consistent with the portfolio's design

**CSS added to:** `src/App.css` (`.page-loader`, `.page-loader-spinner`,
`.page-loader-text`)

### C. Additional Lazy-Loaded Component

`Tasks` was included as the additional lazy-loaded component beyond the required
two (Projects, Contact). It is the heaviest page component — it imports the
Tasks.css chunk separately and contains the entire CRUD UI, fetch logic, and
task card rendering. This is the most meaningful candidate in the existing app.

### D. Minimum Fallback Delay

Not implemented. On a normal connection the chunks load in under 50 ms and a
timer would only add unnecessary delay. The Suspense fallback displays
immediately on slower connections (verifiable with Slow 3G throttling — see
manual testing steps below).

---

## React.memo Optimization

### Component: Footer

**File:** `src/components/footer.jsx`

**Problem identified:**  
`Footer` accepts zero props and renders static content. Every time `App`
re-renders (which happens on every theme toggle click because `theme` state
lives in `App`), `Footer` re-renders unnecessarily even though its output
never changes.

**Fix applied:**
```jsx
import { memo } from 'react';
// ...
export default memo(Footer);
```

**Evidence:**  
Without `memo`: clicking the theme toggle button triggers a re-render of
`App` → `Footer` re-renders every click.  
With `memo`: React shallow-compares props (none in this case) and skips
the re-render. The Footer DOM is never touched.

### Component: Skills

**File:** `src/components/skills.jsx`

**Problem identified:**  
`Skills` receives a `skillList` array prop. In `Home.jsx`, `skillList` is
defined as a **module-level constant** (`const skillList = [...]`), meaning
its reference is stable. However, without `memo`, React still calls the
`Skills` function on every `Home` render.

**Fix applied:**
```jsx
import { memo } from 'react';
// ...
export default memo(Skills);
```

**Evidence:**  
With memo, React compares the `skillList` reference before re-rendering.
Since the reference is stable (module-level constant), `Skills` is never
re-rendered after its first paint.

---

## Manual Testing Checklist

Complete the following tests in your browser:

### Basic Navigation
- [ ] Visit `http://localhost:5173/` — Home loads, no console errors
- [ ] Click Projects — loads, spinner visible briefly, no errors
- [ ] Click Contact — loads correctly
- [ ] Click Tasks — loads correctly
- [ ] Click Home — no re-download of Home (it was eager)
- [ ] Visit `http://localhost:5173/projects` directly — loads without error
- [ ] Visit `http://localhost:5173/tasks` directly — loads without error
- [ ] Visit `http://localhost:5173/unknown-route` — 404 page appears

### Code Splitting Verification (DevTools Network Tab)
1. Open DevTools → Network → filter by JS
2. Hard-refresh the home page (Ctrl+Shift+R)
3. **Expected:** Only `index-*.js` is downloaded (no Projects/Contact/Tasks chunks)
4. Click Projects → **Expected:** `Projects-*.js` chunk downloads now
5. Click Contact → **Expected:** `Contact-*.js` chunk downloads now
6. Click Tasks → **Expected:** `Tasks-*.js` and `Tasks-*.css` download now

### Slow 3G Throttling Test
1. DevTools → Network → Throttling → Slow 3G
2. Hard-refresh
3. **Expected:** PageLoader spinner appears while `index-*.js` loads
4. Navigate to Projects → **Expected:** spinner appears while `Projects-*.js` loads
5. Navigate back to Projects — **Expected:** no spinner (chunk is cached)

### Authentication and Task Tests
- [ ] Backend running: `cd backend && npm run dev`
- [ ] Register a new user at the Tasks page
- [ ] Login with the registered user
- [ ] Create a task — should succeed (JWT sent in Authorization header)
- [ ] Edit a task — should succeed
- [ ] Delete a task — should succeed
- [ ] Attempt to create a task without a title — should be rejected by both frontend and backend

---

## Screenshots Required

Please capture the following and save to `docs/practical-8/screenshots/`:

| Filename                        | What to capture                                        |
|---------------------------------|--------------------------------------------------------|
| `01-baseline-build.png`         | Terminal output of baseline `npm run build`            |
| `02-optimized-build.png`        | Terminal output of optimized `npm run build`           |
| `03-network-initial.png`        | Network tab after hard-refresh (only index chunk)      |
| `04-network-after-projects.png` | Network tab after clicking Projects (Projects chunk)   |
| `05-network-slow3g.png`         | Slow 3G load showing PageLoader spinner                |
| `06-pageloader-visible.png`     | PageLoader fallback visible in browser                 |
| `07-tasks-create.png`           | Successfully creating a task while logged in           |

---

## Key Questions (Practical Handout)

**Q1: What is the difference between React.lazy() and a regular import?**  
A regular `import` is static — the module is always included in the main
bundle and downloaded on page load. `React.lazy()` wraps a dynamic `import()`
call, which Vite recognises as a split point and emits a separate chunk file.
That chunk is only downloaded by the browser when the component is first rendered.

**Q2: Why is Suspense needed with lazy loading?**  
When a lazy component's chunk has not yet been downloaded, React cannot render
it. Suspense provides a way to declare what to show in the meantime (the
`fallback` prop). Without Suspense wrapping a lazy component, React throws an
error when it encounters the unresolved `lazy()` reference.

**Q3: Does code splitting reduce total JavaScript size?**  
No — the total JavaScript across all chunks is roughly the same (or slightly
larger due to per-chunk overhead). The benefit is a reduced *initial* download.
Users only download the code for pages they actually visit, and subsequent
visits to a route reuse the cached chunk without re-downloading it.

---

## Learning Outcomes

- Route-based code splitting with `React.lazy()` and `Suspense`
- Writing an accessible, theme-consistent loading fallback
- Understanding initial bundle size vs. total bundle size
- Identifying unnecessary re-renders with `React.memo`
- Configuring ESLint to correctly handle both frontend and backend code

---

## Commands to Reproduce

```bash
# Install frontend dependencies
npm install

# Baseline build (before lazy loading — revert App.jsx first)
npm run build

# Optimized build (current state)
npm run build

# Run frontend dev server
npm run dev

# Run backend
cd backend
npm install
npm run dev
```
