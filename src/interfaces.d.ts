export interface CollectionPartial {
  id: string;
  name: string;
  isOpen: boolean;
  isEditing: boolean;
  requests: RequestPartial[],
}

export interface RequestPartial {
  id: string;
  name: string;
  collectionId: string;
  method: string;
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
