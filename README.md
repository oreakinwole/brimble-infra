# Brimble Deployment Pipeline

A one-page deployment pipeline with Vite + TanStack frontend, TypeScript API, Railpack builds, and Caddy ingress. Deploy containerized apps via Git URL or file upload, with live log streaming to the UI over SSE.

## Quick Start

**Requirements**: Docker, docker-compose

**Run the entire stack with one command:**

```bash
docker-compose up -d
```

All services (frontend, backend, Caddy) come up on a clean machine with sensible defaults. No external accounts or setup required.

- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000
- **Caddy**: http://localhost:80

## Architecture

### Stack

- **Frontend**: React 19 + Vite + TanStack Router/Query, served as static dist
- **Backend**: Express (TypeScript), Prisma ORM, SQLite
- **Build**: Railpack (via Docker BuildKit)
- **Ingress**: Caddy reverse proxy
- **Storage**: Deployments stored in `./deployments/` directory

### How It Works

1. **User submits deployment** (Git URL or file upload)
2. **Backend creates deployment record** with `pending` status
3. **Pipeline runs async**:
   - Clone Git repo (or extract uploaded archive)
   - Build image with Railpack + BuildKit
   - Run container on allocated port
   - Update status to `running` with live URL
4. **Frontend subscribes to logs** via EventSource (SSE)
   - Logs stream live while building (not post-hoc)
   - Logs persist for scrollback
   - Status updates in real-time

### File Structure

```
.
├── frontend/                 # React + Vite UI
│   ├── src/
│   │   ├── pages/Dashboard.tsx   # Main UI (deployments, logs, upload)
│   │   ├── services/api.ts       # HTTP client
│   │   └── ...
│   ├── dist/                 # Built static assets
│   └── Dockerfile            # Node 22 + http-server
├── backend/                  # Express API
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── routes/deployments.ts # API endpoints
│   │   ├── pipeline/runner.ts    # Build/deploy pipeline
│   │   ├── logs/log.store.ts     # In-memory log storage
│   │   └── services/             # Database queries
│   ├── prisma/
│   │   └── schema.prisma    # Data model
│   └── Dockerfile           # Node 18 + Docker socket
├── Caddyfile                 # Reverse proxy config
├── docker-compose.yml        # Stack definition
└── README.md
```

## Environment Variables

All defaults are provided. Override if needed:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `file:./dev.db` | SQLite path (backend only) |
| `NODE_ENV` | `development` | Environment mode |

No external services required. Database is local SQLite.

## Live Log Streaming

**How it works:**
- Frontend opens EventSource to `GET /deployments/:id/logs`
- Backend uses Server-Sent Events (SSE) to push logs as they arrive
- Logs from completed stages persist in memory (log.store)
- New clients receive backlog + live updates

**Example:**
```bash
# Subscribe to logs
curl -N http://localhost:4000/deployments/abc123/logs
```

Logs stream in real-time while the build is running. No polling.

## API Endpoints

### Create Deployment (Git)
```bash
curl -X POST http://localhost:4000/deployments \
  -H "Content-Type: application/json" \
  -d '{"gitUrl":"https://github.com/user/repo"}'
```

### Create Deployment (Upload)
```bash
# Frontend does this, but here's the flow:
tar czf project.tar.gz myproject/
base64 -i project.tar.gz | jq -R -s '{uploadBase64: .}' | \
  curl -X POST http://localhost:4000/deployments \
    -H "Content-Type: application/json" \
    -d @-
```

### List Deployments
```bash
curl http://localhost:4000/deployments
```

### Get Deployment
```bash
curl http://localhost:4000/deployments/{id}
```

### Stream Logs
```bash
curl -N http://localhost:4000/deployments/{id}/logs
```

## Sample App

A sample Node.js app is available at:
- **Repo**: https://github.com/oreakinwole/my-portfolio

Deploy it via the UI:
1. Open http://localhost:5173
2. Paste Git URL: `https://github.com/oreakinwole/my-portfolio`
3. Click "Deploy"
4. Watch logs stream live
5. Click the URL when status shows "running"

## Frontend Features

- **Deploy form**: Git URL or file upload
- **Deployments list**: Status badges, image tags, live URLs
- **Live logs**: SSE stream, scrollable, persists after build
- **Real-time updates**: Status changes visible immediately

## Development

### Local Frontend Dev

```bash
cd frontend
npm install
npm run dev
```

Dev server on http://localhost:5173 (with HMR).

### Local Backend Dev

```bash
cd backend
npm install
npm run dev
```

Dev server on http://localhost:4000 (with ts-node-dev).

### Build Frontend (for Docker)

```bash
cd frontend
npm run build
```

Creates `dist/` for production serving.

## Design Decisions

### SSE over WebSocket
- SSE is simpler for unidirectional log streaming
- Works over standard HTTP (no upgrade required)
- Browser EventSource API is native
- Server-side implementation is stateless per-connection

### Static Frontend Serving
- Frontend built to dist/, served via http-server
- No Node dev server in production (faster startup)
- Simple, zero-config HTTP server

### In-Memory Log Storage
- Logs stored in memory per deployment ID
- Subscribers get backlog on connect
- Persists for UI scrollback during active deployment
- Cleared on container restart (acceptable for demo)
- Production would use persistent store (Redis, DB)

### Railpack for Builds
- No handwritten Dockerfiles needed
- Auto-detects framework and deps
- BuildKit for layer caching
- Produces optimized multi-stage images

### Caddy for Ingress
- Single reverse proxy entry point
- Easy routing and SSL termination
- Config in Caddyfile (simple syntax)
- Could route to >1 Caddy instance in production

## What to Improve (If More Time)

### High Priority
1. **Persistent log storage**: Use Redis or database instead of in-memory
   - Logs survive container restarts
   - Multi-instance deployments can share logs
   
2. **Deployment rollback**: Store previous image tags
   - Quick redeploy with `docker run app:old-tag`
   - Zero-downtime swaps

3. **Error handling**: More graceful failures
   - Retry logic for transient errors (git clone timeout)
   - Better error messages in UI
   - Deployment status: `failed`, `crashed`, `timeout`

4. **User feedback**: Deployment detail page
   - Full logs, build metadata, container info
   - Manual restart/stop buttons

5. **Testing**:
   - Unit tests for pipeline stages
   - E2E tests for deployment flow
   - Load test with multiple concurrent builds

### Medium Priority
1. **Multi-tenancy**: Namespace deployments by user/org
2. **Build caching**: Cache layers across builds (mount to Docker socket)
3. **Health checks**: Monitor running containers, auto-restart
4. **Graceful shutdown**: Drain connections before restart
5. **Metrics**: Build times, success rate, resource usage

### Polish
1. Better UI/UX: Animations, loading states, error toasts
2. Loom walkthrough video (5-10 min)
3. Architecture diagram
4. More example apps

## What I'd Rip Out

1. **Dependency bloat**: Remove unused TanStack React Router (simple dashboard doesn't need routing)
2. **Prisma for this scale**: Direct SQLite queries fine for 1-10 deployments, Prisma overkill
3. **In-memory logs**: Replace with real storage immediately
4. **Docker socket mount**: Security risk; use Docker API endpoint in production
5. **No auth**: Add auth before production

## Time Spent & Iteration

**Total time**: ~4 hours (estimate)
- Architecture & setup: 30 min
- Backend API + pipeline: 90 min
- Frontend dashboard: 60 min
- Docker Compose stack: 30 min
- Debugging Node version issues: 30 min

**If I had another weekend:**
1. Persistent log storage (Redis) → 1 hour
2. Rollback/redeploy → 1 hour
3. Better error handling + retries → 1 hour
4. E2E tests → 1 hour
5. Deployment detail page → 1 hour
6. Loom walkthrough video → 1 hour
7. Multi-tenancy skeleton → 1 hour

Would prioritize persistent logs + error handling first.

## Deployment Status Lifecycle

```
pending → building → deploying → running
              ↓          ↓           ↓
           failed    failed       failed
```

- **pending**: Queued, not started
- **building**: Railpack building image
- **deploying**: Container starting
- **running**: Accessible at URL
- **failed**: Error at any stage (logs show why)

## Known Limitations

1. Single machine only (no distributed orchestration like Nomad)
2. Logs lost on container restart (use persistent store in prod)
3. No rate limiting or quotas
4. No authentication
5. BuildKit container cleanup sometimes skipped on hard crashes
6. File uploads not size-limited

## Next Steps

1. Run `docker-compose up`
2. Open http://localhost:5173
3. Deploy a test app (see "Sample App" above)
4. Watch logs stream live
5. View deployed app at generated URL

Feedback welcome!
