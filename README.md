[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/BGBug22/gta6-trophy-guide-01-v7-entry/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/BGBug22/gta6-trophy-guide-01-v7-entry/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

# Leonida Legend — GTA VI Trophy Guide

The complete, fully offline trophy guide for **Grand Theft Auto VI** on PlayStation 5: all **55 official trophies** (1 Platinum, 2 Gold, 6 Silver, 46 Bronze — 28 hidden), every step written fresh and cited against 10 public sources.

## What it is

A single-page web app (`app/`) that works with zero network requests:

- **Checklist, 3 columns** — Trophies | Guide | Sources. Click any trophy to see its steps, its sub-progress counter, and the sources that back it.
- **23 sub-progress counters** — 19 trophy counters (stunts, shooting-range golds, meditations, WAiNK scans, garages…) plus the 4 stunt-type breakdowns. Counters auto-earn their trophy at target.
- **My Notes** — a private note per trophy (✎), saved in your browser.
- **Spoiler shield** — the 28 hidden trophies stay blurred until you choose to reveal them.
- **Filters & search** — by grade, by text, hide-earned. Counts are always exact.
- **Roadmap** — 7 stages (S1–S7) from the opening mission to the Platinum, in order.
- **Sources & Audit** — all 10 sources with a LIVE LINK badge (HTTP 200 when checked) or TEXT ONLY (HTTP 403, cited by name), plus an audit summary and a flag list for the 3 unconfirmed / possibly-missable trophies.
- **Export / Import** — your progress (earned, counters, notes) as JSON, in `localStorage`.

## How to run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or hand it in directly:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` validates the trophy data before it copies anything: exactly 55 trophies, ids 1–55, the grade split 1P/2G/6S/46B, 28 hidden, at least one guide step and one cited source per trophy, 10 sources, and 19 sub-progress counters. A broken list is refused, loudly.

## Sources

Names and descriptions are the official PlayStation list as published 18 November 2026, cross-checked against Push Square, Exophase, PlanetGTA6, KeenGamer, GTA Vice City Hub, GamesFuze, EGamers, Sixshore, PlayStation, and Rockstar Games. See the Sources & Audit tab in the app for the full list with live-link status.

## License

MIT — see [LICENSE](LICENSE).
