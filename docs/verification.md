# Verification — Signal Garden

Public URL: https://signal-garden-aman.amankumars221.chatgpt.site

Published on October 30, 2026. Sites version 1. Source commit: `fa647c8eebaa18e3c0de242d5c5b9459da6dc889`.

## Passed

- Production build and TypeScript compilation.
- Five game-logic test suites: full scoring progression, private view filtering, timeout scoring, invalid action rejection, and unique flower fields over 40 randomized games.
- Public site opened in clean, independent browser contexts without sign-in.
- Desktop browser at 1500 × 1000 and mobile browser context at 390 × 844.
- Interactive tutorial and practice answer.
- Create room and join through an invitation URL.
- Live cross-session beacon updates and distinct private clues.
- Same-tab refresh retains the player identity and round.
- Concurrent answer locking, three complete rounds, 175/350/525 scoring, shared winners, and rematch.
- No horizontal mobile overflow or browser JavaScript exceptions in the full game.
- Public API: seven simultaneous joins, eight-player capacity enforcement, invalid credential rejection, blocked mid-game joining, eight simultaneous signals and locks, single result transition, and correct 175-point scores.

## Issue isolated during production testing

The original browser-test waiting helper allowed an immediate read while an answer request was still pending. The test saw the prior state and reported a scoring mismatch. Replaced that helper with explicit bounded polling of the expected phase; the full public game then passed with both players scoring 525. The application already polls and ignores older state versions; no scoring-code change was required.

## Scope and limits

These are automated browser-context tests, including mobile viewport and touch emulation, rather than a physical-phone playtest. A short game with a friend is a useful final human review. State is polled approximately every 1.2 seconds. Expired or closed-tab sessions have the limitations described in the source README.

This record covers the game build and deployment; it does not certify a competition submission.
