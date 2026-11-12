# 8-Bit Football

Mobile-first pixel-art NFL depth-chart viewer. Select any of the 32 NFL teams, switch offense/defense/special teams, and tap a player for details.

## Publish using GitHub Pages

1. Open repository Settings, then Pages.
2. Select Deploy from a branch, set the branch to main and folder to /(root), then Save.
3. Once published, visit https://ryanehinkle.github.io/8bit-football/.

This repository started out private. GitHub Free requires a public repository to publish GitHub Pages; GitHub Pro and Team permit private repo publishing. If you use GitHub Free, change the repo visibility to public in Settings before enabling Pages.

## Data

GitHub Actions refreshes ESPN depth charts and roster numbers daily, saves the results in data/depthcharts.json, and preserves previously fetched teams if a request fails. The first update runs when the workflow is added, and it is also manually runnable from Actions.

ESPN's depth chart endpoints do not reliably support browser CORS, so the scheduled snapshot provides ranked depth charts in this static Pages site. If there is no snapshot for a team, the browser fetches ESPN's roster endpoint instead and clearly marks it as an unverified roster order. No player data is fabricated.

ESPN's endpoints are unofficial and may change. This fan project is not affiliated with ESPN or the NFL.

## Preview

Run python -m http.server 8000 from the repository folder and open http://localhost:8000.
