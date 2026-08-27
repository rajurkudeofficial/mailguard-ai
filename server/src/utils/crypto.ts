/**
 * MailGuard AI — Cryptographic Utilities
 * AES-256-GCM encryption/decryption for OAuth tokens stored in DB.
 * Never stores plaintext tokens.
 */
import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string: iv:ciphertext:authTag
 */
export function encrypt(plaintext: string): string {
  const key = Buffer.from(config.tokenEncryptionKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    encrypted.toString('base64'),
    tag.toString('base64'),
  ].join(':');
}

/**
 * Decrypts an AES-256-GCM encrypted string produced by encrypt().
 */
export function decrypt(encryptedString: string): string {
  const key = Buffer.from(config.tokenEncryptionKey, 'hex');
  const [ivB64, encryptedB64, tagB64] = encryptedString.split(':');

  if (!ivB64 || !encryptedB64 || !tagB64) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final('utf8');
}
