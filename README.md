# PS13 — Predictive NOC Dashboard

**MPLS Predictive Maintenance · Network Operations Centre · Air-gapped Deployment**

A high-security, offline-first NOC dashboard for MPLS predictive maintenance, built for ISRO-grade air-gapped intranet environments. Single-pane-of-glass design unifying real-time telemetry, ML inference outputs, network topology, alerts, and an on-device AI Copilot.

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Development
```bash
npm install
npm run dev
# → http://localhost:5173
```

### Production Build
```bash
npm run build
# Output: dist/
npm run preview   # Preview the built output locally
```

### Air-gapped / Docker Deployment
```bash
# Build the static bundle on an internet-connected machine
npm install
npm run build

# Transfer the dist/ folder to the air-gapped server
# Serve with any static file server (nginx, serve, caddy)
npx serve dist
```

> **Font & Icon note:** The current dev build loads Inter (Google Fonts) and Tabler Icons from CDN links in `index.html`. For a fully air-gapped deployment, download these assets and replace the `<link>` tags with local paths. See the [Air-gapped section](#air-gapped-bundle) below.

---

## Project Structure

```
ps13-noc/
├── index.html                    # App shell — font/icon CDN links live here
├── vite.config.js                # Vite build config
├── package.json
└── src/
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # Root layout, state, event routing
    ├── data/
    │   └── mockData.js           # All mock telemetry, predictions, alerts
    ├── styles/
    │   └── globals.css           # Design tokens, base styles, animations
    └── components/
        ├── TopBar.jsx            # Fixed header: logo, clock, status, copilot toggle
        ├── Sidebar.jsx           # Collapsible left nav
        ├── KpiGrid.jsx           # 8-card KPI summary row
        ├── MetricsChart.jsx      # Live Chart.js time-series (4 metric tabs)
        ├── NetworkTopology.jsx   # Interactive SVG MPLS topology map
        ├── Panels.jsx            # SystemHealthBar, PredictionCards,
        │                         # AlertsTable, FaultTimeline, InferenceConsole
        ├── CopilotPanel.jsx      # AI Copilot slide-out chat (Phi-3 local)
        └── DeviceModal.jsx       # Detail modal (devices, alerts, predictions)
```

---

## Components

| Component | File | Description |
|---|---|---|
| TopBar | `TopBar.jsx` | Live IST clock, global status dot, notification badge, AI Copilot toggle |
| Sidebar | `Sidebar.jsx` | Icon + label navigation, system health pip |
| KPI Grid | `KpiGrid.jsx` | 8 cards: routers, tunnels, alerts, risk score, latency, packet loss, bandwidth, links |
| Live Metrics | `MetricsChart.jsx` | Chart.js line chart, auto-updates every 2s, 4 metric tabs, 3 time ranges |
| Network Topology | `NetworkTopology.jsx` | SVG graph, hover tooltips, click-to-detail, utilisation % on link hover |
| System Health | `Panels.jsx → SystemHealthBar` | 7 service health chips with live status dots |
| Prediction Cards | `Panels.jsx → PredictionCards` | IsolationForest + XGBoost predictions with risk bars |
| Alerts Table | `Panels.jsx → AlertsTable` | Sortable, filterable alert log with severity badges |
| Fault Timeline | `Panels.jsx → FaultTimeline` | Chronological event feed with type icons |
| ML Console | `Panels.jsx → InferenceConsole` | Streaming monospace inference log |
| AI Copilot | `CopilotPanel.jsx` | Chat panel, quick-prompt chips, typing indicator, contextual replies |
| Detail Modal | `DeviceModal.jsx` | Reusable modal for device / alert / prediction drill-down |

---

## Design System

All tokens live in `src/styles/globals.css` as CSS custom properties:

```css
--bg-base:      #060E1E   /* page background */
--bg-panel:     #0F1D35   /* panel/card background */
--accent:       #00CFFF   /* primary blue-cyan */
--green:        #1EE07A   /* OK / nominal */
--amber:        #FFAA00   /* warning */
--red:          #FF3D3D   /* critical */
--font-ui:      'Inter', system-ui
--font-mono:    'JetBrains Mono'
```

WCAG 2.1 AA contrast ratios maintained throughout. All interactive elements have keyboard focus styles and ARIA labels.

---

## Live Data Simulation

`mockData.js` exports static seed data. `MetricsChart.jsx` and `InferenceConsole` run `setInterval` loops to push new data points every 2s and 4.5s respectively, simulating a WebSocket telemetry feed.

To connect real data:
1. Replace `generateChartData()` with a WebSocket subscription (e.g. `socket.io` or native WebSocket)
2. Replace mock arrays in `mockData.js` with API responses from the FastAPI backend
3. Wire `CopilotPanel` `sendMessage()` to `POST /api/chat` with streaming (`text/event-stream`)

---

## Technology Stack

| Layer | Tech |
|---|---|
| Frontend Framework | React 18, Vite 5 |
| Charts | Chart.js 4 via react-chartjs-2 |
| Topology | Hand-authored SVG (React-renderable, swap for React Flow) |
| Styling | CSS custom properties + utility classes (no Tailwind required) |
| Icons | Tabler Icons webfont |
| Fonts | Inter + JetBrains Mono |
| Backend (production) | FastAPI (Python) |
| Time-series DB | Prometheus |
| Log DB | Elasticsearch |
| Cache / queue | Redis |
| Relational DB | MariaDB |
| ML inference | scikit-learn, XGBoost, IsolationForest, SHAP |
| LLM | Phi-3 Mini via Ollama (local) |

---

## Air-gapped Bundle

For fully offline deployment, replace the CDN links in `index.html`:

```html
<!-- Replace these CDN links: -->
<link href="https://fonts.googleapis.com/css2?family=Inter..." rel="stylesheet"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont.../tabler-icons.min.css"/>

<!-- With local copies in public/: -->
<link href="/fonts/inter.css" rel="stylesheet"/>
<link rel="stylesheet" href="/icons/tabler-icons.min.css"/>
```

Download assets:
```bash
# Tabler Icons
curl -L https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/tabler-icons.min.css -o public/icons/tabler-icons.min.css
# Download the corresponding font files (.woff2) into public/icons/fonts/

# Inter font — use google-webfonts-helper or fontsource npm package
npm install @fontsource/inter @fontsource/jetbrains-mono
# Then import in main.jsx instead of the Google Fonts link
```

---

## Environment Variables

Create `.env.local` for local overrides:

```env
VITE_API_BASE=http://localhost:8000
VITE_WS_BASE=ws://localhost:8000/ws
VITE_LLM_MODEL=phi3
```

---

## Security Notes

- No external API calls at runtime (all assets bundled)
- Content Security Policy header recommended on the serving nginx: `default-src 'self'`
- Role-based views: extend `Sidebar.jsx` with a `userRole` prop to conditionally render sections
- Session timeout: add an idle timer in `App.jsx` → redirect to login after N minutes
- Audit logging: wrap user interactions (chat, alert ACK, modal opens) with a `POST /api/audit` call

---

## Accessibility

- WCAG 2.1 AA contrast ratios on all text/background combinations
- All interactive elements have `aria-label` and keyboard focus
- Chart canvas elements have `aria-label` descriptions
- Timeline and console use `role="log"` with `aria-live="polite"`
- Modal uses `role="dialog"` with `aria-modal` and `aria-labelledby`
- Escape key closes modal; Enter submits chat input

---

## Roadmap / Production TODO

- [ ] Connect WebSocket feed (`/ws/telemetry`) to replace `setInterval` simulation
- [ ] Implement `POST /api/chat` streaming endpoint (SSE) for real Phi-3 responses
- [ ] Add React Flow for richer interactive topology (drag, zoom, minimap)
- [ ] Implement role-based access control (RBAC) in sidebar and panels
- [ ] Add Grafana iframe embed option for raw Prometheus metrics
- [ ] Session timeout + login screen
- [ ] Export alerts / reports to PDF
- [ ] High-contrast mode toggle
- [ ] Offline service worker for static asset caching
