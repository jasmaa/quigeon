const requestNameReText = `[\\w\\s]{1,20}`;
const collectionNameReText = `[\\w\\s]{1,20}`;

const requestNameRe = new RegExp(`^${requestNameReText}$`);
const collectionNameRe = new RegExp(`^${collectionNameReText}$`);

export function validateCollectionName(name: string) {
  return collectionNameRe.test(name);
}

export function validateRequestName(name: string) {
  return requestNameRe.test(name);
}