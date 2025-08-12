import argon2, { argon2id } from 'argon2';
import crypto from 'node:crypto';
import { env } from '../env';

const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const toHash = `${plain}${env.AUTH_PEPPER}`;
  return argon2.hash(toHash, {
    type: argon2id,
    memoryCost: 128 * 1024,
    timeCost: 3,
    parallelism: 1,
    salt,
    hashLength: HASH_LENGTH,
  });
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const toVerify = `${plain}${env.AUTH_PEPPER}`;
  try {
    return await argon2.verify(hash, toVerify);
  } catch {
    return false;
  }
}
