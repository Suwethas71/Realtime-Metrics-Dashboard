# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vue 3 (Composition API, `<script setup>`) on Vite, Pinia for state, Vue Router, plain CSS with CSS custom properties (design tokens). No CSS framework. Matches the course syllabus (Composition API & reactivity, Pinia, Vue Router & dynamic route matching, form handling & client-side validation). Talks to the existing Express backend in `backend/` at `http://localhost:5000/api/v1/dashboard`.

## Users

Primary: capstone evaluators at Virtusa / SKCET (Team 7) watching a live demo on a laptop or projector. They judge in minutes whether the system works end to end: live data shows up, it updates, input is validated, errors are explained. Secondary: the team members presenting, who drive the demo and must be able to show every capability without hunting for it.

## Product Purpose

An interactive dashboard that monitors operational metrics (sales, traffic, system, revenue) with near-real-time updates and API request validation. Success: an evaluator sees live metrics, watches values update, creates/edits/deletes a metric, and sees the backend's field-level validation errors surfaced clearly in the UI.

## Positioning

The interesting part is the contract between client and server: strict server-side validation (express-validator) with field-level errors that the UI shows next to the exact input, plus a live polling feed. The frontend should make that contract visible rather than hide it.

## Operating Context

- Demo environment: one laptop running backend (`npm run dev`, port 5000) and frontend dev server; often projected, so legibility at distance matters.
- Data is in-memory and resets on backend restart; three seeded metrics (TRAFFIC, SYSTEM, REVENUE).
- "Real-time" is implemented by client polling; the backend has no push channel.

## Capabilities and Constraints

- Metric shape: `id` (positive int), `title` (3-50 chars), `value` (number), `category` (SALES | TRAFFIC | SYSTEM | REVENUE), `status` (ACTIVE | WARNING | CRITICAL, default ACTIVE), `updatedAt` (ISO).
- Endpoints: GET list (optional `?category=`, uppercase only), GET by id, POST, PUT (full body required), DELETE, GET `/health`.
- Errors: 400 `{ success:false, message, errors:[{field, issue}] }`; 404/500 `{ success:false, message }`.
- Backend must not be modified by frontend work.
- Routes required by the README: Dashboard, Analytics, Manage Metrics.
- No history endpoint: any trend/sparkline must come from values observed client-side during the session, and must be labeled as such.

## Evidence on Hand

Only the seeded metrics and whatever is created during a demo. No real customers, benchmarks or historical data exist; do not fabricate them.

## Product Principles

1. Show the system working: live state, update moments and validation are visible, never buried.
2. Every server response is honored: field errors land on their fields; outages are stated plainly with a retry.
3. Legible from across a room: hierarchy and numbers read at projector distance.
4. Familiar operation: standard app affordances so evaluators never pause to learn the UI.
