# Choose the chart before coding

An application built with these skills can render its price chart with either documented library, or with any other charting library the user prefers. **Lightweight Charts is the default.** Move to SmartCharts only when the requirements need something it alone provides, or when the user asks for it. Either way, state the choice and the alternative in one line so the user can override it without being blocked by a question. Both documented options share the same feed discipline — one shared WebSocket, the market-data skill's tick-history request and subscription, generation-keyed cleanup — so the choice is about what the library brings and what the application must build.

## The two documented options

| | SmartCharts (`@deriv-com/smartcharts-champion`) | Lightweight Charts (`lightweight-charts`, TradingView) |
|---|---|---|
| Skill | deriv-smartcharts | deriv-lightweight-charts |
| What it is | Deriv's full trading chart: the same component behind Deriv's own trading platform | A rendering library for financial series; no trading concepts built in |
| Built in | Symbol browser, trading-times awareness, chart types and granularities, technical indicators, drawing tools, barriers, contract markers with a documented lifecycle, mobile layout | Candles, line, area, baseline, histogram; streaming `update`; price lines; series markers; multi-pane; a primitives API for custom drawings |
| The application must build | The feed adapter and the `chartData` metadata (active symbols plus trading times) | The feed adapter **and** every trading feature: symbol picker, market-closed state, indicators if wanted, and the barrier/marker overlay layer (documented per family, adaptable from TradingView's official plugin examples) |
| Integration weight | Lazy-loaded chart engine and assets that must be copied to a served path; declares `react` as a dependency, so the host must keep a single React instance | One npm import, roughly 60 KB gzipped, one dependency, framework-agnostic DOM |
| Licence and attribution | ISC; no on-screen attribution | Apache-2.0; keep the default `attributionLogo` (a tradingview.com link) or provide an equivalent link on the page |
| Both need | The library's LICENSE (and NOTICE where present) text on the application's open-source-licences page | Same |
| Choose it when | The user wants a Deriv-grade terminal experience, indicators and drawing tools, or contract markers without building an overlay layer, and accepts the asset pipeline and React constraint | The user wants a small, self-contained app, a minimal bundle, or full control over the chart's look, and will build (or defer) the overlays they need |

Default to Lightweight Charts; escalate to SmartCharts when the requirements call for a trading terminal. A Lightweight Charts app that later needs contract results on the chart is a supported path — its overlay reference documents it — and does not by itself justify switching library.

## Any other library

The user is not limited to these two. If they name another charting library, use it — with three conditions:

1. **The user supplies the authority.** Ask for the library's documentation and the version in use (or fetch its official documentation); never invent its API from memory or from another library's shape. If no documentation is available, say so and stop rather than guess.
2. **The library-agnostic rules still apply.** One shared WebSocket owner and no chart-owned connection; history and live data from the market-data skill's tick-history request and subscription, keyed by symbol and granularity with generation-guarded cleanup; numeric strings normalised at one boundary from `get_schema`; overlays derived from proposal and open-contract state exactly as the SmartCharts overlay reference defines them, drawn with whatever that library offers; the chart never prices, buys, or sells.
3. **Licence obligations are checked, not assumed.** Read the library's licence and any NOTICE or attribution requirement, and ship the required texts and links.

Other libraries may be added as documented options later as demand appears; until then, treat them as user-supplied.

## Deciding

Apply these steps in order and record the outcome in one sentence in the plan or first response.

1. **The user named a library.** Use it — one of the two documented options, or any other library under the conditions above. Do not re-litigate the choice.
2. **Otherwise start from Lightweight Charts.** It is the default for every chart request that does not name a library.
3. **Escalate to SmartCharts only when the stated requirements match a capability Lightweight Charts lacks and building it is out of scope.** Escalation triggers:
   - built-in technical indicators or drawing tools are requested;
   - an in-chart symbol browser or market navigation is requested;
   - Deriv's standard contract visuals — barriers, entry/exit markers, running-contract pill and tick counter — are in scope *and* the user has not agreed to build an overlay layer;
   - the brief asks for parity with Deriv's own trading platform, a "full terminal", or "the same chart Deriv uses";
   - mobile-terminal behaviour (chart-mode toolbar, study legend, share) is part of the requirements.
4. **Stay on Lightweight Charts when SmartCharts cannot fit the host**, even if a trigger matched, and say so: a non-React host, a hard bundle-size limit, no way to serve the copied runtime assets under the deployment path, or a host that cannot keep a single React instance. In that case scope the missing features as application work.
5. **State the decision.** One line: which library, the requirement that decided it, and the alternative the user can switch to. Then read the selected skill and proceed.

An ambiguous brief is not a reason to ask first — apply the default, state it, and let the user redirect.
