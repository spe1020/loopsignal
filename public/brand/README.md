# LoopSignal brand assets

Source of truth for the selected infinity-style loop mark, palette, and lockups.

The loop represents continuous improvement. The orange point represents the signal that creates action.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| Industrial Orange | `#E4571E` | Accent dot, CTAs, eyebrows, the tagline period |
| Charcoal | `#1F1F1F` | Loop mark, wordmark, primary text |
| Medium Gray | `#7A7A7A` | Tagline, secondary text |
| Light Gray | `#E6E6E6` | Favicon tile, dividers, subtle UI |

Orange is an accent. Do not flood pages with it. Do not overuse infinity imagery.

## Loop mark

Open infinity / figure-eight. Uniform stroke, rounded caps, gap at the top-right of the right loop. Industrial orange dot sits in that gap.

- Light backgrounds: charcoal mark, orange dot
- Dark backgrounds: white mark, orange dot retained
- Monochrome: mark and dot the same color; no orange

## Lockups

| Context | Treatment |
| --- | --- |
| Site header | Horizontal: mark left, LoopSignal wordmark right |
| Footer | Horizontal with supporting tagline |
| Mobile / tight | Same lockup, slightly smaller; mark-only if space is truly constrained |
| Favicon / app icon | Mark only, on the light-gray or charcoal tile |

Primary line: **Improve the process. Connect the systems.**

Supporting line: **Find the signal. Close the loop.** with an orange period.

## Files

- `loop-mark.svg` — charcoal mark, transparent background
- `loop-mark-on-dark.svg` — white mark, orange dot
- `favicon.svg` — light-gray rounded tile
- `app-icon.svg` — charcoal tile for home-screen / social use

The live site renders the mark from `components/Logo.tsx` using geometry in `lib/brand.ts`.
