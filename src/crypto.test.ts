import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

describe("test encryptSecret and decryptSecret", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      NODE_ENV: "production",
      VITE_PUBLIC_ENCRYPTION_KEY_SECRETS: JSON.stringify([
        {
          version: "1",
          method: "custom_aes-256-ctr",
          secretValue: "supersecret",
        },
        {
          version: "2",
          method: "aws_AES256_GCM_IV12_TAG16_NO_PADDING",
          secretValue: "supersecret",
        },
        {
          version: "3",
          method: "aws_AES256_GCM_IV12_TAG16_NO_PADDING",
          secretValue: "supersecret",
        },
        {
          version: "4",
          method: "invalid_method",
        },
      ]),
    };
    originalEnv = process.env;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // TODO: reimplement custom_aes-ctr-256 or remove test
  it.skip("should encrypt and decrypt when using custom_aes-ctr-256 method", async () => {
    const expectedPlaintext = "some-secret";
    const ciphertext = await encryptSecret(expectedPlaintext, "1");
    const plaintext = await decryptSecret(ciphertext, "1");
    expect(plaintext).toBe(expectedPlaintext);
  });

  it("should encrypt and decrypt when using aws_AES256_GCM_IV12_TAG16_NO_PADDING", async () => {
    const expectedPlaintext = "some-secret";
    const ciphertext = await encryptSecret(expectedPlaintext, "2");
    const plaintext = await decryptSecret(ciphertext, "2");
    expect(plaintext).toBe(expectedPlaintext);
  });

  it("should fail to encrypt and decrypt when encryption version does not exist", async () => {
    expect(async () => {
      const plaintext = "some-secret";
      await encryptSecret(plaintext, "0");
    }).rejects.toThrow();
    expect(async () => {
      const ciphertext = "some-cipher";
      await decryptSecret(ciphertext, "0");
    }).rejects.toThrow();
  });

  it("should fail to encrypt and decrypt when encryption method is invalid", async () => {
    expect(async () => {
      const plaintext = "some-secret";
      await encryptSecret(plaintext, "4");
    }).rejects.toThrow();
    expect(async () => {
      const ciphertext = "some-cipher";
      await decryptSecret(ciphertext, "4");
    }).rejects.toThrow();
  });

  it("should fail to encrypt and decrypt when encryption key versions are mismatched", async () => {
    const expectedPlaintext = "some-secret";
    const ciphertext = await encryptSecret(expectedPlaintext, "2");

    expect(async () => {
      await decryptSecret(ciphertext, "1");
    }).rejects.toThrow();

    expect(async () => {
      await decryptSecret(ciphertext, "3");
    }).rejects.toThrow();
  });
});
