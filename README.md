<div align="center">

<img src="public/favicon.svg" alt="Stake Engine Seed Checker" width="72" height="72" />

# Stake Engine Seed Checker

Verify any **Stake Engine** slot with your revealed server seed, client seed and nonce range.
Check every payout, your RTP and your balance curve, straight from the browser.

**[Open the app](https://ffunnyto.github.io/stake-verifier/)** · **[Report an issue](https://github.com/ffuNnyto/stake-verifier/issues)**

</div>

> Unofficial tool. Not affiliated with Stake or Engine.

## Features

- Search **5,500+ games** from **1,500+ publishers**, with their cover art. Valkyrie and Colorful Play come first.
- Pick the **math version** and the **mode** (base, ante, bonus...) and see each mode's RTP.
- Verify up to **50,000 bets** per run. The range is split into requests the service accepts.
- Results: bets checked, **run RTP vs expected RTP**, hit rate, biggest win and total returned.
- **Balance chart**: one point per nonce, hover a point to see its payout multiplier and running balance.
- List of every winning bet, with **CSV export**.
- **Replay dialog**: click a winning bet (or any point of the balance chart) to watch its official replay, even for a nonce that was never played. The event your seeds land on is found in the browser with the public fair service. Each game shows a badge: **Replays available** or **Replays not yet**. Replays only exist for the games whose game id is included in `src/lib/knownReplays.json` (partial coverage).
- SHA-256 of your server seed, to compare with the hash Stake showed before you bet.
- **Random seeds** button to simulate a run.
- Shareable links per game: `?game=<publisher>/<slug>&version=<n>&mode=<name>`.
- No backend, no accounts, no API key.

## How to use it

1. On Stake, rotate your seed pair so the **server seed is revealed**.
2. Open the game you played and select its math version and mode.
3. Paste the server seed and the client seed, and set the first nonce and the number of bets.
4. Press **Verify**.

The nonce of a bet is shown in its details on Stake. Nonces are counted per seed pair.

## How it works

Stake Engine games are provably fair. For each bet the outcome is derived from the seeds and the nonce:

```
rand  = HMAC_SHA256(key = serverSeed, message = "<clientSeed>:<nonce>")   // first 16 bytes as a big-endian integer
rand  = rand mod weightSum
event = the event whose weight range contains rand
```

The payout is the one attached to that event in the game's published math tables.

This app does not download those tables. It asks the public fair service of Stake Engine, which returns the payout of every nonce:

| Endpoint | Used for |
| --- | --- |
| `GET https://fair.stake-engine.com/catalogue` | Games, math versions and modes, loaded when the page opens |
| `POST https://fair.stake-engine.com/peek` | Payout of each nonce for the given seeds (`nonceEnd` is exclusive, about 10,000 nonces per request) |
| `POST https://fair.stake-engine.com/outcome/{team}/{game}/{version}/{mode}` | The roll and payout of a nonce |
| `GET https://fair.stake-engine.com/event/{team}/{game}/{version}/{mode}?from=&to=` | Weight range of events, searched to find the event a roll lands on |

Both endpoints allow cross-origin requests, so the app runs entirely in the browser and can be hosted as static files.

Privacy: your seeds are only sent to `fair.stake-engine.com`, in the request body. They are never put in the URL and never stored. Game thumbnails go through the free [wsrv.nl](https://wsrv.nl) resizer and fall back to the original image.

## Tech stack

- [Vite](https://vite.dev), [React](https://react.dev) and TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com)
- [Recharts](https://recharts.org) for the balance chart, loaded only when a result is shown

## Project structure

```
src/
  components/    app components (GamePage, Verifier, Results, ProfitChart...)
    ui/          shadcn/ui components
  hooks/         catalogue loading, URL routing, SHA-256
  lib/           API client, catalogue helpers, chart series, hashing, formatting, types
```

## Development

Requires Node.js 22 or newer.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build into dist/
npm run lint
```

Settings you may want to change are in `src/lib/constants.ts`: the featured publishers, the excluded publishers and the request limits.

## Replay data

The replay game ids live in `src/lib/knownReplays.json` (`team/game` to front-end URL and game id). Engine does not publish them, so the list is partial and grows as ids are collected.

## Notes

- Stake's in-house games (dice, plinko, keno...) use a different fairness system and are excluded.
- The tool can only verify what the fair service exposes. If a game, version or mode is missing from the list, it is not available there.
- Never commit a `.env` file or any key. This app does not need one.
