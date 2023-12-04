export interface CollectionDisplay {
  collection: CollectionPartial;
  requests: RequestPayload[];
}

export interface RequestDisplay {
  request: RequestPayload
  indices?: {
    collectionDisplayIdx: number
    requestIdx: number
  }
}

export interface CollectionPartial {
  id: string;
  name: string;
}

export interface RequestPartial {
  id: string;
  name: string;
  collectionId: string;
  method: string;
}

export interface RequestHeader {
  key: string,
  value: string,
  editable: boolean,
}

export interface RequestPayload {
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
