# Copilot Instructions for Cloud Vault

## Overview
Cloud Vault is a secure, responsive cloud storage web application with AWS integration. The project is split into two main parts:
- **frontend/**: React + TypeScript app (Vite, Tailwind CSS)
- **backend/**: AWS Lambda functions (TypeScript, zipped for deployment)

## Architecture & Key Patterns
- **Frontend** (`frontend/`):
  - Uses React with functional components and hooks (see `src/components/`, `src/hooks/`).
  - UI is modularized into pages (e.g., `pages/Index.tsx`, `pages/Dashboard.tsx`) and reusable components (e.g., `components/ui/`).
  - State and navigation logic are handled in component files; authentication flows are split into dedicated components (e.g., `SignIn.tsx`, `SignUp.tsx`, `VerifyOtp.tsx`).
  - Styling is via Tailwind CSS (`tailwind.config.ts`, `postcss.config.js`).
  - Utility functions live in `src/lib/utils.ts`.
- **Backend** (`backend/`):
  - AWS Lambda functions for authentication and password reset (`auth.ts`, `resetPasswordLambda.ts`, `verifyOtpLambda.ts`, zipped for deployment).
  - TypeScript project with its own `tsconfig.json` and `package.json`.
  - No monolithic server; all backend logic is serverless and event-driven.

## Developer Workflows
- **Frontend**:
  - Install deps: `cd frontend && npm install`
  - Start dev server: `npm run dev`
  - Build: `npm run build`
  - Lint: `npm run lint`
- **Backend**:
  - Install deps: `cd backend && npm install`
  - Build: `npm run build` (see `tsconfig.json`)
  - Deploy: Zip Lambda source files (see zipped files in `backend/`)

## Project-Specific Conventions
- **Component Structure**: UI components are grouped by function in `components/ui/` and by feature in `components/`.
- **Auth Flows**: Each auth step (sign up, sign in, OTP verification, password reset) has a dedicated component and Lambda handler.
- **No Central API Server**: All backend logic is via AWS Lambda; frontend communicates directly with these endpoints.
- **TypeScript Everywhere**: Both frontend and backend use TypeScript for type safety.

## Integration Points
- **AWS Lambda**: Backend logic is deployed as Lambda functions; zipped files in `backend/` are the deployable artifacts.
- **Frontend ↔ Backend**: Frontend calls Lambda endpoints directly (URLs/config not shown in repo, likely set via environment variables).

## Examples
- To add a new auth flow, create a new Lambda in `backend/src/` and a matching React component in `frontend/src/components/`.
- To update UI, edit or add components in `frontend/src/components/ui/`.

## Key Files & Directories
- `frontend/src/components/` — Main React components
- `frontend/src/pages/` — Page-level components
- `frontend/src/lib/utils.ts` — Shared utilities
- `backend/src/` — Lambda source code
- `backend/package.json` — Backend dependencies/scripts
- `frontend/package.json` — Frontend dependencies/scripts

## Additional Notes
- No test or CI/CD config found; add instructions if/when present.
- For AWS deployment, ensure zipped Lambda files are up to date with `src/`.

---
For more, see `README.md` or ask for specific workflow details.
