# Moov Webapp Color Palette

Extracted from `src/index.css` (root CSS variables), `src/theme/index.tsx` (MUI theme overrides),
and usage frequency across `src/components/**` (hex literals used in `sx`/`style` props).

## Core brand tokens (defined as CSS variables)

| Token | Hex | Role |
|---|---|---|
| `--theme-green` | `#1DFB9D` | Primary brand accent (buttons, highlights, primary actions) |
| `--theme-black` | `#171B2D` | Primary dark surface (table headers, cards, disabled text) |
| `--theme-grey` | `#454957` | Secondary/muted text |
| `--inactive-green` | `#1A745B` | Disabled/inactive state of the brand green |
| `--theme-red` | `#CD1D69` | Error/destructive accent |
| `--theme-light-grey` | `#C6C7CD` | Light neutral text/border |

## Extended palette (from component usage, ranked by frequency)

| Hex | Approx. role / where used |
|---|---|
| `#1DFB9D` | Primary brand green (buttons, active states) |
| `#04A562` | Primary green — hover/pressed state |
| `#171B2D` | Dark navy — primary dark surface, disabled text |
| `#FFFFFF` / `#FDFFFF` | White / near-white surfaces & text |
| `#DFE0EB` | Light grey — secondary text on dark surfaces |
| `#9FA2B4` | Muted grey — placeholder text, secondary labels |
| `#CD1C69` | Red/pink — error, destructive, alert accents |
| `#4103CC` | Purple — chart accent, links |
| `#6F4B9F` | Purple (lighter) — tags, badges, secondary chart series |
| `#276E93` | Blue — "reminder" tag/event type |
| `#FECA00` | Yellow/gold — "order-tag" tag/event type, warning badges |
| `#454957` | Grey — secondary text |
| `#1A745A` | Muted green — disabled/inactive brand green |
| `#3F4253` | Dark slate — secondary surface |
| `#B2BAC2` / `#A0AAB4` | Neutral greys — borders, disabled text |
| `#12141D` | Near-black — darkest surface variant |
| `#000000` | Black |

## As CSS custom properties (drop into a `:root` block)

```css
:root {
  /* Brand */
  --moov-green: #1DFB9D;
  --moov-green-hover: #04A562;
  --moov-green-inactive: #1A745B;

  /* Neutrals / dark UI */
  --moov-navy: #171B2D;
  --moov-navy-alt: #12141D;
  --moov-slate: #3F4253;
  --moov-grey: #454957;
  --moov-grey-light: #C6C7CD;
  --moov-grey-muted: #9FA2B4;
  --moov-border: #DFE0EB;
  --moov-white: #FFFFFF;
  --moov-white-alt: #FDFFFF;

  /* Accents */
  --moov-red: #CD1D69;
  --moov-purple: #4103CC;
  --moov-purple-light: #6F4B9F;
  --moov-blue: #276E93;
  --moov-yellow: #FECA00;
}
```

## As a design-token JSON (for programmatic import)

```json
{
  "color": {
    "brand": {
      "green": { "value": "#1DFB9D" },
      "greenHover": { "value": "#04A562" },
      "greenInactive": { "value": "#1A745B" }
    },
    "neutral": {
      "navy": { "value": "#171B2D" },
      "navyAlt": { "value": "#12141D" },
      "slate": { "value": "#3F4253" },
      "grey": { "value": "#454957" },
      "greyLight": { "value": "#C6C7CD" },
      "greyMuted": { "value": "#9FA2B4" },
      "border": { "value": "#DFE0EB" },
      "white": { "value": "#FFFFFF" },
      "whiteAlt": { "value": "#FDFFFF" }
    },
    "accent": {
      "red": { "value": "#CD1D69" },
      "purple": { "value": "#4103CC" },
      "purpleLight": { "value": "#6F4B9F" },
      "blue": { "value": "#276E93" },
      "yellow": { "value": "#FECA00" }
    }
  }
}
```

## As a Tailwind `theme.extend.colors` snippet

```js
colors: {
  moov: {
    green: "#1DFB9D",
    "green-hover": "#04A562",
    "green-inactive": "#1A745B",
    navy: "#171B2D",
    "navy-alt": "#12141D",
    slate: "#3F4253",
    grey: "#454957",
    "grey-light": "#C6C7CD",
    "grey-muted": "#9FA2B4",
    border: "#DFE0EB",
    white: "#FFFFFF",
    "white-alt": "#FDFFFF",
    red: "#CD1D69",
    purple: "#4103CC",
    "purple-light": "#6F4B9F",
    blue: "#276E93",
    yellow: "#FECA00",
  },
},
```

## Notes / caveats

- This is a **reverse-engineered** palette, not a formally documented design system — the app defines
  only 6 CSS variables in `src/index.css`; everything else below that is inferred from repeated hex
  literals in component `sx`/`style` props (over 300 occurrences of `#1DFB9D` and `#171B2D` alone), so
  treat the "brand" and "neutral" groups as high-confidence and the "accent" tag colors as a smaller,
  looser set (used mainly for order/event tags and chart series, not a strict semantic system).
- There are minor casing/near-duplicate variants in the source (e.g. `#1dfb9d`, `#1DFA9D`, `#1bfc9d`,
  `#cd1c69` vs `#CD1D69`) — these were normalized to the single canonical hex shown above.
- No dark-mode variant exists in this codebase; the "dark navy" tones (`#171B2D`, `#12141D`) are used
  as the app's default dark surfaces, not a theme toggle.
