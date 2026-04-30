# Brimble Infra

Backend API for managing deployments with Express, TypeScript, Prisma, and SQLite.

## Project Layout

```text
backend/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   └── deployments.ts
│   ├── services/
│   │   └── deployment.service.ts
│   └── db.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
```

## Setup

Install dependencies from the `backend/` folder:

```bash
cd backend
npm install
```

If you need Prisma artifacts, generate the client and create the SQLite database:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Environment

The backend uses SQLite via Prisma.

```bash
DATABASE_URL="file:./dev.db"
```

You can copy the example file:

```bash
cp .env.example .env
```

## Run

Start the development server:

```bash
npm run dev
```

The API runs on:

```text
http://localhost:4000
```

## API

### Create deployment

```bash
curl -X POST http://localhost:4000/deployments \
  -H "Content-Type: application/json" \
  -d '{"gitUrl":"https://github.com/test/app"}'
```

### List deployments

```bash
curl http://localhost:4000/deployments
```

### Get deployment by id

```bash
curl http://localhost:4000/deployments/<id>
```
