# AWS SBG TIP Manila ID Generator

A frontend prototype for the AWS Student Builder Group at the Technological Institute of the Philippines – Manila. It gives organization administrators a focused workspace for reviewing members, previewing category-based IDs, managing template placeholders, and browsing generated-ID records.

## Tech stack

- React 19 and TypeScript
- Vinext / Vite
- Tailwind CSS 4
- Lucide icons
- Mock data only

## Local setup

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To create a production build:

```bash
npm run build
```

## Prototype features

- Responsive dashboard with membership and ID metrics
- Recent ID activity and category distribution
- Searchable mock-member selector
- Personal information panel that updates with the selection
- Reusable 1200 × 1950 front and back ID preview
- Amber member, green officer, and purple associate themes
- Seven-slot event attendance layout and placeholder terms
- Searchable/filterable members directory
- Six placeholder template cards
- Filterable generated-ID records
- Responsive desktop sidebar and mobile navigation drawer

## Current limitations and next phase

This repository is intentionally a frontend-only prototype. Supabase, authentication, databases, API routes, real member records, QR codes, cloud storage, template upload, ID assignment, and real PNG/PDF generation are not implemented yet. All people and records are mock data, and export or template-management actions are visual placeholders.

The approved Canva layouts can be integrated later as fixed background templates before backend services and real generation workflows are added.
