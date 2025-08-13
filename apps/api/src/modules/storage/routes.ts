import type { FastifyInstance } from 'fastify';

export async function registerStorageRoutes(app: FastifyInstance) {
  app.post('/api/v1/storage/presign-upload', async (req) => {
    const body = (req.body as { bucket?: string; key?: string; contentType?: string }) || {};
    const bucket = body.bucket || process.env.S3_BUCKET_PRIVATE || 'dev-private';
    if (!bucket || !body.key || !body.contentType) {
      const err: Error & { statusCode?: number } = new Error('Missing bucket/key/contentType');
      err.statusCode = 400;
      throw err;
    }
    const url = await app.storage.getPresignedUploadUrl({
      bucket,
      key: body.key,
      contentType: body.contentType,
    });
    return { url };
  });

  app.post('/api/v1/storage/presign-download', async (req) => {
    const body = (req.body as { bucket?: string; key?: string }) || {};
    const bucket = body.bucket || process.env.S3_BUCKET_PRIVATE || 'dev-private';
    if (!bucket || !body.key) {
      const err: Error & { statusCode?: number } = new Error('Missing bucket/key');
      err.statusCode = 400;
      throw err;
    }
    const url = await app.storage.getPresignedDownloadUrl({ bucket, key: body.key });
    return { url };
  });
}
