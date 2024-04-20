import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { decryptSecret, encryptSecret } from './crypto';

describe('test encryptSecret and decryptSecret', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      NODE_ENV: "production",
      NEXT_PUBLIC_ENCRYPTION_KEY_SECRETS: JSON.stringify([
        {
          "version": "1",
          "method": "custom_aes-256-ctr",
          "secretValue": "supersecret",
        },
        {
          "version": "2",
          "method": "aws_AES256_GCM_IV12_TAG16_NO_PADDING",
          "secretValue": "supersecret",
        },
      ]),
      NEXT_PUBLIC_CURRENT_ENCRYPTION_KEY_VERSION: "2",
    };
    originalEnv = process.env;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should encrypt and decrypt when using custom_aes-ctr-256 method', async () => {
    const expectedPlaintext = "some-secret";
    const ciphertext = await encryptSecret(expectedPlaintext, "1");
    const plaintext = await decryptSecret(ciphertext, "1");
    expect(plaintext).toBe(expectedPlaintext);
  });

  it('should encrypt and decrypt when using aws_AES256_GCM_IV12_TAG16_NO_PADDING', async () => {
    const expectedPlaintext = "some-secret";
    const ciphertext = await encryptSecret(expectedPlaintext, "2");
    const plaintext = await decryptSecret(ciphertext, "2");
    expect(plaintext).toBe(expectedPlaintext);
  });

  it('should fail to encrypt and decrypt when version does not exist', async () => {
    expect(async () => {
      const plaintext = "some-secret";
      await decryptSecret(plaintext, "3");
    }).rejects.toThrow();
    expect(async () => {
      const ciphertext = "some-cipher";
      await decryptSecret(ciphertext, "3");
    }).rejects.toThrow();
  });

  it('should fail to encrypt and decrypt when versions are mismatched', async () => {
    const expectedPlaintext = "some-secret";
    const ciphertext = await encryptSecret(expectedPlaintext, "1");
    expect(async () => {
      await decryptSecret(ciphertext, "2");
    }).rejects.toThrow();
  });
});