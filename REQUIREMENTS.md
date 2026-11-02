# Project Architecture & Stack Requirements

This repository contains a full-stack financial core infrastructure application divided into a TypeScript Fastify backend and a React/Vite frontend.

## 🛠️ System Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (Recommended: `v20.x` or `v22.x LTS`)
- **Package Manager**: `pnpm` (Recommended: `npm install -g pnpm`) or `npm` (`v9.x`+)
- **Git**: For version control operations

---

## 📦 Backend Dependencies (`backend/package.json`)

### Runtime Environment
- **Node.js Runtime**: Fastify web framework with low overhead and JSON schema validation.

### Core Framework & Networking
- `fastify` (`^5.1.0`): High-performance HTTP server
- `@fastify/cors` (`^10.0.1`): Cross-Origin Resource Sharing
- `@fastify/jwt` (`^9.0.1`): Token-based authentication
- `@fastify/rate-limit` (`^10.1.1`): API rate limiter protecting endpoints against brute-force attacks

### Database & ORM
- `@prisma/client` (`^5.22.0`): Type-safe database client
- `prisma` (`^5.22.0`): Database migration tool and schema manager
- Database Engine: **SQLite** (out-of-the-box local database, zero configuration required)

### AI Risk Scoring & Inference
- `@google/genai` (`^0.1.1`): Gemini LLM SDK for human-readable fraud reasoning reports
- In-memory anomaly detection heuristics (velocity checks, hardware device signature comparisons, IP geo-fencing, standard deviation outlier models)

### Caching & Invariants
- `ioredis` (`^5.4.1`): Redis driver with built-in in-memory fallback for distributed idempotency locks

### Validation & Utilities
- `zod` (`^3.23.8`): Schema declaration and payload validation
- `dotenv` (`^16.4.5`): Environment configuration loader
- `uuid` (`^11.0.3`): Unique key and transaction identifier generator

### Testing & Tooling
- `vitest` (`^2.1.5`): Unit & integration testing runner
- `typescript` (`^5.6.3`): Static typing
- `tsx` / `ts-node-dev`: Live TypeScript development reloading

---

## 🎨 Frontend Dependencies (`frontend/package.json`)

### Core Framework
- `react` (`^18.3.1`): UI component rendering library
- `react-dom` (`^18.3.1`): DOM rendering engine
- `vite` (`^5.4.11`): Build tool & HMR development server

### Styling & Design System
- `tailwindcss` (`^3.4.15`): Utility-first CSS framework
- `postcss` (`^8.4.49`) & `autoprefixer` (`^10.4.20`): CSS processing
- Fonts: `Inter` and `JetBrains Mono`

### Iconography
- `lucide-react` (`^0.460.0`): Icon set for banking dashboards
