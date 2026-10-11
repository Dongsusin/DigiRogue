# Main menu backdrop

The title screen uses MenuBackdrop, separate from the battle/game state. The same backdrop remains mounted while browsing the starter menu, skills, village and settings.

- A map stays visible for nine seconds, followed by a 2.6-second crossfade. The next map is selected without immediately repeating the current map and is preloaded/decoded during the dwell.
- Failed or stalled image loads keep the last visible map; the next cycle retries. Image requests have an eight-second deadline.
- Binary digits fall using transforms and alternate between zero and one. Reduced-motion devices use slower movement and slower digit changes instead of frozen digits.
- Hidden tabs pause the decorative animations and timers. Returning to the tab starts a fresh dwell; stale load results and unmounted timers cannot change the screen.
- The battle screen unmounts the backdrop. Digit loops update only the small backdrop component, not App.

Regression check: node --test scripts/verify-menu-backdrop.mjs

Validation: docs/validation/menu-backdrop-2026-10-11.json. Browser checks cover standard and reduced-motion media, changing digit positions and glyphs, multiple different backgrounds, and returning from settings. They are not a full battle playthrough or a production deployment check.
