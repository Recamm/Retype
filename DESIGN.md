# Retype

## Identity

A quiet typing tool. The first screen is the test: compact controls, three
lines of text and restart. The wordmark and keyboard icon identify Retype
without competing with the text. Do not copy Monkeytype branding.

## System

- Manrope Variable for UI; IBM Plex Mono for typing and numerical metrics.
- Theme defaults to the system preference and follows changes while open.
  Light and dark overrides remain configurable; preserve saved preferences.
- Dark: neutral charcoal #292b2e, tool surfaces #232528, text #dce0e3,
  muted text #a6abb0, reference text #93999f and green accent #71c68e.
- Green marks the cursor, brand, selected controls and primary result. Errors
  remain coral and underlined. Do not tint the background green.
- Brand assets live in `public/brand/`: a transparent keyboard logo and a clean
  charcoal banner, supplied as SVG masters and high-resolution PNG exports.
  The README uses the PNG banner to preserve the local Manrope typography.
- Center practice vertically when space allows. Show three complete text lines,
  reserve space for live metrics and reveal those metrics only during a run.
- Compact icon navigation with accessible names and tooltips. No promotional
  headings, motivational copy, decorative numbering, beta tags or entrance effects.
- Daily-goal and keyboard-preview panels do not belong on the typing screen.
  History, training and error maps remain in Progress and Results.
- Unframed layouts; controls have no decorative containers or shadows.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64 pixels. Radius at most 8 pixels.
- No gradients, hero banners, ornamental illustrations or nested cards.
- Use Lucide icons, visible focus and accessible names for every icon button.
- Settings in dedicated view. Modes use segmented controls; binary options use
  checkboxes; numeric settings use selects or segmented controls.
- Typing errors use underlines as well as color. Motion respects reduced motion.
- Responsive layouts from 320px; verify 375px mobile, 1440px desktop and short
  desktop viewports. Keep restart visible without shrinking typing text.
- Touch targets at least 44px. Text contrast at least 4.5:1 in both themes.

## Metrics And Data

WPM = current correct graphemes / 5 / elapsed minutes. Raw = inserted attempts /
5 / elapsed minutes. Accuracy = correct insertion attempts / all attempts.
Corrections do not erase attempts. Consistency is 100 minus the coefficient of
variation of sampled cumulative WPM, clamped to 0-100. Empty tests are not saved.
Timed tests continue while the tab is hidden and end at their exact deadline.
History stores summaries, errors and downsampled charts, never custom source text.
Compare records only within matching mode, language, length and modifiers.
