import { loadServerEnv } from '@rbac-boilerplate/config';
import {
  S3Client,
  type S3ClientConfig,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type PresignUploadInput = {
  bucket: string;
  key: string;
  contentType: string;
  expiresSec?: number;
};
export type PresignDownloadInput = { bucket: string; key: string; expiresSec?: number };

export interface StorageProvider {
  getPresignedUploadUrl(input: PresignUploadInput): Promise<string>;
  getPresignedDownloadUrl(input: PresignDownloadInput): Promise<string>;
}

export class S3StorageProvider implements StorageProvider {
  private readonly env = loadServerEnv();
  private readonly client: S3Client;
  private readonly forcePathStyle: boolean;
  private readonly region: string | undefined;

  constructor() {
    const cfg: S3ClientConfig = {};
    if (this.env.S3_ENDPOINT) cfg.endpoint = this.env.S3_ENDPOINT;
    if (this.env.S3_REGION) cfg.region = this.env.S3_REGION;
    if (this.env.S3_ACCESS_KEY && this.env.S3_SECRET_KEY)
      cfg.credentials = {
        accessKeyId: this.env.S3_ACCESS_KEY,
        secretAccessKey: this.env.S3_SECRET_KEY,
      };
    if (this.env.S3_FORCE_PATH_STYLE) {
      (cfg as any).forcePathStyle = true;
    }
    this.client = new S3Client(cfg);
    this.forcePathStyle = Boolean(this.env.S3_FORCE_PATH_STYLE);
    this.region = this.env.S3_REGION;
  }

  async getPresignedUploadUrl(input: PresignUploadInput): Promise<string> {
    const cmd = new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      ContentType: input.contentType,
    });
    const url = await getSignedUrl(this.client, cmd, { expiresIn: input.expiresSec ?? 900 });
    return url;
  }

  async getPresignedDownloadUrl(input: PresignDownloadInput): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: input.bucket, Key: input.key });
    const url = await getSignedUrl(this.client, cmd, { expiresIn: input.expiresSec ?? 900 });
    return url;
  }
}

export function createStorageProvider(): StorageProvider {
  return new S3StorageProvider();
}
