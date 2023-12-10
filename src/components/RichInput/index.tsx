import { useEffect, useState } from "react";
import { Input, InputProps, TextContent } from "@cloudscape-design/components";
import { TextNode } from "./interfaces";

function parseTextNodes(s: string) {
  const matches = [...s.matchAll(/(\$\{\w+\})/g)];
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

export default function RichInput(props: InputProps) {

  const [textNodes, setTextNodes] = useState(parseTextNodes(props.value));

  useEffect(() => {
    const textNodes = parseTextNodes(props.value);
    setTextNodes(textNodes);
  }, [props.value]);

  return (
    <>
      <Input {...props} />
      <div style={{
        position: "absolute",
        top: 12,
        left: 24,
        userSelect: "none",
        pointerEvents: "none",
      }}>
        <TextContent>
          <p>
            {textNodes.map((textNode) => {
              switch (textNode.type) {
                case "none":
                  return <span style={{ color: "transparent" }}>{textNode.text}</span>
                case "var":
                  return <span style={{ color: "red" }}>{textNode.text}</span>
              }
            })}
          </p>
        </TextContent>
      </div>
    </>
  );
}