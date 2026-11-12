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


## Current injuries and depth-chart stability

ESPN league-wide injury reports are checked when a team is selected, cached for
four minutes, and refreshed automatically while the page is in use. Current
Questionable (yellow), Doubtful (orange), Out (red), and Day-to-Day indicators
appear next to affected players with injury descriptions and source dates when
available. Injury status **never changes the position or depth rank**.

The site combines current ESPN active/reserve roster membership with Sleeper
player-ID crosswalks and nflverse's 2026 ESPN-derived weekly depth snapshots
(https://github.com/antonwilms/sleeper-dashboard-data). For QB, RB, WR, and TE,
it uses an established rank from up to six recent weekly snapshots rather than
blindly accepting a one-week drop after an injury. For a verified consecutive
two-week role change, the latest rank can win unless a current injury
designation suggests a temporary shift. Three WRs can be tagged as starters.

Five offensive-line positions (LT, LG, C, RG, RT) are sourced separately
from the recent nflverse positional-line snapshots. Unmatched players remain
in the Other Offensive Linemen section without invented ranks. Defense and
special teams use published ranks when available.

The large historical lineup files are cached locally and load asynchronously.
The app shows dates for depth snapshots and checks the live ESPN injury
feed directly; no GitHub Actions runners are needed. **Depth orders are sourced
snapshots, not guaranteed to reflect every last-minute coaching decision**.
The actual player roster is checked on every team selection and every two
minutes while active. The source can report injuries with delays, and upstream
records lacking a recent report date are not displayed as current.

## Readable supporting typography

Small ranks, measurements, injury statuses, and abbreviations use an easier
to distinguish monospace while keeping arcade headline text and the original
pixel jerseys intact.
