# Realtime Metrics Dashboard — Frontend (Vue 3)

A Vue 3 client for the Express API in `../backend`. It shows live metrics, records every change it sees, and lets you create, edit and delete metrics, with the API's validation errors shown next to the exact field.

## Run it

Start the backend first, then the frontend, in two terminals:

```bash
cd backend
npm install
npm run dev          # http://localhost:5000
```

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:5000`, so there is no CORS setup. To point it at another backend, copy `.env.example` to `.env` and change `BACKEND_URL`.

`npm run build` writes a production build to `dist/`. `npm run preview` serves that build, with the same proxy.

## Pages

| Route | What it shows |
| :--- | :--- |
| `/` Dashboard | Status overview, category filter (`?category=SALES`), sort (`?sort=recent`), live metric cards with session sparklines, live activity feed, and a **Simulate live changes** switch |
| `/analytics` | Live trend chart for any metric, category × status breakdown, full change log |
| `/manage` | Sortable, searchable table with inline edit and delete, plus "Open a metric by ID" |
| `/metrics/:id` | Metric detail page (dynamic route): live value, trend, its own change log, edit and delete, previous/next |
| anything else | Not-found page. `/metrics/abc` is rejected by the route pattern itself |

## Syllabus coverage

| Topic | Where to look |
| :--- | :--- |
| **Composition API & reactivity** | Every component uses `<script setup>` with `ref`, `reactive`, `computed` and `watch`. Composables: `src/composables/useNow.js` (reactive clock) and `src/composables/useMetricForm.js` (form state and validation). `defineModel` provides two-way binding in `ToggleSwitch.vue` and `ChoiceGroup.vue`. |
| **State management with Pinia** | `src/stores/metrics.js` is a setup store. **State:** metrics, polling interval, pause, history, change log, health. **Getters:** `statusCounts`, `categoryCounts`, `needsAttention`, `byId`. **Actions:** `refresh`, `createMetric`, `updateMetric`, `deleteMetric`. Watchers in the store reschedule polling when the interval or pause state changes. `src/stores/editor.js` controls the global create/edit drawer. |
| **Vue Router & dynamic route matching** | `src/router/index.js` defines named routes, lazy-loaded views, and `meta` titles. `/metrics/:id(\\d+)` is a dynamic route that matches digits only and passes the ID as a prop. `MetricDetailView.vue` watches the `id` prop, so previous/next navigation reuses the same component and reloads its data. Also: a catch-all `/:pathMatch(.*)*` route, and query parameters (`?category=`, `?sort=`) for the dashboard filters. |
| **Form handling & client-side validation** | `MetricDrawer.vue` + `useMetricForm.js` use `v-model` on text inputs, radio groups and a switch. The client rules in `src/lib/validate.js` mirror the backend's express-validator rules. API `400` field errors are mapped back onto the same fields, tagged **From API** or **Browser check**. Turning off **Check in the browser before sending** lets you show the server's own validation. A request preview displays the exact JSON body and the API's response. |

## How "real-time" works

The backend has no push channel, so the Pinia store polls `GET /api/v1/dashboard/metrics` every 2 s (switchable to 5 s or 10 s, or paused). Polling also pauses while the tab is hidden. Each poll is compared with the previous one: changed values flash, show a delta, and go into the change log, labelled by source (**You**, **Simulator**, or **API** for changes from other clients). Value history exists only in this browser, kept in `sessionStorage` so a reload keeps it. The UI labels it as session data.

## Demo script

1. Open the Dashboard and turn on **Simulate live changes**. Cards update, flash, and fill the activity feed.
2. Click **New metric** and press **Create metric** with the form empty to see the browser checks. Turn off **Check in the browser before sending**, type `X` and `abc`, and submit again: the API's errors appear on the fields, tagged **From API**.
3. Fix the form and create the metric. It appears live, and the activity feed credits it to **You**.
4. Click a card title to open `/metrics/:id`. Edit it there, then use **Previous**/**Next**.
5. Open `/metrics/9999` to see the API's 404, and `/metrics/abc` to see the route reject a bad ID.
6. Stop the backend: the live pill turns **Offline**, a banner keeps the last data on screen, and **Retry now** reconnects.

## Structure

```
src/
├── api/client.js            fetch wrapper; ApiError carries status and field errors
├── stores/                  Pinia: metrics (polling, history, CRUD), editor (drawer)
├── router/index.js          routes, dynamic /metrics/:id, catch-all
├── composables/             useNow, useMetricForm
├── lib/                     constants, formatting, validation, chart maths
├── components/              layout, cards, charts, drawer form, badges, states
├── views/                   Dashboard, Analytics, Manage, MetricDetail, NotFound
└── styles/                  design tokens + per-area stylesheets
```
