import { Box, CopyToClipboard, TextContent } from "@cloudscape-design/components";
import Highlight from "react-highlight";

export default function CodeBlock({
  code,
  language,
  copyEnabled = false,
}: {
  code: string,
  language: string,
  copyEnabled?: boolean,
}) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: "100%" }}>
        <Box float="right" margin="xxs">
          {copyEnabled && (
            <CopyToClipboard
              copyButtonAriaLabel="Copy code"
              copyErrorText="Failed to copy code"
              copySuccessText="Copied code"
              textToCopy={code}
              variant="icon"
            />
          )}
        </Box>
      </div>
      <TextContent>
        <Highlight className={language}>
          {code}
        </Highlight>
      </TextContent>
    </div>
  )
}