import {
  CollectionDisplay,
  Environment,
  Request,
  RequestDisplay,
  Variable,
} from "./interfaces";
import { parseTextNodes } from "./parsing";

function generateId() {
  return window.crypto.randomUUID();
}

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
      },
    ],
  };
}

export function generateVariableSubsitutedRequest(
  request: Request,
  variables: Variable[],
): Request {
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
        value: header.editable
          ? subVars(header.value, varLookup)
          : header.value,
      };
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
      case "var": {
        const value = lookup.get(textNode.varMetadata!.name);
        if (!value) {
          throw new Error(`${textNode.varMetadata!.name} was not in lookup`);
        }
        return value;
      }
    }
  });
  return chunks.join("");
}

export function generateAwscurl(request: Request): string {
  const args = [
    "awscurl",
    "-X",
    `'${request.method}'`,
    ...(request.body ? ["-d", `'${request.body}'`] : []),
    ...(request.headers
      ? request.headers.flatMap((header) => [
          "-H",
          `'${header.key}: ${header.value}'`,
        ])
      : []),
    ...(request.region ? ["--region", `'${request.region}'`] : []),
    ...(request.service ? ["--service", `'${request.service}'`] : []),
    ...(request.accessKey ? ["--access_key", `'${request.accessKey}'`] : []),
    ...(request.secretKey ? ["--secret_key", `'${request.secretKey}'`] : []),
    ...(request.sessionToken
      ? ["--security_token", `'${request.sessionToken}'`]
      : []),
    ...(request.url ? [`'${request.url}'`] : []),
  ];

  const groupedArgs = [];
  for (let i = 0; i < args.length; i++) {
    let v = "";
    v += args[i];
    if (args[i].startsWith("-")) {
      v += ` ${args[i + 1]}`;
      i += 1;
    }
    groupedArgs.push(v);
  }

  const spacer = "  ";
  const formattedArgs = groupedArgs
    .map((v, idx) => (idx > 0 ? `${spacer}${v}` : v))
    .map((v, idx) => (idx < groupedArgs.length - 1 ? `${v} \\` : v));

  return formattedArgs.join("\n");
}
