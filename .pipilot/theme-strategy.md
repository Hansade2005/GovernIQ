# Light/Dark Theme Strategy for PiPilot Apps

A battle-tested, minimal-theme system using CSS custom properties + **official Tailwind CSS v4**. This project uses the OFFICIAL setup (the `@tailwindcss/vite` plugin + `@import "tailwindcss";` in `src/index.css`) — NOT the browser CDN, and there is NO `tailwind.config.js` (v4 configures in CSS). Everything below lives in `src/index.css`, which already starts with:

```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));
```

---

## 1. Define CSS Variables in `src/index.css`

Below the `@import`, add two scopes — `:root` (light) and `.dark` (dark). eg.

```css
:root {
  --background: #ffffff;
  --surface: #fff7f5;
  --surface-alt: #ffe8e4;
  --foreground: #1c1c21;
  --muted: #5f6068;
  --border: #e7d9d6;
  --primary: oklch(0.74 0.19 28);        /* Brand color */
  --primary-light: oklch(0.92 0.06 28);
  --primary-foreground: #ffffff;
  --accent: oklch(0.78 0.18 170);
  --accent-foreground: #ffffff;
  --card: #ffffff;
  --card-foreground: #1c1c21;
  --input: #e7d9d6;
  --ring: oklch(0.74 0.19 28);
}

.dark {
  --background: #111116;
  --surface: #1c1c21;
  --surface-alt: #1c1c21;
  --foreground: #ffffff;
  --muted: #b8bbc7;
  --border: #2a2a31;
  --primary: oklch(0.74 0.19 28);
  --primary-light: oklch(0.22 0.06 28);
  --primary-foreground: #ffffff;
  --accent: oklch(0.78 0.18 170);
  --accent-foreground: #ffffff;
  --card: #1c1c21;
  --card-foreground: #ffffff;
  --input: #2a2a31;
  --ring: oklch(0.74 0.19 28);
}
```

**Rules:**
- Use `oklch()` for brand colors (easier to manipulate lightness for dark mode)
- Use hex for neutrals (white, black, grays)
- Keep semantic names: `--background`, `--foreground`, `--surface`, `--muted`, `--border`, `--card`

---

## 2. Map CSS Variables to Tailwind Tokens

In the SAME `src/index.css` (after the `:root`/`.dark` blocks), add an `@theme inline` block. eg.

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-alt: var(--surface-alt);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-light: var(--primary-light);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-xs: 10px;
  --radius-sm: 14px;
  --radius-md: 18px;
  --radius-lg: 24px;
  --radius-xl: 32px;
}
```

This makes Tailwind utilities like `bg-background`, `text-foreground`, `border-border` work automatically.

---

## 3. Toggle the `.dark` Class in React like this example

```jsx
import { useState } from 'react'

export default function App() {
  const [dark, setDark] = useState(false)

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground">
        {/* ... */}
      </div>
    </div>
  )
}
```

**Key:** The `.dark` class goes on the **outermost wrapper**, not `<html>`. This keeps React state in control and avoids SSR flicker.

---

## 4. Use Semantic Tailwind Classes Everywhere  like this 

Instead of hardcoded colors:

```jsx
// ✅ Good
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground" />
<p className="text-muted-foreground" />

// ❌ Bad
<div className="bg-white text-gray-900 border-gray-200" />
```

This ensures the same component works in both themes without extra logic.

---

## 5. Add Smooth Transitions (Optional)  for instance 

```css
body {
  background: var(--background);
  color: var(--foreground);
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

---

## 6. System Preference Detection (Optional)

If you want to respect `prefers-color-scheme`:   for instance 

```jsx
import { useEffect } from 'react'

export default function App() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ... rest
}
```

---

## 7. Persist Preference (Optional)  for instance 

```jsx
useEffect(() => {
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}, [dark])

// On init:
const [dark, setDark] = useState(() => {
  return localStorage.getItem('theme') === 'dark'
})
```

---

## File Structure   for example 

```
index.html          ← CSS variables + @theme inline + fonts
src/
  components/        ← EMPTY — build your OWN small reusable components here (plain Tailwind + tokens; no shadcn kit)
    Button.jsx       ← e.g. a component YOU write, using bg-primary, text-primary-foreground, etc.
    Card.jsx         ← e.g. your own card, using bg-card, border-border, etc.
  App.jsx           ← dark state, wraps content in <div className={dark ? 'dark' : ''}>
```

---

## Why This Works

1. **CSS variables cascade** — changing one class (`.dark`) updates every token
2. **Tailwind v4 `@theme inline`** — maps CSS vars to Tailwind utilities at build time
3. **No runtime overhead** — no JS object lookups, no context providers
4. **Hot-reload friendly** — Vite picks up CSS changes instantly
5. **SSR-safe** — class toggling happens client-side, no flash of wrong theme

---

## Checklist

- [ ] All colors use semantic tokens (`bg-background`, not `bg-white`)
- [ ] CSS variables defined for both `:root` and `.dark`
- [ ] `@theme inline` maps every variable to a Tailwind color
- [ ] Outer wrapper toggles `dark` class based on state
- [ ] No hardcoded colors in components (except brand accents like `#FF6154`)
- [ ] Build passes with `npm run build`