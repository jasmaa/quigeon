import Database from "tauri-plugin-sql-api";
import { Collection, Environment, Request } from "./interfaces";

const crypto = require('crypto');
const encryptionAlgo = "aes-256-ctr"

export function generateId() {
  return crypto.randomBytes(16).toString("hex");
}

function getEncryptionKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET!;
  const key = crypto.createHash("sha256").update(String(secret)).digest('base64').substr(0, 32);
  return key;
}

function encryptSecret(s: string): string {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();

  const cipher = crypto.createCipheriv(encryptionAlgo, key, iv);
  const encrypted = cipher.update(s);

  const encryptedB64 = Buffer.from(encrypted).toString("base64");
  const ivB64 = Buffer.from(iv).toString("base64");
  const secret = `${encryptedB64}:${ivB64}`;
  return secret;
}

function decryptSecret(s: string): string {
  const [encryptedB64, ivB64] = s.split(":");

  const iv = new Uint8Array(Buffer.from(ivB64, 'base64'));
  const encrypted = new Uint8Array(Buffer.from(encryptedB64, 'base64'));

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(encryptionAlgo, key, iv);
  const decrypted = decipher.update(encrypted);

  return decrypted.toString();
}

class Store {
  private path: string;
  private db?: Database;
  private isInitialized: boolean;

  constructor(path: string) {
    this.path = path;
    this.isInitialized = false;
  }

  async initialize() {
    this.db = await Database.load(this.path);
    await this.db.execute(`CREATE TABLE IF NOT EXISTS collections (
      id VARCHAR(32) PRIMARY KEY,
      name VARCHAR(256)
    )`);
    await this.db.execute(`CREATE TABLE IF NOT EXISTS requests (
      id VARCHAR(32) PRIMARY KEY,
      name VARCHAR(256),
      collectionId VARCHAR(32),
      accessKey VARCHAR(256),
      secretKey VARCHAR(256),
      sessionToken VARCHAR(256),
      region VARCHAR(16),
      service VARCHAR(16),
      method VARCHAR(8),
      url VARCHAR(256),
      body BLOB,
      headers BLOB
    )`);
    await this.db.execute(`CREATE TABLE IF NOT EXISTS environments (
      id VARCHAR(32) PRIMARY KEY,
      name VARCHAR(256),
      variables BLOB
    )`);
    this.isInitialized = true;
  }

  getIsInitialized() {
    return this.isInitialized;
  }

  async upsertCollection(collection: Collection): Promise<Collection> {
    await this.db?.execute(
      `INSERT into collections (id, name) VALUES ($1, $2)
      ON CONFLICT(id)
      DO UPDATE SET name=$2`,
      [collection.id, collection.name],
    );
    return collection;
  }

  async listCollections(): Promise<Collection[]> {
    const rows = await this.db?.select("SELECT * FROM collections") as any[];
    return rows as Collection[];
  }

  async deleteCollection(id: string): Promise<void> {
    await this.db?.execute(
      `DELETE FROM requests WHERE collectionId=$1`,
      [id],
    );
    await this.db?.execute(
      `DELETE FROM collections WHERE id=$1`,
      [id],
    );
  }

  async upsertRequest(request: Request): Promise<Request> {
    await this.db?.execute(
      `INSERT into requests (id, name, collectionId, accessKey, secretKey, sessionToken, region, service, method, url, body, headers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT(id)
      DO UPDATE SET name=$2, collectionId=$3, accessKey=$4, secretKey=$5, sessionToken=$6, region=$7, service=$8, method=$9, url=$10, body=$11, headers=$12`,
      [request.id, request.name, request.collectionId, request.accessKey, request.secretKey, request.sessionToken, request.region, request.service, request.method, request.url, request.body, request.headers],
    );
    return request;
  }

  async getRequest(id: string): Promise<Request> {
    const rows = await this.db?.select("SELECT * FROM requests WHERE id=$1", [id]) as any[];
    const row = rows[0];
    row.headers = JSON.parse(row.headers);
    return row as Request;
  }

  async listRequests(collectionId: string): Promise<Request[]> {
    const rows = await this.db?.select("SELECT * FROM requests WHERE collectionId=$1", [collectionId]) as any[];
    for (const row of rows) {
      row.headers = JSON.parse(row.headers);
    }
    return rows as Request[];
  }

  async deleteRequest(id: string): Promise<void> {
    await this.db?.execute(
      `DELETE FROM requests WHERE id=$1`,
      [id],
    );
  }

  async upsertEnvironment(environment: Environment): Promise<Environment> {
    const encryptedVariables = encryptSecret(JSON.stringify(environment.variables));

    await this.db?.execute(
      `INSERT into environments (id, name, variables)
      VALUES ($1, $2, $3)
      ON CONFLICT(id)
      DO UPDATE SET name=$2, variables=$3`,
      [environment.id, environment.name, encryptedVariables],
    );
    return environment;
  }

  async getEnvironment(id: string): Promise<Environment> {
    const rows = await this.db?.select("SELECT * FROM environments WHERE id=$1", [id]) as any[];
    const row = rows[0];
    row.variables = JSON.parse(decryptSecret(row.variables));
    return row as Environment;
  }

  async listEnvironments(): Promise<Environment[]> {
    const rows = await this.db?.select("SELECT * FROM environments") as any[];
    for (const row of rows) {
      row.variables = JSON.parse(decryptSecret(row.variables));
    }
    return rows as Environment[];
  }
}

let store: Store;
export async function getOrCreateStore() {
  if (store && store.getIsInitialized()) {
    return store;
  } else {
    store = new Store("sqlite:data.db");
    await store.initialize();
    return store;
  }
}