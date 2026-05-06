# Theme Toggle: Light/Dark Mode Support

## Status: Draft

## Problem Statement

The kanban app currently ships a single light theme with hardcoded CSS values. Users have no way to switch to dark mode, and the app does not respect OS-level color scheme preferences.

## Codebase Analysis

### Current Architecture

- **Styling**: Pure CSS with CSS custom properties defined in `app/globals.css` (`:root` block)
- **Framework**: Next.js 16 App Router, single `app/layout.tsx` (server component), single `app/page.tsx` (client component)
- **Components**: Three UI primitives (`Button`, `Card`, `Input`) in `components/ui/` using plain class names
- **No Tailwind**: The project does not use Tailwind CSS; all styles are vanilla CSS
- **No existing theme support**: No `prefers-color-scheme` media queries, no dark mode classes, no theme toggle

### Hardcoded Values That Must Be Tokenized

Several color values in `globals.css` bypass the CSS variable system and must be converted to variables for theming to work:

| Location | Current Value | Purpose |
|---|---|---|
| `.input, select` | `background: #ffffff` | Input background |
| `.button:hover` | `background: #18584e; border-color: #18584e` | Primary hover state |
| `.form-error` | `color: #963622` | Error text color |
| `.empty-state` | `border: 1px dashed #b9c4bd` | Empty column border |
| `.column` | `background: rgb(255 255 255 / 58%)` | Column backdrop |
| `.card` | `box-shadow: 0 8px 24px rgb(35 47 45 / 8%)` | Card elevation |
| `.input:focus` | `outline: 3px solid rgb(31 111 98 / 16%)` | Focus ring |
| `.form-error` | `border: 1px solid rgb(204 79 53 / 28%); background: var(--accent-soft)` | Error styling |

### Design Guidelines Conflict

The `kanban-design-guidelines` skill states "Keep the UI in dark mode at all times." This directly conflicts with the user's request for dual-mode support. **The skill should be updated** to reflect the new requirement: the app supports both light and dark modes, with system preference as the default.

---

## Requirements

### Functional

1. **R1 - System preference on startup**: On first visit (no saved preference), the app must detect the OS color scheme via `prefers-color-scheme` and render in the matching mode.
2. **R2 - Toggle button**: A visible toggle button must allow the user to switch between light and dark mode at any time.
3. **R3 - Toggle reflects current state**: The toggle must visually indicate which mode is currently active (e.g., sun icon for light, moon icon for dark).
4. **R4 - Preference persistence**: The user's choice must persist across page reloads and browser sessions via `localStorage`.
5. **R5 - Saved preference overrides system**: If a preference is saved, it takes priority over the OS setting.
6. **R6 - No flash of wrong theme (FOUC)**: The page must not flash the wrong theme during initial load. The correct theme must apply before any visible paint.

### Non-Functional

7. **R7 - No new runtime dependencies**: Implement with vanilla CSS variables + a small inline script. Do not add `next-themes` or similar libraries. The project is small enough that a manual approach is simpler and keeps the dependency footprint minimal.
8. **R8 - Existing tests must pass**: No regressions in `page.test.tsx` or `ui.test.tsx`.
9. **R9 - CSS-only color switching**: All color switching must happen through CSS custom property overrides, not JavaScript style manipulation.

---

## Technical Specification

### Approach: CSS Custom Properties + `data-theme` Attribute

The theme is controlled by a `data-theme="light"` or `data-theme="dark"` attribute on the `<html>` element. CSS variables are redefined under `[data-theme="dark"]`, and all components automatically pick up the new values with zero JS style changes.

**Why `data-theme` over `.dark` class**: Data attributes are semantically clearer for theming and avoid class-name collisions. They also work well with CSS attribute selectors.

**Why not `next-themes`**: The project has 3 components and one page. A 10-line inline script handles the FOUC problem, and `localStorage` + `matchMedia` cover persistence and system detection. Adding a dependency for this is unnecessary overhead.

### 1. CSS Variable Structure (`globals.css`)

Define light theme tokens under `:root` (the default), and dark theme tokens under `[data-theme="dark"]`:

```css
/* Light theme (default) */
:root {
  --background: #f7f4ef;
  --foreground: #1d2525;
  --muted: #66706d;
  --muted-foreground: #f0ece4;
  --panel: #ffffff;
  --panel-strong: #eff5f1;
  --border: #d7ddd6;
  --primary: #1f6f62;
  --primary-foreground: #ffffff;
  --primary-hover: #18584e;
  --accent: #cc4f35;
  --accent-soft: #fde8df;
  --accent-text: #963622;
  --shadow: 0 14px 40px rgb(35 47 45 / 10%);
  --input-bg: #ffffff;
  --focus-ring: rgb(31 111 98 / 16%);
  --column-bg: rgb(255 255 255 / 58%);
  --card-shadow: 0 8px 24px rgb(35 47 45 / 8%);
  --empty-border: #b9c4bd;
  --error-border: rgb(204 79 53 / 28%);
}

/* Dark theme */
[data-theme="dark"] {
  --background: #141918;
  --foreground: #e0e4e3;
  --muted: #8a928f;
  --muted-foreground: #2a3230;
  --panel: #1c2422;
  --panel-strong: #232e2b;
  --border: #2f3b38;
  --primary: #2d9e8c;
  --primary-foreground: #ffffff;
  --primary-hover: #36b8a3;
  --accent: #e06b50;
  --accent-soft: #2e2220;
  --accent-text: #f09a86;
  --shadow: 0 14px 40px rgb(0 0 0 / 25%);
  --input-bg: #1c2422;
  --focus-ring: rgb(45 158 140 / 20%);
  --column-bg: rgb(28 36 34 / 58%);
  --card-shadow: 0 8px 24px rgb(0 0 0 / 20%);
  --empty-border: #3a4845;
  --error-border: rgb(224 107 80 / 28%);
}
```

**Dark palette rationale**:
- Background `#141918`: Dark green-gray that maintains the existing warm-neutral character without being pure black
- Surfaces (`--panel`, `--panel-strong`): Subtle elevation through lightening, not color shifts
- Primary `#2d9e8c`: Slightly brighter than the light-mode primary so it reads well against dark surfaces
- Accent `#e06b50`: Warmer, lighter version of the red-orange that maintains contrast on dark backgrounds
- Borders `#2f3b38`: Just visible enough for structure without harsh lines

### 2. Replace All Hardcoded Colors

Every hardcoded hex/rgb value in `globals.css` must reference a CSS variable. This is the full list of replacements:

| Selector | Property | From | To |
|---|---|---|---|
| `.input, select` | `background` | `#ffffff` | `var(--input-bg)` |
| `.input:focus, select:focus` | `outline` | `3px solid rgb(31 111 98 / 16%)` | `3px solid var(--focus-ring)` |
| `.button:hover` | `background` | `#18584e` | `var(--primary-hover)` |
| `.button:hover` | `border-color` | `#18584e` | `var(--primary-hover)` |
| `.button-ghost:hover` | `color` | `#963622` | `var(--accent-text)` |
| `.form-error` | `color` | `#963622` | `var(--accent-text)` |
| `.form-error` | `border` | `1px solid rgb(204 79 53 / 28%)` | `1px solid var(--error-border)` |
| `.column` | `background` | `rgb(255 255 255 / 58%)` | `var(--column-bg)` |
| `.card` | `box-shadow` | `0 8px 24px rgb(35 47 45 / 8%)` | `var(--card-shadow)` |
| `.empty-state` | `border` | `1px dashed #b9c4bd` | `1px dashed var(--empty-border)` |

### 3. Theme Initialization Script (FOUC Prevention)

Add an inline `<script>` in `app/layout.tsx` that runs synchronously before paint. This is the standard technique for SSR apps without a theme library.

```tsx
// Inline script that runs before React hydration to prevent flash.
// Reads saved preference from localStorage, falls back to OS preference.
const THEME_INIT_SCRIPT = `
(function() {
  var saved = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
`;
```

Place this as `<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />` inside the `<head>` of the layout. Add `suppressHydrationWarning` to the `<html>` tag since the script modifies it before React hydrates.

### 4. ThemeToggle Component (`components/ui/theme-toggle.tsx`)

A client component that:

- Reads the current theme from `document.documentElement.getAttribute('data-theme')`
- Toggles between `"light"` and `"dark"`
- Updates the `data-theme` attribute and saves to `localStorage`
- Renders a sun/moon icon (inline SVG, no icon library)
- Uses the `mounted` pattern to avoid hydration mismatch (renders nothing on server)

```tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // After mount, read the actual theme from the DOM (set by the inline script).
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme;
    setTheme(current ?? "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  // Render nothing until mounted to avoid hydration mismatch.
  if (!theme) return null;

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      type="button"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

**Icon approach**: Two small inline SVGs (~4 lines each). No icon library dependency. Sun icon = circle + rays. Moon icon = crescent path. Keep them 18x18px.

### 5. Toggle Placement

Place the `ThemeToggle` in the top-right area of the page header (inside the `.hero` section or as a fixed/absolute element in the page shell). It should be always visible but unobtrusive.

**Recommended placement**: Inside `page.tsx`, at the top of the `.page-shell` div, as a small absolutely-positioned or flex-end-aligned button. Add a `.page-header` wrapper with `display: flex; justify-content: flex-end;` above the hero section.

### 6. CSS for the Toggle Button

```css
.theme-toggle {
  align-items: center;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--foreground);
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.theme-toggle:hover {
  background: var(--panel-strong);
}
```

---

## Action Plan

### Step 1: Tokenize hardcoded colors in `globals.css`

- Add new CSS variables to `:root`: `--primary-hover`, `--accent-text`, `--input-bg`, `--focus-ring`, `--column-bg`, `--card-shadow`, `--empty-border`, `--error-border`
- Replace every hardcoded color value listed in the replacement table above
- **Verify**: The app should look identical after this step (no visual changes)

### Step 2: Add dark theme variable block

- Add the `[data-theme="dark"] { ... }` block to `globals.css` with all dark-mode token values
- No visual effect yet since nothing sets the attribute

### Step 3: Add theme initialization script to layout

- In `app/layout.tsx`, add the inline `<script>` in `<head>` for FOUC prevention
- Add `suppressHydrationWarning` to the `<html>` tag
- Set `data-theme` on `<html>` (the script handles this at runtime, but the static default should be absent so the script controls it)
- **Verify**: If your OS is in dark mode, the app should now render dark on load without any flash

### Step 4: Create `ThemeToggle` component

- Create `components/ui/theme-toggle.tsx` with the toggle logic and inline SVG icons
- Add `.theme-toggle` styles to `globals.css`
- Use the `mounted` pattern to prevent hydration errors

### Step 5: Integrate toggle into the page

- Import `ThemeToggle` in `app/page.tsx`
- Add it to the top of the page shell (above the hero), right-aligned
- Add minimal layout CSS for positioning

### Step 6: Update the design guidelines skill

- Edit `.agents/skills/kanban-design-guidelines/SKILL.md`
- Replace "Keep the UI in dark mode at all times" with language reflecting dual-mode support
- Add guidance for dark-mode color token values

### Step 7: Automated Tests

All new behavior must be covered by automated tests. The project uses Vitest + jsdom + @testing-library/react (see `vitest.config.ts` and `vitest.setup.ts`).

#### 7a. ThemeToggle unit tests (`components/ui/ui.test.tsx`)

Add a new `describe("ThemeToggle")` block to the existing `ui.test.tsx` file. Each test must stub `localStorage` and `document.documentElement.getAttribute`/`setAttribute` as needed since jsdom does not run the inline init script.

| Test | What it verifies | Key assertions |
|---|---|---|
| **renders nothing before mount** | The `mounted` guard prevents hydration mismatch | After render, no button with role `button` and name matching "Switch to" should exist synchronously. After `waitFor`, the button appears. |
| **renders toggle button with correct aria-label in light mode** | Accessibility and state reflection (R3) | Set `data-theme="light"` on `documentElement` before render. Expect `aria-label` to be `"Switch to dark mode"`. |
| **renders toggle button with correct aria-label in dark mode** | Accessibility and state reflection (R3) | Set `data-theme="dark"` on `documentElement` before render. Expect `aria-label` to be `"Switch to light mode"`. |
| **toggles from light to dark on click** | Core toggle behavior (R2) | Render with `data-theme="light"`. Click the button. Assert `document.documentElement.getAttribute("data-theme")` is `"dark"` and `localStorage.getItem("theme")` is `"dark"`. |
| **toggles from dark to light on click** | Core toggle behavior (R2) | Render with `data-theme="dark"`. Click the button. Assert attribute is `"light"` and localStorage is `"light"`. |
| **persists preference to localStorage** | Persistence (R4) | After toggling, assert `localStorage.setItem` was called with `("theme", <expected>)`. |
| **applies theme-toggle class** | Styling hook exists | Expect the rendered button to have class `"theme-toggle"`. |

**Setup/teardown pattern:**

```typescript
beforeEach(() => {
  // Default to light mode for each test unless overridden.
  document.documentElement.setAttribute("data-theme", "light");
  localStorage.clear();
});

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});
```

#### 7b. Page-level integration test (`app/page.test.tsx`)

Add one test to the existing `describe("Kanban home page")` block:

| Test | What it verifies |
|---|---|
| **renders the theme toggle button** | The toggle is present in the page. After board loads, assert `screen.getByRole("button", { name: /switch to/i })` exists. |

This confirms the toggle is wired into the page without duplicating toggle-specific logic tests.

#### 7c. Run all tests and confirm green

Run `npm run test` (which runs `vitest run`). Every existing test must still pass, plus all new tests must pass. The implementing agent must include the full test output in their completion notes.

### Step 8: Visual verification via browser screenshots

After all code changes are complete and tests pass, the implementing agent must take browser screenshots using the browser MCP tools to visually confirm both themes render correctly.

#### Screenshot procedure:

1. Ensure the dev server is running at `http://localhost:3000`
2. Navigate to `http://localhost:3000` in the browser
3. **Screenshot 1 -- Light mode**: If not already in light mode, click the toggle to switch to light mode. Take a full-page screenshot. Save or present it as evidence.
4. **Screenshot 2 -- Dark mode**: Click the toggle to switch to dark mode. Take a full-page screenshot. Save or present it as evidence.

#### Visual checklist (verify in each screenshot):

- [ ] Background color matches the expected theme (light: warm cream `#f7f4ef`, dark: deep green-gray `#141918`)
- [ ] Panel/card surfaces have appropriate contrast against the background
- [ ] Text is readable against its background in both modes
- [ ] The toggle button is visible in the top-right area and shows the correct icon (sun in dark mode, moon in light mode)
- [ ] Borders and shadows are subtle but visible
- [ ] Form inputs (title, description, column select) are styled appropriately
- [ ] The "Add card" button has correct primary color contrast
- [ ] Column headers, card titles, and descriptions are legible
- [ ] Empty state dashed borders are visible but not harsh

The implementing agent must present both screenshots to the user as part of the completion report.

---

## Guardrails for Implementation

1. **Do NOT add any npm dependencies.** This feature is implemented with CSS variables, one inline script, and one small React component.
2. **Do NOT use Tailwind `dark:` prefixes.** This project does not use Tailwind.
3. **Do NOT modify any API routes or the kanban store.** This is purely a front-end/CSS concern.
4. **Do NOT change component APIs.** `Button`, `Card`, and `Input` signatures must not change.
5. **Every color in `globals.css` must go through a CSS variable.** No hardcoded hex or rgb values should remain in selectors (`:root` variable definitions are the exception).
6. **The dark palette must maintain the same warm green-gray character** as the light palette, not shift to a cold blue-gray.
7. **Border radius values must stay at their current values.** Do not change radii as part of this work.
8. **The toggle must be accessible**: proper `aria-label`, keyboard focusable, visible focus indicator.
9. **The inline theme script must be minimal** -- just read localStorage, check matchMedia, set the attribute. No imports, no React, no complex logic.
10. **Test the FOUC fix** by hard-refreshing with dark mode set. The page should never show light mode first.

---

## Files Modified

| File | Change |
|---|---|
| `app/globals.css` | Add new variables, add dark theme block, tokenize hardcoded values, add toggle styles |
| `app/layout.tsx` | Add inline theme script, add `suppressHydrationWarning` |
| `app/page.tsx` | Import and render `ThemeToggle`, add page-header wrapper |
| `components/ui/theme-toggle.tsx` | **New file** -- toggle component with SVG icons |
| `components/ui/ui.test.tsx` | Add `ThemeToggle` unit test suite (7 tests) |
| `app/page.test.tsx` | Add integration test for toggle presence on page |
| `.agents/skills/kanban-design-guidelines/SKILL.md` | Update to reflect dual-mode support |

## Files NOT Modified

| File | Reason |
|---|---|
| `components/ui/button.tsx` | No API changes needed |
| `components/ui/card.tsx` | No API changes needed |
| `components/ui/input.tsx` | No API changes needed |
| `lib/kanban-store.ts` | Theme is front-end only |
| `app/api/**` | Theme is front-end only |
| `package.json` | No new dependencies |
| `vitest.config.ts` | No changes needed; jsdom already configured |
| `vitest.setup.ts` | No changes needed |

## Completion Criteria

The implementation is considered complete only when ALL of the following are true:

1. All existing tests pass (zero regressions)
2. All new ThemeToggle tests pass (7 unit tests + 1 integration test)
3. Full `npm run test` output is included showing all green
4. Two browser screenshots are presented: one light mode, one dark mode
5. Both screenshots pass the visual checklist above
