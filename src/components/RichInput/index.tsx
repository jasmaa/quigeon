import { useEffect, useState } from "react";
import { Input, InputProps, TextContent } from "@cloudscape-design/components";
import { parseTextNodes } from "@quigeon/parsing";
import { TextNode } from "@quigeon/interfaces";

export default function RichInput(props: InputProps) {
  const [textNodes, setTextNodes] = useState<TextNode[]>(parseTextNodes(props.value));

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
                  return <span style={{ color: "salmon" }}>{textNode.text}</span>
              }
            })}
          </p>
        </TextContent>
      </div>
    </>
  );
}