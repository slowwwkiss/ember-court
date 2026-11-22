# Ember Court

A duel of cinders: an original trick-taking card game for the make.fun
best-card-game bounty. Two duellists, twenty life each, one shared deck of
36 cards in four suits — Ember, Tide, Leaf, Stone.

## How to play

- Each trick, both duellists play one card at once. The higher card wins the
  trick; the loser takes damage equal to the gap.
- Elements matter: Ember scorches Leaf, Leaf drinks Tide, Tide douses Ember.
  A card with the edge counts +2. Stone is neutral.
- The 9s are court cards with powers of their own:
  - **Phoenix (Ember 9)**: lose a trick and still deal 2 damage.
  - **Mirrorpool (Tide 9)**: lose a trick and the damage is reflected.
  - **Bloom (Leaf 9)**: win a trick and heal 4 life.
  - **Bulwark (Stone 9)**: win a trick and the loser discards a card and
    draws anew.
- First duellist at zero life loses. A duel lasts a few minutes.

Click a card (or press 1–5) to play it. Enter begins, R starts a new duel.
Synthesized sound effects need no files. The game runs entirely offline from
its own static files.

## Play it

```
node serve.ts
```

then open http://localhost:8080.

## Hand it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## Layout

- `game/index.html` — the page shell
- `game/src/config.js` — tuning, suits, powers, colours
- `game/src/deck.js` — the 36-card deck
- `game/src/rules.js` — trick resolution and the rival's evaluation
- `game/src/world.js` — the match: hands, life, tricks, phases
- `game/src/render.js` — everything the eye sees, on canvas
- `game/src/input.js` — mouse and keyboard
- `game/src/sound.js` — synthesized sound effects
- `game/src/shots.js` — the deterministic screenshot scenes
- `game/src/main.js` — boot and the one loop
- `tests/logic.test.mjs` — rules and whole-match tests (`node tests/logic.test.mjs`)
- `vendor/makefun-game.ts` — the kit's library, unchanged
