# Build and debugging notes

## Implemented

A complete cross-device game with 2–8 players, six-character room codes, share links, three rounds, separate private clues, shared beacons, server-owned scoring, results, tied winners and rematches.

## Observed and resolved

1. Static type checking found untyped JSON responses. Added explicit response types and verified TypeScript successfully.
2. Mobile visual inspection showed action buttons above the field, requiring extra scrolling after choosing a flower. Moved actions to a fixed phone control bar and placed the private clue across the full width.
3. Added Escape dismissal, keyboard focus containment, and focus restoration to the rules dialog.

## Local test results

Five game-logic suites passed, including 40 randomized complete games. Two independent browser sessions passed a complete three-round game with 525-point tied winners and rematch. One session used a 390px phone viewport. No browser exceptions or horizontal overflow were observed. Refresh preserved the player's identity and current game.

Eight-player concurrency checks passed: seven simultaneous joins, rejection of a ninth player, rejection of invalid credentials, blocked mid-game joins, eight simultaneous signals and locks, one reveal, and 175 points per player.

Production build and TypeScript checks passed. Public-deployment verification is recorded separately in the submission handoff.

## Intentional limits

State refreshes approximately every 1.2 seconds. Rejoining is supported by refreshing the same tab; a closed tab or another browser does not inherit the seat. Room codes expire after twelve hours. Real-device network testing with a friend is still useful before submitting, beyond the independent browser-session tests.
