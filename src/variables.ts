import { Request, TextNode, Variable } from "./interfaces";

export function parseTextNodes(s: string) {
  const matches = [...s.matchAll(/\$(\w+)/g)];
  const textNodes: TextNode[] = [];
  let p = 0;
  let q = 0;
  for (const m of matches) {
    q = m.index!;
    if (p < q) {
      const text = s.substring(p, q);
      textNodes.push({
        text,
        type: "none",
      });
      p = q;
    }
    q = m.index! + m[0].length;
    const text = s.substring(p, q);
    textNodes.push({
      text,
      type: "var",
      varMetadata: {
        name: m[1],
      }
    });
    p = q;
  }
  q = s.length;
  if (p < q) {
    const text = s.substring(p, q);
    textNodes.push({
      text,
      type: "none",
    });
    p = q;
  }
  return textNodes;
}

export function generateSendableRequest(request: Request, variables: Variable[]) {
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
  }
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