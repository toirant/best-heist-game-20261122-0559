# The Marlow Job

A neon-noir heist game for the make.fun bounty **best-heist-game-20261122-0559**
($50 shared by the top 10).

Tonight the Marlow Gallery hangs the Star Sapphire — and you are going to
take it. Sneak through three rooms (the Gallery, the Vault Hall, the
Rooftop), slip past patrolling guards and sweeping security cameras, lift
the loot and reach the getaway. Every tool costs money, so the payout is
the loot minus what the job needed.

## How to play

- **WASD / Arrows** — move
- **Shift** — sneak (slower, much harder to spot)
- **Click** — toss a coin to lure a guard (3 per room)
- **Q** — smoke pellet, hides you for a few seconds ($150)
- **E** — EMP burst, freezes all cameras for 6 seconds ($150)
- **F** (hold, inside the ring) — crack the vault safe
- **M** — mute, **R** — retry after being busted

Watch the **ALARM** meter: it climbs whenever a guard or a camera has eyes
on you, and falls when you break line of sight. At 100% the job is blown.
Grab the target loot, then reach the green EXIT.

## What is in the game

- 3 rooms with different floor plans, each with at least two routes to the
  target: a fast open lane under the cones, and a slow covered lane behind
  the display cases and pillars.
- Guards with raycast-clipped vision cones: they patrol, pause to scan,
  investigate noises, and give chase when they are sure.
- Wall-mounted cameras sweeping their cones on a steady rhythm — time the
  gaps, or spend the EMP.
- Loot with real values (paintings, gems, the Star Sapphire, the Marlow
  Diamonds in a crackable safe, the Marlow Crown), a live loot total, and a
  take-home payout on the getaway screen.
- Synthesized WebAudio sounds only — no audio files, no network requests.

## Layout

- `main.ts` — hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `/output/dossier.json` via `vendor/makefun-game.ts`.
  Run it with `MAKEFUN_OUTPUT_DIR=out node main.ts`.
- `game/index.html` + `game/src/` — the game, one file per job: config,
  levels, vision, guards, cameras, player, audio, input, render, shots,
  main. No libraries, no build step.
- `screenshots/` — real renders of the game running in a browser.
- `vendor/makefun-game.ts` — the kit's copy, unchanged.

## Play it

Serve `game/` with any static server and open `index.html` in desktop
Chrome, for example:

```sh
cd game && python3 -m http.server 8080
```

## License

MIT — see `LICENSE`.
