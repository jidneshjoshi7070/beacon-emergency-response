# BEACON · Smart Emergency Response

Local-first emergency coordination prototype for the BUILD IN A BLINK hackathon. It adds an operator command centre, a citizen report and tracking portal, explainable priority scoring, duplicate review, team dispatch, and OpenStreetMap incident mapping.

## Run locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal. It normally uses `http://127.0.0.1:5173/`; if that port is already occupied, Vite selects the next available port.

## Maps

The app uses React Leaflet with OpenStreetMap tiles. It does not need a Google Maps API key. The map shows incident and response-team coordinates from records, uses color-coded priority circles, opens record popups, supports category and priority filters, and fits visible markers. Demo data uses clearly marked simulated Mumbai coordinates. Reports without coordinates are not plotted.

OpenStreetMap attribution is shown on the map. The public `tile.openstreetmap.org` service is intended for reasonable interactive use, not bulk/offline download or guaranteed high-volume production traffic. For production, select a tile provider or host tiles and follow its terms and the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Core workflows

- Browser `localStorage` uses the existing key `beacon-emergency-demo-v1`; saved incident and resource records are migrated in place with their existing fields retained.
- Citizen reports support four emergency types, optional browser geolocation, manual coordinates and map pin, affected people, urgency, risk, description and an optional image (up to 2 MB). Submitted reports appear in the operator register and can be tracked by incident ID.
- The priority engine scores severity, affected people, urgency and location risk, shows the factor breakdown, and supports a logged operator override.
- Duplicate candidates are flagged for human review and are never automatically merged.
- Operators can assign only available teams, see the nearest suitable team when both records have coordinates, update status (Reported → Assigned → Responding → Resolved), review timelines and release a team.
- Analytics summarize category, severity, active/resolved counts and resource utilization from the saved data.
- Reset demo data requires confirmation.

## Privacy and limitations

Data and optional report images stay in this browser profile; there is no shared backend, account, multi-user synchronization, dispatch network, live emergency feed, or production-grade image storage. The OSM public tile service does require an internet connection for map tiles. This hackathon prototype is not an emergency dispatch or triage service. In an actual emergency, contact local emergency services.

