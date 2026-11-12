# 8-Bit Football

Phone-first pixel-art NFL depth charts and rosters for all 32 teams.

Website: https://ryanehinkle.github.io/8bit-football/

## Lineups

Choose a team and switch OFFENSE, DEFENSE, or SPECIAL to browse the active 53-man roster grouped by position and ranked wherever verified. Practice Squad and Injured Reserve are independent expandable sections below; other reserve designations have their own section if reported.

Active-roster count reflects reported membership, which can be less than 53 during transactions. Players reported on Practice Squad or IR are excluded from the active lineup.

## Live data

ESPN's browser-accessible team roster endpoint fetches current team membership and jersey numbers on team selection, every 2 minutes while the site is visible, and when returning to the tab.

Sleeper supplies depth_chart_order where ESPN ranked depth charts are not available, and independently published team membership when ESPN roster access fails. Sleeper's large player list is cached for up to 24 hours to respect its API recommendation. Sleeper loads asynchronously and never blocks the initial ESPN roster display.

ESPN's ranked depth chart endpoint has inconsistent browser CORS support. If it responds, its depth rankings override Sleeper. If neither provider supplies a player's depth position, the interface displays -- rather than inventing a starter.

Reserve designation and depth order may lag upstream providers. This is an on-demand roster viewer, not a guaranteed second-by-second news feed.

No backend, keys, workflows, or scheduled server required. GitHub Pages serves the HTML, CSS, and JavaScript.

## Local preview

Run python -m http.server 8000 and open http://localhost:8000.

Unofficial fan site, not affiliated with NFL, ESPN, or Sleeper.
