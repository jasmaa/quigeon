import {
  RawAesWrappingSuiteIdentifier,
  RawAesKeyringWebCrypto,
  buildClient,
  CommitmentPolicy,
} from '@aws-crypto/client-browser'
import { toBase64, fromBase64 } from '@aws-sdk/util-base64-browser';
import { EncryptionKeySecret } from './interfaces';

const crypto = require('crypto');
const { encrypt, decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT);

function createEncryptionKeyV2(secretValue: string): string {
  const hash = crypto.createHash("sha256").update(String(secretValue));
  const encodedHash = hash.digest('base64');
  return encodedHash;
}

async function createKeyRing(secretValue: string): Promise<RawAesKeyringWebCrypto> {
  const unencryptedMasterKey = fromBase64(createEncryptionKeyV2(secretValue));
  const wrappingSuite = RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING;
  const masterKey = await RawAesKeyringWebCrypto.importCryptoKey(
    unencryptedMasterKey,
    wrappingSuite
  );
  return new RawAesKeyringWebCrypto({
    keyName: "aes-key",
    keyNamespace: "aes-namespace",
    wrappingSuite,
    masterKey,
  });
}

async function encryptSecretV2(plaintext: string, encryptionKeySecret: EncryptionKeySecret): Promise<string> {
  const keyRing = await createKeyRing(encryptionKeySecret.secretValue);
  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const { result } = await encrypt(keyRing, encodedPlaintext, {
    encryptionContext: {
      version: encryptionKeySecret.version,
    }
  });
  return toBase64(result);
}

async function decryptSecretV2(ciphertext: string, encryptionKeySecret: EncryptionKeySecret): Promise<string> {
  const keyRing = await createKeyRing(encryptionKeySecret.secretValue);
  const rawCiphertext = fromBase64(ciphertext);
  const { plaintext, messageHeader } = await decrypt(keyRing, rawCiphertext);
  const { encryptionContext } = messageHeader;
  if (encryptionContext.version !== encryptionKeySecret.version) {
    throw new Error("invalid secret version");
  }
  const decodedPlaintext = new TextDecoder().decode(plaintext);
  return decodedPlaintext;
}

/**
 * @deprecated Use V2 which uses AWS Encryption SDK
 */
function createEncryptionKeyV1(secretValue: string): string {
  const hash = crypto.createHash("sha256").update(String(secretValue));
  const encodedHash = hash.digest('base64');
  return encodedHash.substr(0, 32);
}

const encryptionAlgoV1 = "aes-256-ctr";

/**
 * @deprecated Use V2 which uses AWS Encryption SDK
 */
function encryptSecretV1(plaintext: string, encryptionKeySecret: EncryptionKeySecret): string {
  const iv = crypto.randomBytes(16);
  const key = createEncryptionKeyV1(encryptionKeySecret.secretValue);

  const cipher = crypto.createCipheriv(encryptionAlgoV1, key, iv);
  const encrypted = cipher.update(plaintext);

  const encryptedB64 = Buffer.from(encrypted).toString("base64");
  const ivB64 = Buffer.from(iv).toString("base64");
  const secret = `${encryptedB64}:${ivB64}`;
  return secret;
}

/**
 * @deprecated Use V2 which uses AWS Encryption SDK
 */
function decryptSecretV1(ciphertext: string, encryptionKeySecret: EncryptionKeySecret): string {
  const [encryptedB64, ivB64] = ciphertext.split(":");

  const iv = new Uint8Array(Buffer.from(ivB64, 'base64'));
  const encrypted = new Uint8Array(Buffer.from(encryptedB64, 'base64'));

  const key = createEncryptionKeyV1(encryptionKeySecret.secretValue);
  const decipher = crypto.createDecipheriv(encryptionAlgoV1, key, iv);
  const decrypted = decipher.update(encrypted);

  return decrypted.toString();
}

function getEncryptionKeySecret(version: string) {
  const encryptionSecrets = JSON.parse(process.env.NEXT_PUBLIC_ENCRYPTION_KEY_SECRETS!) as EncryptionKeySecret[];
  const secrets = encryptionSecrets.find((secret) => secret.version === version);
  if (!secrets) {
    throw new Error("unable to load encryption key secret")
  }
  return secrets;
}

export async function encryptSecret(plaintext: string, version: string) {
  const encryptionKeySecret = getEncryptionKeySecret(version);
  switch (encryptionKeySecret.method) {
    case "custom_aes-256-ctr":
      return encryptSecretV1(plaintext, encryptionKeySecret);
    case "aws_AES256_GCM_IV12_TAG16_NO_PADDING":
      return await encryptSecretV2(plaintext, encryptionKeySecret);
    default:
      throw new Error("invalid method");
  }
}

export async function decryptSecret(ciphertext: string, version: string) {
  const encryptionKeySecret = getEncryptionKeySecret(version);
  switch (encryptionKeySecret.method) {
    case "custom_aes-256-ctr":
      return decryptSecretV1(ciphertext, encryptionKeySecret);
    case "aws_AES256_GCM_IV12_TAG16_NO_PADDING":
      return await decryptSecretV2(ciphertext, encryptionKeySecret);
    default:
      throw new Error("invalid method");
  }
}