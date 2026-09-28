# Called — Identity Specification

The source of truth for the Called mark, wordmark and lockups.

Regenerate every asset in this directory with:

```
npm run gen:brand
```

Nothing here is hand-drawn in a raster editor. Geometry lives in
`lib/brand/geometry.ts`, SVG assembly in `lib/brand/svg.ts`, and
`scripts/generate-brand.ts` writes the files. The rasterised app icons are
produced separately by `scripts/generate-icons.ts` (`npm run gen:icons`), which
reads the same geometry.

---

## 1. The mark — "Sealed Arc"

A near-closed arc, open at the three o'clock position, with a solid square
blocking the opening and sitting proud of the stroke.

The mark carries the whole argument of the product in one silhouette:

- the arc is a `C` for Called, and a link in a chain;
- the opening is the moment before an outcome exists;
- the block is the commitment that closes it — evidence, not a promise;
- the block is also one point on a probability scale;
- the flat, cut arc terminals are records with a timestamp.

The mark never means "crypto". It means *something was committed before the
outcome existed*.

### Construction

| Property | Value |
| --- | --- |
| Canvas | `64 × 64` |
| Live area | `56 × 56` (4 units clearspace on every side) |
| Arc radius | `21` |
| Stroke | `6` monoline, `fill="none"` |
| Stroke cap | `butt` — flat, sharp, never round |
| Opening | `44°` centred on the three o'clock axis |
| Seal block | solid square, side `2.4 × stroke` (= `14.4`), centred in the opening |
| Seal position | right edge sits ~3 units past the stroke's outer edge |

The seal block is the only filled element. Everything else is a single stroke.

### Micro construction

At `24px` and below a `6` unit stroke thins below two device pixels and the
opening closes up visually. Small sizes therefore use a second construction:

| Property | Display (32px+) | Micro (≤24px) |
| --- | --- | --- |
| Stroke | `6` | `8` |
| Seal side | `14.4` | `19.2` |

`iconConfigFor(size)` in `lib/brand/geometry.ts` selects between them. The
variant is chosen automatically, never by hand.

### Minimum sizes

| Context | Minimum |
| --- | --- |
| Mark alone, screen | `16px` |
| Mark alone, print | `6mm` |
| Full horizontal lockup | `96px` wide |
| Compact lockup | `120px` wide |

Below the minimum, use the mark alone — never the lockup.

---

## 2. Wordmark — "Called"

Custom letterforms, constructed as paths on the same grid as the mark. This is
**not** the Doto typeface set as text; it is drawn so the identity does not
depend on a font being installed.

| Property | Value |
| --- | --- |
| Cap height (`l`, `d` ascender) | `40` units |
| x-height | `28` units |
| Stroke | `6` — identical to the symbol stroke |
| Stroke cap | `butt` |
| Optical gap between glyphs | `10` units, uniform |
| Round glyph diameter | `28` units |
| View box | `0 0 218 64` |

Letterforms: `C` is the sealed-arc construction at wordmark scale, so the
wordmark and the mark share one idea. `a` is a single-storey round with a
right-hand stem. `l` and `l` are plain stems. `e` is a round crossed by a full
horizontal bar at its centreline. `d` is a round with a full-height right stem.
The rhythm is deliberately mechanical and tabular; tracking is even.

The wordmark is set in title case: **Called**. Never `CALLED`, never lowercase,
never with a `working name`, `prototype` or `beta` suffix unless the product
state genuinely requires it.

---

## 3. Lockups

Two lockups only. Both place the mark first, then the wordmark, with the mark's
optical centre aligned to the wordmark's x-height mid-line (+2 units of
vertical correction at scale 1).

| Lockup | View box | Wordmark offset | Use |
| --- | --- | --- | --- |
| Horizontal | `290 × 64` | `x = 74` | Footer, print, wide surfaces |
| Compact | `145 × 32` (0.5 scale) | `x = 74` before scaling | Header, navigation, tight space |

Clearspace around a lockup equals the cap height of one letter (40 units at
scale 1) on every side. Nothing crosses it.

---

## 4. Colour

The mark and wordmark are single-colour, `currentColor`, in every context. Only
the seal block is painted separately.

| Colourway | Mark | Seal block | Use |
| --- | --- | --- | --- |
| **Signature** | `--bone` `#ece9e4` | `--seal` `#ff5a36` | Primary. Dark surfaces. |
| **Seal** | `--seal` `#ff5a36` | `--seal` | Committed state, favicon, accent |
| **Mono black** | `#000000` | `#000000` | Single-colour black |
| **Mono white** | `#ffffff` | `#ffffff` | Single-colour white |

Primary presentation is bone on `--void` `#0a0a0b`.

**Colour rule.** `--seal` is reserved across the product for sealed, clickable
and broken-live data. The identity is the one sanctioned exception: the seal
block is vermilion because the block *is* the commitment. Never introduce a
third colour, never gradient the stroke, never tint the mark with `--mute`,
`--line` or `--ink`.

### Favicon

`app/icon.png` and `app/favicon.ico` use the **seal** colourway on a transparent
background — a single vermilion mark reads on both light and dark browser chrome.
`app/icon.png` is 512px, the ICO carries 16, 32 and 48px. `app/apple-icon.png`
stays bone-on-`#0a0a0b` and **opaque**, because iOS renders transparent
home-screen pixels as black.

---

## 5. Icon ladder

`brand/icons/` holds the mark at `16, 24, 32, 48, 64, 128`. Sizes at or below
`24` use the micro construction; `32` and above use the display construction.
Each file declares its own pixel dimensions.

---

## 6. Misuse

Do not:

- round the stroke caps, or add a round join anywhere;
- close the opening, or remove the seal block — the gap and the block are the
  mark;
- rotate, skew, outline, shadow or gradient the mark;
- place the mark on a busy image, or on a surface without 56 units of
  clearspace;
- recolour the seal block to anything but `--seal`, `--bone`, black or white;
- rebuild the wordmark by typing `Called` in Doto, or in any other typeface;
- use the mark at a size below `16px`, or the lockup below its minimum;
- add a tagline, badge, pill, border or container around either asset;
- reproduce any generic finance, blockchain, AI or prediction iconography.

---

## 7. Files

```
brand/
  symbol/       called-symbol-{bone,seal,black,white,signature}.svg
                called-symbol-micro-{...}.svg
  wordmark/     called-wordmark-{bone,seal,black,white}.svg
  lockup/       called-lockup-{horizontal,compact}-{...}.svg
  icons/        called-icon-{16,24,32,48,64,128}.svg
  construction.svg   the mark over its construction grid
  brand-sheet.html   flat presentation of the whole system
  SPEC.md            this file
  _archive/          the pre-2026 raster mark, kept for reference
```

React components that render the mark inline for the app live in
`components/brand/called-mark.tsx` — `CalledMark`, `CalledWordmark`,
`CalledLockup`. The app uses those rather than the SVG files so the mark
inherits `currentColor` and needs no network request.
