export interface CollectionDisplay {
  collection: Collection;
  requests: Request[];
  isOpen: boolean;
}

export interface RequestDisplay {
  request: Request
  collection?: Collection
  indices?: {
    collectionDisplayIdx: number
    requestIdx: number
  }
}

export interface Collection {
  id: string;
  name: string;
}

export interface RequestHeader {
  key: string,
  value: string,
  editable: boolean,
}

export interface Request {
  id: string;
  name: string;
  collectionId: string;
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
  sizeBytes: number;
  timeMs: number;
  text: string;
}
