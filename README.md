# SimplifAI — Upload & RAG Integration Guide

This document describes the upload flow implemented by the SimplifAI project and how to set up and test it locally and on AWS. It covers both the frontend and backend pieces, the AWS resources you need, the API contract for upload and chat, and verification steps. Follow the steps in order and confirm each step before moving on.

## Table of contents
- Overview
- Architecture (high level)
- Repo layout (what to look at)
- Prerequisites
- Quick local dev (frontend + backend)
- Backend: Lambdas (presign + complete)
- Frontend: wiring and upload flow
- AWS production setup (S3, SQS, IAM, Secrets Manager, DynamoDB, OpenSearch/Pinecone)
- API contract (presign / complete / chat / conversations)
- Environment variables
- Testing and verification
- Security & production notes
- Troubleshooting
- Next steps


## Overview

SimplifAI allows authenticated users to upload PDFs into S3, processes them in the background (text extraction, chunking, embeddings), stores metadata and vectors, and enables an AI chat interface (RAG). The upload flow uses presigned S3 URLs so the file is uploaded directly from the browser.

This README focuses on the complete upload flow and how the frontend and backend integrate.


## Architecture (high level)

- Frontend (React, Vite) → calls `POST /api/upload/presign` to get a presigned PUT URL.
- Frontend PUTs file to S3 using presigned URL, then calls `POST /api/upload/complete` to notify the backend.
- Backend (AWS Lambda/API Gateway) updates DynamoDB and sends an SQS message for processing.
- Worker (ECS Fargate or Lambda depending on size) picks up the SQS message, downloads the PDF, extracts text, chunks, computes embeddings, and upserts vectors into a vector store (OpenSearch / Pinecone / pgvector). It marks the file processed in DynamoDB.
- Chat endpoint uses vector retrieval + LLM to answer user queries and stores conversation messages in DynamoDB.


## Repo layout (relevant files)

- `frontend/`: React app (Vite) — UI, chat interface, upload components
  - `frontend/src/components/SimplifAI/MainContent.tsx` — main chat input & attachments
  - `frontend/src/components/SimplifAI/AppSidebar.tsx` — Ask/Imagine wiring

- `backend/`: Lambda helpers and Lambda-ready JS files
  - `backend/presignLambda.js` — presign handler (example)
  - `backend/completeLambda.js` — complete handler (example)
  - `backend/lambda-trust.json`, `backend/lambda-policy.json` — role/trust templates
  - `backend/service-policy.json` — service user policy (used for `SimplifAI-Service`) 
  - `backend/README-Lambda-Deploy.md` — lambda deploy notes


## Prerequisites

- AWS account with admin privileges (you must run initial infra creation as an admin and then apply least-privilege).
- AWS CLI configured locally.
- Node.js (>= 18) and npm installed for frontend/backend testing.
- (Optional) Docker if you plan to run local vector DB or workers.


## Quick local dev (frontend + backend)

The project is primarily designed to run on AWS. However, you can test the frontend + minimal backend locally by using the prepared Lambda files and a small Express wrapper. The repo contains `presignLambda.js` and `completeLambda.js` which you can adapt into a local Express server for integration testing.

1. Frontend

```cmd
cd frontend
npm install
npm run dev
```

2. Backend (local mock server)

Create a small Express wrapper that exposes:
- `POST /api/upload/presign` -> returns JSON with `uploadId`, `s3Key`, `presignedUrl` (for local testing you can return a local mock URL or preflight to MinIO)
- `POST /api/upload/complete` -> returns `jobId`, and optionally enqueue a local job

You can reuse `backend/presignLambda.js` and `backend/completeLambda.js` code for the handlers (they are Lambda-compatible; for local dev wrap their logic in an Express route).


## Backend: Lambdas (presign + complete)

Files in `backend/` include examples: `presignLambda.js` and `completeLambda.js`. These are the core handlers you will deploy to AWS Lambda behind an API Gateway protected by Cognito.

- `presignLambda` responsibilities:
  - Validate Cognito-authenticated user (authorizer on API Gateway)
  - Generate `uploadId` and `s3Key`
  - Create or update the upload record in `SimplifAIFileMetadata` (DynamoDB)
  - Return a presigned PUT URL for S3

- `completeLambda` responsibilities:
  - Validate the request and update the upload record to `processing`
  - Send SQS message `{ uploadId, s3Key, userId }` to trigger the worker
  - Return `jobId` / accepted status

Deployment notes:
- `backend/lambda-trust.json` and `backend/lambda-policy.json` contain IAM role definitions used for Lambda execution. Use `README-Lambda-Deploy.md` to deploy via AWS CLI or SAM.


## Frontend: wiring and upload flow

The upload flow from the browser is:

1. User selects file in frontend UI (MainContent or attachments UI).
2. Frontend calls `POST /api/upload/presign` with metadata (filename, size, contentType). Include the Cognito access token in the `Authorization: Bearer <token>` header.
3. Backend returns `{ uploadId, s3Key, presignedUrl }`.
4. Frontend performs a `PUT` to `presignedUrl` with the file contents. Show progress using `XMLHttpRequest` or `fetch` with progress API.
5. After successful PUT (HTTP 200/201), frontend calls `POST /api/upload/complete` with `{ uploadId, s3Key, filename, size }`.
6. Backend accepts the notification, updates DynamoDB and enqueues processing.
7. Worker processes the file (background). Frontend may poll `GET /api/uploads/{uploadId}` to show status.

Example frontend fetch (after presign):

```js
// presign response has presignedUrl
await fetch(presignedUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
});
// then call complete
await fetch('/api/upload/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ uploadId, s3Key, filename: file.name, size: file.size })
});
```


## AWS production setup (concise step-by-step)

1. Create S3 bucket (admin). Example:
```cmd
aws s3api create-bucket --bucket simplifai-uploads-us-east-1 --profile default
```
2. Harden bucket:
```cmd
aws s3api put-public-access-block --bucket simplifai-uploads-us-east-1 --public-access-block-configuration "{\"BlockPublicAcls\":true,\"IgnorePublicAcls\":true,\"BlockPublicPolicy\":true,\"RestrictPublicBuckets\":true}" --profile default
aws s3api put-bucket-encryption --bucket simplifai-uploads-us-east-1 --server-side-encryption-configuration "{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}" --profile default
```
3. Create SQS queue for processing:
```cmd
aws sqs create-queue --queue-name simplifai-processing-queue --profile default
```
4. Create `SimplifAI-Service` programmatic IAM user (or use roles) and attach a restricted policy that allows read/write to that S3 bucket, SQS send/receive, and DynamoDB access for the three tables.
5. Deploy Lambdas (`presign` & `complete`) with an IAM role that grants S3 `GetObject/PutObject`, DynamoDB `PutItem/UpdateItem/GetItem`, SQS `SendMessage`, and access to Secrets Manager.
6. Create DynamoDB tables if not already present (`SimplifAIFileMetadata`, `SimplifAIChatHistory`, `SimplifAIUsers`) or reuse existing ones.
7. Create worker (ECS Fargate recommended) to process SQS messages; the worker will need network access to S3 and the vector DB.
8. Choose vector DB: managed Pinecone/Weaviate (easiest) or OpenSearch k-NN (AWS-native). Configure the worker to upsert vectors.


## API contract

- POST /api/upload/presign
  - Auth: Cognito (Bearer token)
  - Body: { filename, contentType, size }
  - Response: { uploadId, s3Key, presignedUrl, expiresAt }

- POST /api/upload/complete
  - Auth: Cognito
  - Body: { uploadId, s3Key, filename, size }
  - Response: { jobId, status: 'accepted' }

- GET /api/uploads/{uploadId}
  - Auth: Cognito
  - Response: upload metadata and status

- POST /api/chat
  - Auth: Cognito
  - Body: { conversationId?, userMessage, topK? }
  - Response: { conversationId, messageId, assistantReply, sources }


## Environment variables (examples)

Backend Lambda (example env names):
```
S3_BUCKET=simplifai-uploads-us-east-1
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/<account>/simplifai-processing-queue
DYNAMODB_TABLE_UPLOADS=SimplifAIFileMetadata
DYNAMODB_TABLE_CONVERSATIONS=SimplifAIChatHistory
VECTOR_DB_ENDPOINT=... (Pinecone/Opensearch)
SECRETS_MANAGER_KEY=SimplifAI/LLM
```

Store API keys (OpenAI, Pinecone) in AWS Secrets Manager and read them from Lambdas/Workers at runtime.


## Testing and verification

1. Use the `simplifai-service` profile and run the verification commands shown in earlier steps to ensure the service user can access S3 and SQS.

```cmd
aws sts get-caller-identity --profile simplifai-service
aws s3 ls s3://simplifai-uploads-us-east-1 --profile simplifai-service
aws sqs get-queue-url --queue-name simplifai-processing-queue --profile simplifai-service
```

2. Presign test (CLI): emulate the frontend call to presign (you can call the Lambda via API Gateway or test locally). The Lambda should return `presignedUrl`.
3. Upload the file to S3 using the presignedUrl (curl or fetch) and then call `/api/upload/complete`.
4. Confirm SQS message was enqueued and worker processed the file by inspecting DynamoDB item status `processing -> ready` and logs in CloudWatch.


## Security & production notes

- Never commit AWS keys to Git. Store them in Secrets Manager (or a vault).
- Prefer IAM roles assigned to Lambda/ECS instead of long-lived access keys.
- Enforce least privilege on IAM policies. Keep admin users for human tasks only and enable MFA.
- Add CloudWatch alarms for Lambda failures, SQS depth, OpenSearch CPU, and unexpected cost increases.


## Troubleshooting

- AccessDenied when using the `simplifai-service` profile: ensure the inline policy has the correct ARNs for S3/SQS/DynamoDB. You may need to update `backend/service-policy.json` and reattach.
- NoSuchBucket: confirm the bucket exists in the same region as your profile.
- Missing presignedUrl: check Lambda CloudWatch logs for stack traces.


## Next steps

1. Deploy `presignLambda` and `completeLambda` to AWS Lambda and configure API Gateway with Cognito authorizer.
2. Implement and deploy the worker on ECS Fargate (or Lambda if files are small and processing short-lived).
3. Integrate vector DB and implement `POST /api/chat` with RAG logic.
4. Wire up the frontend UI (MainContent) to call presign/complete and poll for processing status.


---

If you want, I can also:
- Generate a SAM template (or CDK stack) to deploy the Lambdas, SQS, and API Gateway.
- Create a small Express test server that uses the Lambda handlers locally so you can test the frontend immediately.
- Add a short shell script that runs the end-to-end presign → upload → complete flow for testing.

Tell me which of these you'd like me to implement next and I will proceed step-by-step.
