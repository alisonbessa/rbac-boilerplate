### M5 — Storage (S3-compatible) Guide

This guide covers using S3 or MinIO with the boilerplate for presigned uploads/downloads.

### Local (MinIO) setup

- Start services:
  - `docker compose -f infra/docker-compose.yml up -d minio`
- MinIO console:
  - URL: `http://localhost:9001`
  - Credentials: `minio` / `minio123`
- Create buckets in the console (recommended):
  - `dev-private`
  - `dev-public` (optional)

### Environment variables

Place these in your root `.env` (see `.env.example`):

- MinIO (dev):
  - `S3_ENDPOINT=http://localhost:9000`
  - `S3_REGION=us-east-1`
  - `S3_ACCESS_KEY=minio`
  - `S3_SECRET_KEY=minio123`
  - `S3_FORCE_PATH_STYLE=true`
  - `S3_BUCKET_PRIVATE=dev-private`
  - `S3_BUCKET_PUBLIC=dev-public` (optional)

- AWS S3 (prod):
  - `S3_REGION=us-east-1` (or your region)
  - `S3_ACCESS_KEY=...`
  - `S3_SECRET_KEY=...`
  - `S3_BUCKET_PRIVATE=...`
  - `S3_BUCKET_PUBLIC=...` (optional)
  - Optionally set `S3_ENDPOINT` if using non-standard endpoints (e.g., S3-compatible providers)

### How it works

- API exposes endpoints that return presigned URLs:
  - `POST /api/v1/storage/presign-upload` `{ key, contentType, bucket? }` → `{ url }`
  - `POST /api/v1/storage/presign-download` `{ key, bucket? }` → `{ url }`
- The front then calls the signed URL directly (PUT for upload, GET for download).

### Frontend example

- Go to `/demo` and click "Presign & Upload sample file". This will:
  - Request a presigned upload URL for a text file key under `demo/`.
  - Perform a signed PUT to upload `Hello from demo upload`.
  - Show success or error.

### Common pitfalls

- Ensure buckets exist before trying to upload/download.
- For MinIO, use `S3_FORCE_PATH_STYLE=true` and `S3_ENDPOINT=http://localhost:9000`.
- CORS is not needed for presigned URLs, but ensure your MinIO/S3 setup allows the requested operation.
- Keys are case-sensitive; ensure `bucket` and `key` are correct.

### Security notes

- Presigned URLs are short-lived and scoped to a single operation.
- Do not log or expose presigned URLs beyond what is necessary for the client to complete the upload/download.
- Consider scanning uploads server-side when processing user-generated content.
