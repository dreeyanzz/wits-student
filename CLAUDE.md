# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wildcat One Student Portal — a React 18 SPA (Vite-bundled) for CIT-U students to view schedules, grades, professors, and course offerings. Communicates with external REST APIs via an encrypted/HMAC-signed protocol through a CORS proxy.

## Commands

```bash
npm run dev       # Start dev server on port 5173 (--host enabled)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test runner or linter is configured.

## Architecture

### Routing
Navigation is **not** React Router route-based. `App.jsx` uses an `activeSection` state variable to conditionally render page components (Dashboard, Schedule, Grades, Professors, CourseOfferings, ChangePassword). The Login component renders when the user is unauthenticated.

### State Management
`src/services/storage.js` exports a singleton `StateManager` class that holds auth tokens, user data, academic context (years, terms), and persists all state to localStorage with the `wildcatOne_` prefix. Cross-tab logout is handled via storage event listeners.

### API Layer (`src/services/api.js`)
All HTTP requests go through `ApiService` which:
- Routes requests through a Cloudflare Workers CORS proxy
- Encrypts request payloads with AES-256-CBC (CryptoJS)
- Signs requests with HMAC-SHA256 (nonce + salt per request) sent via custom headers (`X-HMAC-Nonce`, `X-HMAC-Salt`, `X-HMAC-Signature`, `X-Origin`)
- Auto-decrypts encrypted responses
- Triggers automatic logout + reload on 401 responses

Two separate backend hosts: one for login (`LOGIN_URL`), one for data (`BASE_URL`). Both configured in `src/config/constants.js`.

### Authentication (`src/services/auth.js`)
Token-based (JWT Bearer). Login flow: validate inputs → POST credentials + clientId → store token + user data in StateManager → initialize academic context (fetch student info, academic years, terms). Session restore runs on app mount and re-validates the full chain.

### Race Condition Prevention
Data-fetching components (Schedule, Grades, etc.) use a `loadCounterRef` pattern: increment a counter before each fetch, and discard the result if the counter has changed by the time the response arrives.

### Key Directories
- `src/components/` — Page components and `shared/` reusable UI (ErrorBoundary, ErrorState, LoadingState, SectionHeader, SemesterSelector)
- `src/services/` — auth, api, storage (the core service layer)
- `src/config/constants.js` — API URLs, encryption keys, client secrets, time slots, color palette, day mappings
- `src/utils/` — crypto (AES/HMAC), validation (studentId/email/password patterns), errors (custom error classes), dom (colors, mobile detection), time (parsing/day conversion)
- `src/styles/` — Component-scoped CSS files + global `index.css`

### Configuration
All secrets and API URLs are hardcoded in `src/config/constants.js` (no `.env` files). This is intentional — they act as app identifiers; real security is server-side via JWT + per-student data scoping.

### Build Optimizations
Vite config (`vite.config.js`) enables: Terser minification with `drop_console`/`drop_debugger`, manual chunk splitting (components vs services/utils), and CSS code splitting.
