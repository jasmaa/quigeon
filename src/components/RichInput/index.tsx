import { Input, InputProps, TextContent } from "@cloudscape-design/components";
import * as awsui from "@cloudscape-design/design-tokens";
import { parseTextNodes } from "@quigeon/parsing";
import { TextNode } from "@quigeon/interfaces";

export default function RichInput(props: InputProps) {
  const textNodes: TextNode[] = parseTextNodes(props.value);

  return (
    <>
      <Input {...props} />
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 24,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <TextContent>
          <p>
            {textNodes.map((textNode, idx) => {
              switch (textNode.type) {
                case "none":
                  return (
                    <span key={idx} style={{ color: "transparent" }}>
                      {textNode.text}
                    </span>
                  );
                case "var":
                  return (
                    <span
                      key={idx}
                      style={{ color: awsui.colorTextLinkDefault }}
                    >
                      {textNode.text}
                    </span>
                  );
              }
            })}
          </p>
        </TextContent>
      </div>
    </>
  );
}
