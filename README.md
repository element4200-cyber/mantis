# BuggPad — mantis behavior lab

Interactive WebGL battlefield with a procedural, articulated praying mantis, autonomous hunting, flying prey, strike particles, radar, a trade chart, and live aggression telemetry. Its modular specimen-viewer layout is inspired by Virtual Fly Brain. The model is original procedural geometry, not a mantis scan or copied biological data.

## Use it

Run `node scripts/build.mjs`, then `node scripts/dev.mjs` and open `http://127.0.0.1:4173`. Demo trades are clearly labeled and never represented as real market activity. Buy/sell buttons and automatic demo trades drive intensity, movement, strike frequency, particles, and prey density. Drag to orbit, scroll to zoom, and use the specimen layer controls. Sound is opt-in.

After launch, open **Owner settings** at `/admin`, sign in with the ChatGPT account that owns this Site, paste the Solana contract address or Pump.fun token URL, and save. Only that owner can change the CA or return everyone to demo. Settings are stored in D1 and shared by all viewers. Browsers refresh the configured CA every ten seconds; they cannot choose another live-feed token. Changing token resets session trade history. Repeated trade IDs are deduplicated. Quiet periods gradually cool aggression. The token link changes to the real Pump.fun coin page. The launch button always opens https://pump.fun/create.

The deployed Site has its owner's verified account email in the server-side secret `BUGGPAD_OWNER_EMAIL`. Anonymous and other-account writes are rejected. The owner's Site-specific user ID is pinned on the first authorized save. No visitor can claim ownership. Sites supplies sanitized authenticated identity headers and owns the `/signin-with-chatgpt` flow. A different hosting provider must supply verified identity and strip spoofed identity headers before exposing these routes; bare HTTP headers are not an authentication mechanism outside Sites. Do not embed the owner secret in frontend files. The public website remains accessible without signing in.

For local owner-interface preview only, set `BUGGPAD_DEV_OWNER=1` when running the loopback development server. Local D1 data is stored in ignored `.sites-runtime/local.sqlite`. This simulated local identity is never included in the deployed Worker. Production schema comes from Drizzle migrations. To change the schema, install the locked dependencies and run `node node_modules/drizzle-kit/bin.cjs generate --config drizzle.config.ts`.

## Live feed configuration

The default backend reads confirmed Solana transaction logs through the public mainnet RPC. It validates the token account, synchronizes to the current transaction before displaying new trades, and decodes Pump.fun's documented TradeEvent discriminator, mint, SOL amount, token amount, direction, and timestamp. It only counts successful trades from the official program. Ordinary token transfers are not trade events. RPC polling is delayed and rate-limited; it cannot guarantee every trade during extreme activity or upstream outages. Backlogs and outages are shown in the UI. PumpSwap fallback prices use signer balance changes and are estimates.

For reliable polling, set the server-side `SOLANA_RPC_URL` environment variable to a dedicated Solana RPC endpoint. It is never sent to the browser.

For low-latency, high-volume trades, set the server-side secret `PUMPPORTAL_API_KEY` to a funded PumpPortal key. The client automatically chooses the WebSocket relay when it is configured. PumpPortal currently meters token trades at 0.01 SOL per 10,000 events and requires a funded linked wallet; each open viewer subscribes separately. No paid feed is active by default. Never place a provider key in frontend files or paste it into the CA field. Provider outages cannot guarantee lossless events across reconnections.

The chart shows observed SOL-per-token trade prices for the current session, not historical candles or an official Pump.fun chart. USD or USDC pairs need an additional quote decoder. A real token has not been connected or tested because it has not launched yet.

## Build and validate

`node --check web/app.js`

`node scripts/test-feed.mjs`

`node scripts/test-settings.mjs`

`node scripts/build.mjs`

`node scripts/validate-artifact.mjs`

Source assets in `web/` are embedded into a single Worker during build. Author the source files, not `worker/index.js` or `dist/server/index.js`. No external 3D asset or image generation is required. Three.js 0.180.0 is vendored with its MIT license; fonts load from Google Fonts with local font fallbacks.

## References

- Viewer layout: https://v2.virtualflybrain.org/org.geppetto.frontend/geppetto?id=VFB_00101567&i=VFB_00101567
- Official Pump.fun program and IDL: https://github.com/pump-fun/pump-public-docs
- Solana transaction RPC: https://solana.com/docs/rpc/http/gettransaction
- Optional streaming provider: https://pumpportal.fun/data-api/real-time/
- Three.js: https://threejs.org/docs/
