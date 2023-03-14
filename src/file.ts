import { OptionDefinition } from "@cloudscape-design/components/internal/components/option/interfaces";
import { RequestHeader } from "@awspostman/components/RequestHeaderEditor";

export interface RequestContent {
  accessKey: string;
  secretKey: string;
  sessionToken: string;
  region: string;
  service: string;
  methodOption: OptionDefinition;
  url: string;
  body: string;
  headers: RequestHeader[];
}

export interface CollectionContent {
  requests: RequestContent[];
}

class ContentCache {
  private filePath: string | null;
  private collection: CollectionContent | null;

  constructor() {
    this.filePath = null;
    this.collection = null;
  }

  getCollection(): CollectionContent | null {
    return this.collection;
  }

  setCollection(collection: CollectionContent | null) {
    this.collection = collection;
  }

  getFilePath(): string | null {
    return this.filePath;
  }

  setFilePath(filePath: string | null) {
    this.filePath = filePath;
  }
}

export const contentCache = new ContentCache();