import { CollectionDisplay, Request, RequestDisplay } from "./interfaces";
import { generateId } from "./store";

export function getDefaultRequest(): Request {
  return {
    id: generateId(),
    name: "My Request",
    collectionId: "",
    accessKey: "",
    secretKey: "",
    sessionToken: "",
    region: "",
    service: "",
    method: "GET",
    url: "",
    body: "",
    headers: [],
  };
}

export function getDefaultRequestDisplay(): RequestDisplay {
  return {
    request: getDefaultRequest(),
  };
}

export function getDefaultCollectionDisplay(): CollectionDisplay {
  return {
    collection: {
      id: generateId(),
      name: "My Collection",
    },
    requests: [],
  };
}