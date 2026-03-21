# ProjectHub — Polyglot Persistence

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue.js-3-4FC08D.svg?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-v4-E36002.svg)](https://hono.dev/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-232F3E.svg?logo=amazonaws&logoColor=white)](https://aws.amazon.com/)

A workshop project built for **Harvesting Data: Adventures in Data Systems**
hosted by AWS Learning Club UST.
 
ProjectHub is a platform where students share their software and hardware
projects — upload a cover image, a research PDF, link a live demo, and let
the community comment and like your work. This codebase demonstrates a
**polyglot persistence architecture** — using the right database for the
right data type.

## Architecture
 
| Layer | Service | Purpose |
|---|---|---|
| Core data | Amazon RDS (PostgreSQL) | Users, projects, comments, likes |
| File storage | Amazon S3 | Cover images (JPEG/PNG) and research PDFs |
| Logging | Amazon DynamoDB | Unified Audit Trail (Who + What) |
 
## Tech Stack
 
### Backend
- **Bun** — runtime
- **Hono.js** — lightweight web framework
- **Drizzle ORM** — type-safe ORM for PostgreSQL
- **Zod** — request validation
- **AWS SDK v3** — S3 and DynamoDB clients
 
### Frontend
- **Vue 3** — client-side framework
- **Vue Router v4** — client-side routing
- **Pinia** — state management
- **Tailwind CSS v4** — styling
- **lucide-vue-next** — icons
- **Space Mono** — monospace font (Google Fonts)
 
### Cloud (AWS Free Tier)
- **Amazon RDS** — PostgreSQL, db.t3.micro, ap-southeast-1
- **Amazon S3** — file storage, ap-southeast-1
- **Amazon DynamoDB** — Unified Audit Trail, permanent free tier
 
## Prerequisites
 
- [Bun](https://bun.sh/)
- Node.js LTS
- Git
- An AWS account (Free Tier)

## Getting Started
 
Open two terminal windows — one for the backend, one for the frontend.
 
### 1. Backend
 
```bash
cd backend
bun install
bun run dev
```
 
The backend runs on `http://localhost:3000` by default.
 
### 2. Frontend
 
```bash
cd frontend
npm install
npm run dev
```
 
The frontend runs on `http://localhost:5173` by default.
 
### 3. Configuration
 
Copy the example environment file and fill in your values as you provision each AWS service:
 
```bash
cd backend
cp .env.example .env
```
 
You will fill in each key during the workshop in this order:
1. `DB_*` keys — after provisioning RDS
2. `AWS_*` and `S3_*` keys — after creating your S3 bucket and IAM user
3. `DYNAMODB_TABLE` key — after creating your Audit Trail table

Follow the workshop guide to provision your AWS resources and fill in each `.env` key as you go.

## Workshop

This repository is part of a guided workshop. Participants integrate
each AWS service one by one in this order:

1. **Amazon RDS** — provision PostgreSQL, import the provided SQL dump,
   connect the app
2. **Amazon S3** — create a bucket, configure IAM, enable file uploads
3. **Amazon DynamoDB** — create a Unified Audit Trail table, migrate logging off
   PostgreSQL

A full step-by-step workshop guide is provided at the event.

## License

MIT — feel free to use this for your capstone, side projects, or
anything else.
