# ProCloudd

A private cloud storage application. This repository contains the full rebuild: a React client and an Express API, developed together as a monorepo.

## Tech Stack

**Client** — React 19, TypeScript, Vite, Tailwind CSS, Base UI + shadcn/ui, TanStack Query, React Hook Form, Zod, React Router.

**Server** — Node.js, TypeScript, Express, MongoDB (Mongoose), Redis, Zod.

## Features

- Email/password authentication with account lockout after repeated failed attempts
- Email OTP verification for registration and password reset
- Two-factor authentication (TOTP) with QR-code setup and single-use recovery codes
- Sign in with Google and GitHub
- Multi-session management — view active sessions per device and revoke them individually or all at once
- Role-based access control (Admin / Manager / User) for user administration
- Rate limiting and request throttling on sensitive endpoints
- Centralized, single-source-of-truth app configuration on both client and server

File and folder storage — the core cloud-storage feature — is still in progress; data models exist but the API and UI are not yet built.

## Architecture

This is a monorepo with two independently deployable applications:

```
v2/
├── client/                   React SPA
├── server/                   Express API
├── scripts/
│   ├── dev.sh                Run client + server together for local development
│   ├── verify.sh             Type-check, lint, format, and build both projects
│   └── run-in-dir.js         Helper used by lint-staged to run tools inside client/ or server/
├── .husky/                   Git hooks — commit message and pre-commit checks
├── .github/workflows/        CI checks (commit message linting on pull requests)
├── commitlint.config.js      Commit message rules
├── lint-staged.config.js     Which linter/formatter runs on which staged files
└── package.json              Repo-level tooling only (husky, commitlint, lint-staged) — not an app
```

### Client (`client/src/`)

```
modules/      Feature modules (auth, settings) — each owns its components, hooks, API calls, and validation
components/   Shared UI, including components/ui (shadcn/Base UI primitives)
layout/       App shell — sidebar, header, footer
pages/        Top-level routed pages
lib/          Framework-agnostic utilities (API client, date formatting, etc.)
hooks/        Shared hooks
error/        Typed API error handling
constants/    App-wide config and route definitions
```

### Server (`server/src/`)

```
modules/       Feature modules (auth, otp, twofactor, user, directory) — each with its own controller, service, repository, and validator
common/        Cross-cutting concerns — auth providers/sessions, email templates, error handling, HTTP response shape, shared utilities
config/        App configuration, environment validation, database/Redis/rate-limiter setup
middlewares/   Authentication, request validation, error handling, rate limiting
models/        Mongoose schemas
services/      Cross-module services (e.g. session management)
types/         Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js (LTS or newer)
- MongoDB
- Redis

### Setup

```bash
# Install dependencies
npm install --prefix server
npm install --prefix client
npm install
# the root install sets up the git commit hooks (see "Commit conventions" below) —
# without it, commits will go through without any local checks

# Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# then fill in the values in both .env files
```

### Running locally

```bash
./scripts/dev.sh
```

This starts the server and client together. The API runs on the port set in `server/.env` (default `8000`); the client runs on Vite's default port (`5173`).

### Verifying changes

```bash
./scripts/verify.sh
```

Runs type-checking, linting, and formatting for both projects, plus a production build of the client.

## Commit Conventions

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) (`type: subject`, e.g. `feat: add login page`, `fix: correct session expiry`). This is checked in two places:

- **Locally**, via git hooks (set up automatically by `npm install` at the repo root): staged files are linted and formatted before each commit, and the commit message is validated before the commit is created.
- **In CI**, via a GitHub Actions workflow that re-checks every commit message on pull requests — this catches anything the local hooks miss (e.g. if hooks were bypassed or never installed).
