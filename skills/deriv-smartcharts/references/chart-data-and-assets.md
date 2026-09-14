# Chart data and runtime assets

Two host responsibilities that are easy to miss and produce confusing failures: supplying the chart's market metadata, and serving the files the chart loads at runtime.

## `chartData`: active symbols plus trading times

The chart's market selector and its "is this market open" logic read a `chartData` object the host supplies. At the installed version the chart makes no market requests of its own, so there is nothing to switch off: the `feedCall` prop was observed inert, and `shouldFetchTradingTimes` — despite its name — gates whether the chart *processes* the trading times you pass, and that processing is what resolves its internal trading-times promise. Setting it to `false` was observed to let the first `initialize()` finish while leaving that promise unresolved, so the hang starts on the second `initialize()` — any remount, and `StrictMode` in development — because the statically held store keeps its initialised flag and hands back the never-resolved promise, leaving the chart on "Retrieving Trading Times..." with no error; leave it at its default. No trading-times map is built either, so `isMarketOpened` was observed returning `undefined` and `getDelayedMinutes` throwing on the missing entry. Confirm both props against the installed version. Assemble both halves from the application's existing discovery layer:

- **Active symbols.** Reshape the application's active-symbol list into the array the chart expects. Read the chart's expected fields from the package README — or, where the README omits them, the component source at the installed version — and the API's field names from `get_schema` on the active-symbols response; map New API names (such as the underlying symbol and its display name) onto the chart's names deliberately. Keep every field defined — the chart sorts and formats these values without null checks in current versions, so a missing display name or pip value crashes the market list. `market` and `submarket` were observed arriving from the New API as codes rather than translated names, with `underlying_symbol_name` the only display string observed, so derive those labels client-side and give the chart a defined value for each one; `underlying_symbol_type` was observed empty for some symbols, so fall back rather than formatting it directly. None of that is a schema promise: confirm each of those fields with `get_schema` / `get_field` before relying on the shape. Watch the two `pip_size` fields: the `active_symbols` value was observed as a minimum fluctuation amount and the `ticks_history` value as a decimal-place count for the same symbol, so read each one's description with `get_field` and convert deliberately before handing a precision to the chart. Never let a discovery failure be reported as a connection failure: log the underlying cause, so a type error thrown while shaping `chartData` is not read as a dropped socket.
- **Trading times.** Fetch the trading-times endpoint (resolve it with `search_endpoints`; read its shape with `get_schema`) and reduce each symbol's open/close windows into the map the chart expects. Give **every active symbol** an entry, even a synthetic all-day or closed one: the chart looks a symbol up in this map when it fetches initial data and throws if the entry is absent. The chart was observed passing each entry's open and close values to `new Date(...)` and comparing the result against the clock, so a bare `"00:00:00"` / `"23:59:59"` clock string from the API parses as an invalid date, every comparison is false, and the symbol renders as closed. Build each value as a full ISO 8601 UTC timestamp anchored to the current UTC day, and roll an all-day `"23:59:59"` close to the next midnight because the chart's window was observed to be half-open. Confirm the shape against the installed version.
- Return `chartData` only when both halves are ready so the chart mounts with a complete map; render a placeholder until then.

Treat these as discovery reads shared with the rest of the application: fetch once per connection, cache briefly, and revalidate on reconnect — not on every render.

## Runtime assets and the public path

The package lazy-loads its chart engine, code chunks, fonts, and sprite sheets at runtime instead of bundling them. Two steps make that work:

1. **Serve the distributed assets.** Copy the package's `dist` chunks (`*.smartcharts.*`), its stylesheet, and its `chart/assets` directory into a location your app serves as static files, at install and build time, so a version bump of the package refreshes them without committed binaries. Read the package README's webpack notes for the exact file set for the installed version.
2. **Declare where they live.** Call `setSmartChartsPublicPath` once, before the chart mounts, with the URL prefix those files are served from — and include any deployment base path (a preview environment served under a sub-path needs that prefix, or every lazy load 404s).

Import the package stylesheet once at the application root.

## Runtime pitfalls

- **Duplicate React.** Check the installed package's `package.json` for how it declares `react`: when React is a dependency rather than a peer dependency, the package brings its own copy and the host ends up with two React instances, which fails as an invalid hook call and a blank canvas. Dedupe to a single React instance the host controls (a bundler alias or a resolution override) and match the host's React major to the one the package was built against.
- **Stale service worker.** The package's distribution includes standalone-app bootstrap and service-worker files that the embedded chart does not use. Do not serve them: a registered chart service worker caches engine files and can serve a stale engine after a deployment, producing a blank canvas. Exclude those files when copying assets, and unregister any previously registered chart service worker on startup.
- **Mount race under concurrent rendering.** The chart engine initialises asynchronously from the component constructor and attaches to a DOM element on mount. Under React 18 concurrent rendering, a fast engine can initialise against a detached element and render blank. Mount the chart only after the host component has committed (for example, gate it behind a mounted flag set in an effect).
- **React `StrictMode` breaks the mount.** StrictMode's development double-mount — setup, cleanup, setup — was observed calling the chart store's destroy, which sets its destroyed flag and never clears it. On the second mount `init()` still runs and sets the trading-times loader; what returns early is the callback that runs after `tradingTimes.initialize()` resolves, because destroy had set `isDestroyed` on the preserved store — so no symbol is selected, the loader is never cleared, and the chart hangs on "Retrieving Trading Times..." with no console error. Look for that check in the post-`initialize()` callback, not in `init()`. Production builds do not double-mount and are unaffected. Do not render the chart inside `<StrictMode>`; the mounted-flag gate above does not prevent this, because the flag does not stop the cleanup that destroys the store.

## Appearance and device

- Drive the chart theme from the application's resolved theme through the chart `settings`; the chart does not read the host's CSS variables.
- Use `isMobile` to switch the chart into its mobile layout, trim toolbar widgets for small screens, and cap the visible points/candles so touch interaction stays usable.
- Give each chart instance a stable `id` if you want its layout and indicators persisted across reloads; omit it for a fresh chart each time.

## Verify

- `chartData` contains an entry for every active symbol in both halves, including symbols the trading-times response omitted.
- The lazy assets resolve under the deployed base path (test the preview or sub-path deployment, not only the root).
- No chart service worker is registered after first load.
- The chart renders a non-blank canvas on a cold load with a warm engine cache.
