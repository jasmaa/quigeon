import { RequestPayload } from "./interfaces";
const crypto = require('crypto');

const uuidReText = `[0-9a-f]{32}`;
const nameReText = `^(${uuidReText})\\-(\\w+)\\-(\\w+)\\.json$`;
const nameRe = new RegExp(nameReText);

export function generateId() {
  return crypto.randomBytes(16).toString("hex");
}

export function parseRequestFileName(name: string) {
  const m = nameRe.exec(name);
  if (m) {
    return {
      id: m[1],
      method: m[2],
      name: m[3],
    }
  } else {
    throw new Error("invalid name format");
  }
}

export function constructRequestFileName(id: string, method: string, name: string) {
  return `${id}-${method}-${name}.json`;
}