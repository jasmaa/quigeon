import {
  RawAesWrappingSuiteIdentifier,
  RawAesKeyringWebCrypto,
  buildClient,
  CommitmentPolicy,
} from '@aws-crypto/client-browser'
import { toBase64, fromBase64 } from '@aws-sdk/util-base64-browser';
import { EncryptionKeySecret } from './interfaces';

const crypto = window.crypto;
const { encrypt, decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT);

async function createEncryptionKeyV2(secretValue: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secretValue));
  const encodedHash = Buffer.from(hash).toString('base64');
  return encodedHash;
}

async function createKeyRing(secretValue: string): Promise<RawAesKeyringWebCrypto> {
  const unencryptedMasterKey = fromBase64(await createEncryptionKeyV2(secretValue));
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

function getEncryptionKeySecret(version: string) {
  const encryptionSecrets = JSON.parse(import.meta.env.VITE_PUBLIC_ENCRYPTION_KEY_SECRETS!) as EncryptionKeySecret[];
  const secrets = encryptionSecrets.find((secret) => secret.version === version);
  if (!secrets) {
    throw new Error("unable to load encryption key secret")
  }
  return secrets;
}

export async function encryptSecret(plaintext: string, version: string) {
  const encryptionKeySecret = getEncryptionKeySecret(version);
  switch (encryptionKeySecret.method) {

    case "aws_AES256_GCM_IV12_TAG16_NO_PADDING":
      return await encryptSecretV2(plaintext, encryptionKeySecret);
    default:
      throw new Error("invalid method");
  }
}

export async function decryptSecret(ciphertext: string, version: string) {
  const encryptionKeySecret = getEncryptionKeySecret(version);
  switch (encryptionKeySecret.method) {
    case "aws_AES256_GCM_IV12_TAG16_NO_PADDING":
      return await decryptSecretV2(ciphertext, encryptionKeySecret);
    default:
      throw new Error("invalid method");
  }
}