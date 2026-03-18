# ResearchHub — Polyglot Persistence

A workshop project built for **Harvesting Data: Adventures in Data Systems**
hosted by AWS Learning Club UST on March 28, 2026.

ResearchHub is a research repository platform where students can post papers,
reference each other's work, leave comments, and like posts. This codebase
demonstrates a **polyglot persistence architecture** — using the right database
for the right data type.

## Architecture

| Layer | Service | Purpose |
|---|---|---|
| Core data | Amazon RDS (PostgreSQL) | Users, posts, comments, likes |
| File storage | Amazon S3 | Research paper PDFs and images |
| Logging | Amazon DynamoDB | Audit, access, and transaction logs |

## Tech Stack

### Backend
- **Hono.js** — lightweight web framework
- **Drizzle ORM** — type-safe ORM + migrations for PostgreSQL
- **Zod** — request validation
- **AWS SDK v3** — S3, DynamoDB clients

### Frontend
- **Vue 3** — UI framework (Composition API)
- **Vue Router** — client-side routing
- **Pinia** — state management
- **Tailwind CSS** — styling
- **shadcn-vue** — component library

### Cloud (AWS Free Tier)
- **Amazon RDS** — PostgreSQL core database
- **Amazon S3** — file storage
- **Amazon DynamoDB** — audit, access, and transaction logs

## Prerequisites

- Node.js LTS
- Git (optional — you can download the ZIP)
- An AWS account (Free Tier works)

## Getting Started

Because this project features both a frontend and a backend, you will need to open two separate terminal windows to run them concurrently.

### 1. Backend

The backend uses [Bun](https://bun.sh/) as its runtime. If you don't have Bun installed globally, install it first:

```bash
npm install -g bun
```

Next, navigate into the backend directory, install the dependencies, and start the development server:

```bash
cd backend
bun install
bun run dev
```

### 2. Frontend

Open a new terminal session, navigate to the frontend directory, install the dependencies, and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

### 3. Configuration & AWS Setup

If an environment example file is provided, copy it and fill in your values:

```bash
cp .env.example .env
```

Follow the workshop guide to provision your AWS resources and fill in each `.env` key as you go.

## Workshop

This repository is part of a guided workshop. Participants integrate
each AWS service one by one in this order:

1. **Amazon RDS** — provision PostgreSQL, import the provided SQL dump,
   connect the app
2. **Amazon S3** — create a bucket, configure IAM, enable file uploads
3. **Amazon DynamoDB** — create three log tables, migrate logging off
   PostgreSQL

A full step-by-step workshop guide is provided at the event.

## License

MIT — feel free to use this for your capstone, side projects, or
anything else.
