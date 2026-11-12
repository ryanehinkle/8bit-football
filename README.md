# 8-Bit Football

Mobile-first pixel-art NFL depth-chart viewer. Select any of the 32 NFL teams, switch offense/defense/special teams, and tap a player for details.

## Publish using GitHub Pages

1. Open repository Settings, then Pages.
2. Select Deploy from a branch, set the branch to main and folder to /(root), then Save.
3. Once published, visit https://ryanehinkle.github.io/8bit-football/.

This repository started out private. GitHub Free requires a public repository to publish GitHub Pages; GitHub Pro and Team permit private repo publishing. If you use GitHub Free, change the repo visibility to public in Settings before enabling Pages.

## Data

GitHub Actions attempts to refresh ESPN depth charts and roster numbers every 5 minutes (subject to GitHub Actions availability and scheduling delays), saves the results in data/depthcharts.json, and preserves previously fetched teams if a request fails. It also runs when app.js or the workflow changes, and you can run it manually from Actions. If Actions reports startup_failure with zero jobs, that's a GitHub workflow startup issue rather than a Python script failure, and the site still tries the live browser roster endpoint.

ESPN's depth chart endpoints do not reliably support browser CORS, so the scheduled snapshot provides ranked depth charts in this static Pages site. If there is no snapshot for a team, the browser fetches ESPN's roster endpoint instead and clearly marks it as an unverified roster order. No player data is fabricated.

ESPN's endpoints are unofficial and may change. This fan project is not affiliated with ESPN or the NFL.

## Preview

Run python -m http.server 8000 from the repository folder and open http://localhost:8000.

## Mobile freshness

The site displays any saved depth chart immediately, checks the current roster straight from ESPN in the browser, and attempts a live depth-chart request. Most browser depth-chart requests are blocked by CORS, so GitHub Actions keeps a ranked snapshot. Visible tabs are rechecked every 2 minutes and snapshots every 5 minutes. The JSON is read from raw.githubusercontent.com to bypass GitHub Pages' deployment cache (GITHUB_TOKEN commits do not trigger branch-source Pages redeployment). The roster display explicitly labels unverified depth order instead of guessing.

Pixel helmets draw genuine ESPN team marks as tiny nearest-neighbor bitmaps, and jerseys are crisp pixel SVGs with team colors and player numbers.

## Second depth chart source

When the ESPN ranked depth chart cannot be fetched, the site also checks Sleeper's public players feed for published depth_chart_order values. It matches those records to the current ESPN roster by ESPN player ID or normalized name, then sorts only players with confirmed order. Positions without rankings stay unranked instead of guessing. The site labels this clearly as Sleeper depth, not ESPN depth.

The Sleeper API recommends fetching its large player index only once a day. The site requests only active players and stores a slimmed index locally for up to 23 hours; it does not re-download the list every time a team is selected. API docs: https://docs.sleeper.com/ .
