const crypto = require('crypto');

const uuidReText = `[0-9a-f]{32}`;
const requestNameReText = `\\w{1,20}`;
const requestFileNameReText = `(${uuidReText})\\-(\\w+)\\-(${requestNameReText})\\.json`;

const requestNameRe = new RegExp(`^${requestNameReText}$`);
const requestFileNameRe = new RegExp(`^${requestFileNameReText}$`);

export function generateId() {
  return crypto.randomBytes(16).toString("hex");
}

export function parseRequestFileName(name: string) {
  const m = requestFileNameRe.exec(name);
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

export function validateRequestName(name: string) {
  return requestNameRe.test(name);
}