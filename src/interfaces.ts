export interface CollectionDisplay {
  collection: Collection;
  requests: Request[];
  isOpen: boolean;
}

export interface RequestDisplay {
  request: Request;
  collection?: Collection;
  indices?: {
    collectionDisplayIdx: number;
    requestIdx: number;
  };
}

export interface Collection {
  id: string;
  name: string;
}

export interface RequestHeader {
  key: string;
  value: string;
  editable: boolean;
}

export interface Request {
  id: string;
  collectionId?: string;
  name: string;
  accessKey: string;
  secretKey: string;
  sessionToken: string;
  region: string;
  service: string;
  method: string;
  url: string;
  body: string;
  headers: RequestHeader[];
}

export interface ResponsePayload {
  status: string;
  headers: { [key: string]: string[] };
  sizeBytes: number;
  timeMs: number;
  text: string;
}

export interface TextNode {
  text: string;
  type: "none" | "var";
  varMetadata?: {
    name: string;
  };
}

export interface Environment {
  id: string;
  name: string;
  variables: Variable[];
}

export interface Variable {
  name: string;
  value: string;
}

export interface EncryptionKeySecret {
  version: string;
  method: string;
  secretValue: string;
}

export interface Secret {
  version: string;
  encryptedValue: string;
}
