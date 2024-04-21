import { CollectionDisplay, Environment, Request, RequestDisplay, Variable } from "./interfaces";
import { generateId } from "./store";
import { parseTextNodes } from "./parsing";

export function getDefaultRequest(): Request {
  return {
    id: generateId(),
    name: "My Request",
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
    isOpen: false,
    requests: [],
  };
}

export function getDefaultEnvironment(): Environment {
  return {
    id: generateId(),
    name: "Default",
    variables: [
      {
        name: "",
        value: "",
      }
    ],
  };
}

export function generateVariableSubsitutedRequest(request: Request, variables: Variable[]): Request {
  const varLookup = new Map();
  for (const { name, value } of variables) {
    varLookup.set(name, value);
  }
  const subbedRequest = {
    ...request,
    url: subVars(request.url, varLookup),
    headers: request.headers.map((header) => {
      return {
        ...header,
        value: header.editable ? subVars(header.value, varLookup) : header.value,
      }
    }),
    accessKey: subVars(request.accessKey, varLookup),
    secretKey: subVars(request.secretKey, varLookup),
    sessionToken: subVars(request.sessionToken, varLookup),
    region: subVars(request.region, varLookup),
    service: subVars(request.service, varLookup),
  };
  return subbedRequest;
}

function subVars(s: string, lookup: Map<string, string>) {
  const textNodes = parseTextNodes(s);
  const chunks = textNodes.map((textNode) => {
    switch (textNode.type) {
      case "none":
        return textNode.text;
      case "var":
        const value = lookup.get(textNode.varMetadata!.name);
        if (!value) {
          throw new Error(`${textNode.varMetadata!.name} was not in lookup`);
        }
        return value;
    }
  });
  return chunks.join("");
}