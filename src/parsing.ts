import { TextNode } from "./interfaces";

export function parseTextNodes(s: string) {
  const matches = [...s.matchAll(/(?:\$(\w+)|\$\{(\w+)\})/g)];
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
        name: m[1] ?? m[2],
      },
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
