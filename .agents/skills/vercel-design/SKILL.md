# Skill: vercel-design

# Vercel Design System for EventPulse Frontend

Apply whenever building or reviewing UI in `D:\PROJECT\event\frontend`. This
overrides the dark/glassmorphism direction in `react-frontend` skill — the
project is Vercel-style light. **Design-only changes: never alter logic, state,
API calls, or data flow.**

## 1. Visual Thesis

White gallery (`#ffffff`) with near-black text (`#171717`). Every element earns
its pixel. Minimalism as engineering principle, not decoration.

- **Geist Sans** (loaded in `app/layout.tsx` via `next/font`), aggressive
  negative letter-spacing: `tracking-tight` (-0.025em) / `tracking-tighter`
  (-0.05em) on headings. NEVER positive letter-spacing on Geist.
- **Shadow-as-border**: no CSS `border` on cards/inputs — use theme shadows.
- Optical alignment: ±1px when perception beats geometry.

## 2. Tokens (defined in `app/globals.css` `@theme`)

Colors: `background` `#fff` · `foreground` `#171717` · `muted` `#666` ·
`subtle` `#a1a1a1` · `hairline` `#eaeaea` · `surface` `#fafafa` ·
`surface-hover` `#f2f2f2` · `inverse` `#171717` · `blue` `#0070f3` ·
`success` `#059669` · `warning` `#d97706` · `danger` `#e5484d` ·
`focus` `hsla(212,100%,48%,1)`.

Shadows: `shadow-hairline` (1px ring) · `shadow-hairline-strong` ·
`shadow-card` (ring + ambient) · `shadow-card-hover` · `shadow-elevated`
(modals/menus) · `shadow-button` · `shadow-focus-ring` (input focus).

Fonts: `font-sans` (Geist) · `font-mono` (Geist Mono). Use `tabular-nums` for
number columns.

Radii: buttons/inputs `rounded-md` (6px) · cards/modals `rounded-xl` (12px) ·
pills `rounded-full`. Child radius ≤ parent radius, concentric.

## 3. Primitives (`components/ui/`)

- `Button` — variants `primary | secondary | ghost | danger | link`, sizes
  `sm | md | lg`, `loading` prop (spinner, label preserved, auto-disabled).
  Import: `import { Button } from "@/components/ui/button"`.
- `Input` `Textarea` `Select` `Label` `Field` — from `@/components/ui/input`.
  Inputs are 16px (iOS zoom safe), focus = `shadow-focus-ring`, no outline
  (that IS the focus replacement). NEVER block paste.
- `Card` `CardTitle` `CardDescription` — `@/components/ui/card`, `hover` prop
  for elevation lift.
- `Badge` — variants `neutral | success | warning | danger | info`, optional
  `dot`. Status = text label + color, never color alone.
- `Skeleton` `Spinner` — `@/components/ui/skeleton`. Skeletons must mirror
  final content layout (no CLS).
- `cn()` at `@/lib/utils`.

Global `:focus-visible` outline (blue, 2px) covers bare links/buttons — do not
add `outline-none` unless you provide a replacement (e.g. input ring).

## 4. Rules

### Do
- Shadow-as-border for cards, inputs, menus. Multi-layer shadows (ring +
  ambient) to mimic light. Example: `0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)`.
- Title Case headings & buttons. Sentence case on marketing copy.
- Active voice, 2nd person: "Install the CLI", not "will be installed".
- Specific button labels: "Send Inquiry", never "Continue" or "Submit".
- Numerals for counts ("8 inquiries"), non-breaking space before units
  (`10&nbsp;km`, `⌘&nbsp;K`).
- Real ellipsis `…`, curly quotes `“ ”`, `&` over `and` when constrained.
- Hover/active/focus states must be visibly higher contrast than rest state.
- Skeletons mirror final layout; images get explicit `width`/`height`.
- Tabular nums for prices, counts, dates in lists.
- `aria-label` on icon-only buttons; `aria-hidden` on decorative icons;
  `alt` on meaningful images (`alt=""` if decorative).
- `<a>`/`Link` for navigation, `<button>` for actions — never swapped.
- Only animate `transform`/`opacity`; explicit transition properties, never
  `transition: all`. Honor `prefers-reduced-motion` (global fallback exists).
- URL as state for filters/tabs/pagination where feasible (`nuqs` not
  installed — use searchParams-backed state or keep simple).
- Generous hit targets ≥24px; label + control share one hit target.
- Constructive error copy: state the fix, not just the problem.

### Don't
- No gradients on buttons/logos/cards. No glow, no glassmorphism, no
  `backdrop-blur` decoration. No purple/indigo/pink as primary.
- No positive letter-spacing on Geist.
- No `rounded-2xl`/`rounded-3xl` soup — cards are `rounded-xl`, buttons/inputs
  `rounded-md`, inner elements smaller (nested radii).
- No `border` utilities for card/input outlines — use shadow tokens (dividers
  between rows: `border-hairline` is OK).
- No `transition: all`, no animating `height`/`width`/`top`.
- No blocking paste, no `user-scalable=no`, no `autoFocus` on mobile.
- No `div` as link, no `span` as button.
- No `outline-none` without visual replacement.
- No emoji as UI icons — use `lucide-react`.
- No hardcoded hex when a token exists.
- Don't render color-only status — always include the text label.

## 5. Layout & Performance

- Flex/Grid over JS measurement; never read layout in render.
- `min-w-0` on flex children holding text (truncation).
- `overflow-x-hidden` on page containers; `overscroll-behavior: contain` in
  modals/drawers; lock body scroll when modal open.
- Virtualize lists >50 items; below that, plain map is fine.
- Preload above-fold images (`priority` on `next/image`), fonts already
  handled by `next/font`.
- Full-bleed layouts: `env(safe-area-inset-*)`.

## 6. Copy & States

- Destructive actions: confirmation modal or undo window.
- Optimistic updates with graceful rollback.
- Submit buttons: enabled until flight → then disabled + spinner, original
  label kept, ~150–300ms show-delay to avoid flicker.
- Placeholders signal emptiness: end with `…`, show example pattern
  (`name@company.com`, `sk-012345679…`).
- Loading/empty/error states all get real copy, not spinners-only.

## 7. Anti-AI-Slop Check (before finishing)

- [ ] No purple gradients, glows, glass, or emoji icons.
- [ ] Type does the talking: tight tracking on display, muted 14px support text.
- [ ] Monochrome first; accent color used sparingly (links, focus, status).
- [ ] Hairline separators (`border-hairline`) over nested boxes where possible.
- [ ] Spacing on 4/8 grid; sections padded 64–96px vertically.
- [ ] Everything keyboard-reachable with visible blue focus.
- [ ] Screens still function identically (logic untouched).
