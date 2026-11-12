#!/usr/bin/env python3
"""Build a static NFL depth-chart snapshot for GitHub Pages.

ESPN does not consistently send CORS headers on depth-chart responses, so
the website reads this JSON snapshot instead of depending on browser access.
"""
import concurrent.futures
import datetime as datetime
import json
import logging
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data" / "depthcharts.json"
API = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams"
TEAM_IDS = (22, 1, 33, 2, 29, 3, 4, 5, 6, 7, 8, 9, 34, 11, 30, 12, 13, 24,
            14, 15, 16, 17, 18, 19, 20, 21, 23, 25, 26, 27, 10, 28)
OFFENSE = {"QB", "RB", "FB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "OT", "OG", "G", "OL"}
SPECIAL = {"K", "P", "LS", "KR", "PR"}
POSITION_ORDER = ["QB", "RB", "FB", "WR", "TE", "LT", "LG", "C", "RG", "RT",
                  "OT", "OG", "G", "OL", "DE", "DT", "NT", "EDGE", "OLB", "ILB",
                  "LB", "MLB", "CB", "FS", "SS", "S", "DB", "K", "P", "LS", "KR", "PR"]


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def get_json(url):
    request = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; 8bit-football/1.0)",
        "Accept": "application/json",
    })
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=18) as response:
                return json.load(response)
        except (OSError, ValueError) as error:
            logging.warning("Fetch failed: %s / %s (try %d)", url, error, attempt + 1)
            if attempt < 2:
                time.sleep(attempt + 1)
    return None


def roster_lookup(roster):
    players = {}
    for group in (roster or {}).get("athletes", []):
        entries = group.get("items") if isinstance(group.get("items"), list) else [group]
        for athlete in entries:
            if athlete.get("id"):
                players[str(athlete["id"])] = athlete
    return players


def normalize_player(entry, lookup, rank):
    athlete = entry.get("athlete") or entry
    athlete_id = str(athlete.get("id") or "")
    info = dict(lookup.get(athlete_id, {}))
    info.update({key: value for key, value in athlete.items() if value is not None})
    pos = info.get("position") or {}
    if isinstance(pos, str):
        pos = {"abbreviation": pos}
    experience = info.get("experience") or {}
    college = info.get("college") or {}
    status = info.get("status") or {}
    return {
        "id": athlete_id,
        "name": info.get("displayName") or info.get("fullName") or info.get("name") or "",
        "number": str(info.get("jersey") or ""),
        "position": pos.get("abbreviation") or "",
        "rank": rank,
        "experience": experience.get("years") if isinstance(experience, dict) else experience,
        "college": college.get("name") if isinstance(college, dict) else college,
        "height": info.get("displayHeight") or "",
        "weight": info.get("displayWeight") or "",
        "status": status.get("name") if isinstance(status, dict) else status,
    }


def depthchart_groups(depthchart, lookup):
    result = {"offense": [], "defense": [], "special": []}
    charts = depthchart.get("depthCharts") or []
    if isinstance(charts, dict):
        charts = list(charts.values())
    for chart in charts:
        title = str(chart.get("name") or chart.get("displayName") or "").lower()
        unit = "special" if "special" in title else "defense" if "defen" in title else "offense"
        positions = chart.get("positions") or {}
        if isinstance(positions, list):
            positions = {str(index): value for index, value in enumerate(positions)}
        for key, group in positions.items():
            if not isinstance(group, dict):
                continue
            pos = group.get("position") or {}
            code = str(pos.get("abbreviation") or "").upper()
            name = pos.get("name") or pos.get("displayName") or str(key).replace("_", " ")
            athletes = group.get("athletes") or []
            players = []
            for index, entry in enumerate(athletes):
                if not isinstance(entry, dict):
                    continue
                item = normalize_player(entry, lookup, entry.get("rank") or index + 1)
                if item["name"]:
                    players.append(item)
            if players:
                result[unit].append({"code": code or str(key).upper(), "label": name, "players": players})
    return result


def fallback_groups(roster):
    result = {"offense": {}, "defense": {}, "special": {}}
    for group in roster.get("athletes", []):
        entries = group.get("items") if isinstance(group.get("items"), list) else [group]
        for athlete in entries:
            if not athlete.get("displayName"):
                continue
            pos = athlete.get("position") or {}
            code = str(pos.get("abbreviation") or "").upper()
            unit = "special" if code in SPECIAL else "offense" if code in OFFENSE else "defense"
            bucket = result[unit].setdefault(
                code, {"code": code or "OTHER", "label": pos.get("name") or code, "players": []})
            bucket["players"].append(normalize_player(athlete, {}, None))
    return {
        unit: sorted(buckets.values(),
                     key=lambda group: POSITION_ORDER.index(group["code"]) if group["code"] in POSITION_ORDER else 99)
        for unit, buckets in result.items()
    }


def get_team(team_id):
    roster = get_json(f"{API}/{team_id}/roster")
    depthchart = get_json(f"{API}/{team_id}/depthcharts")
    if depthchart:
        groups = depthchart_groups(depthchart, roster_lookup(roster))
        if any(groups.values()):
            return str(team_id), {"kind": "depth", "updatedAt": now(), **groups}
    if roster:
        groups = fallback_groups(roster)
        if any(groups.values()):
            return str(team_id), {"kind": "roster", "updatedAt": now(), **groups}
    return str(team_id), None


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    existing = {}
    if DEST.exists():
        try:
            existing = json.loads(DEST.read_text(encoding="utf-8")).get("teams", {})
        except (OSError, ValueError):
            pass
    teams = dict(existing)
    updated = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        for team_id, result in executor.map(get_team, TEAM_IDS):
            if result:
                teams[team_id] = result
                updated += 1
                logging.info("Team %s: %s", team_id, result["kind"])
            else:
                logging.warning("Team %s missing; using previous cache if available", team_id)
    if not teams:
        raise SystemExit("No roster or depth-chart data downloaded; keeping previous snapshot.")
    DEST.parent.mkdir(parents=True, exist_ok=True)
    payload = {"generatedAt": now(), "source": "ESPN unofficial NFL endpoints", "teams": teams}
    DEST.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    logging.info("Refreshed %d teams; %d/32 available", updated, len(teams))


if __name__ == "__main__":
    main()
