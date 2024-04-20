const requestNameReText = `[\\w\\s]{1,20}`;
const collectionNameReText = `[\\w\\s]{1,20}`;

const requestNameRe = new RegExp(`^${requestNameReText}$`);
const collectionNameRe = new RegExp(`^${collectionNameReText}$`);

export function validateCollectionName(name: string) {
  const trimmedName = name.trim();
  if (name !== trimmedName) {
    return false;
  }
  return collectionNameRe.test(trimmedName);
}

export function validateRequestName(name: string) {
  const trimmedName = name.trim();
  if (name !== trimmedName) {
    return false;
  }
  return requestNameRe.test(trimmedName);
}