const crypto = require('crypto');

const uuidReText = `[0-9a-f]{32}`;
const requestNameReText = `[\\w\\s]{1,20}`;
const requestFileNameReText = `(${uuidReText})\\-(\\w+)\\-(${requestNameReText})\\.json`;
const collectionNameReText = `[\\w\\s]{1,20}`;
const collectionFolderNameReText = `(${uuidReText})\\-(${collectionNameReText})`;

const requestNameRe = new RegExp(`^${requestNameReText}$`);
const requestFileNameRe = new RegExp(`^${requestFileNameReText}$`);
const collectionNameRe = new RegExp(`^${collectionNameReText}$`);
const collectionFolderNameRe = new RegExp(`^${collectionFolderNameReText}$`);

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
  // Request file name follows <UUID>-<METHOD>-<NAME>.json format
  return `${id}-${method}-${name}.json`;
}

export function parseCollectionFolderName(name: string) {
  const m = collectionFolderNameRe.exec(name);
  if (m) {
    return {
      id: m[1],
      name: m[2],
    }
  } else {
    throw new Error("invalid name format");
  }
}

export function constructCollectionFolderName(id: string, name: string) {
  // Collection folder name follows <UUID>-<NAME>.json format
  return `${id}-${name}`;
}

export function validateCollectionName(name: string) {
  return collectionNameRe.test(name);
}

export function validateRequestName(name: string) {
  return requestNameRe.test(name);
}