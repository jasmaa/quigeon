import { useEffect } from "react";
import { Badge, Button, SpaceBetween, Container, Header, Spinner, Flashbar } from "@cloudscape-design/components";
import hljs from "highlight.js";
import * as beautify from "js-beautify";
import { ResponsePayload } from "@quigeon/interfaces";

enum PayloadType {
  JSON,
  HTML,
  UNKNOWN,
}

export default function ResponseContainer({
  response,
  loading,
  errorText,
  onCancel,
}: {
  response?: ResponsePayload
  loading?: boolean
  errorText: string
  onCancel: () => void
}) {

  useEffect(() => {
    hljs.highlightAll();
  }, [response]);

  const getPayloadType = (responsePayload: ResponsePayload) => {
    const { headers, text } = responsePayload;
    const contentType = headers["content-type"]?.[0];
    if (contentType) {
      // Determine payload type with content type
      if (contentType.includes("xml") || contentType.includes("html")) {
        return PayloadType.HTML;
      } else if (contentType.includes("json")) {
        return PayloadType.JSON;
      } else {
        return PayloadType.UNKNOWN;
      }
    } else {
      // Fallback on text based guess
      if (text.startsWith("<")) {
        return PayloadType.HTML;
      } else if (text.startsWith("{")) {
        return PayloadType.JSON;
      } else {
        return PayloadType.UNKNOWN;
      }
    }
  }

  const getHighlightClassName = (responsePayload: ResponsePayload) => {
    const payloadType = getPayloadType(responsePayload);
    switch (payloadType) {
      case PayloadType.HTML:
        return "language-html";
      case PayloadType.JSON:
        return "language-json";
      default:
        return "nohighlight";
    }
  }

  const getBeautifiedText = (responsePayload: ResponsePayload) => {
    const payloadType = getPayloadType(responsePayload);
    const { text } = responsePayload;
    switch (payloadType) {
      case PayloadType.HTML:
        return beautify.html_beautify(text, {});
      case PayloadType.JSON:
        return beautify.js_beautify(text, {});
      default:
        return text;
    }
  }

  const getBadgeColorForStatus = (status: string) => {
    if (status.startsWith("1")) {
      return "grey";
    } else if (status.startsWith("2")) {
      return "green";
    } else if (status.startsWith("3")) {
      return "blue";
    } else if (status.startsWith("4")) {
      return "red";
    } else if (status.startsWith("5")) {
      return "red";
    } else {
      return "grey";
    }
  }

  return (
    <Container header={<Header variant="h2">Response</Header>}>
      {
        !loading
          ? (
            <>
              <Flashbar items={
                errorText
                  ? ([
                    {
                      header: "Error sending request",
                      type: "error",
                      content: errorText,
                      id: "error-msg"
                    }
                  ])
                  : []
              } />
              {
                response && (
                  <>
                    <SpaceBetween size="s" direction="horizontal">
                      <Badge color={getBadgeColorForStatus(response.status)}>Status: {response.status}</Badge>
                      <Badge color="blue">Time: {response.timeMs}ms</Badge>
                      <Badge color="blue">Size: {response.sizeBytes}B</Badge>
                    </SpaceBetween>
                    <pre style={{ whiteSpace: "pre-wrap", maxWidth: "60vw" }}>
                      <code className={getHighlightClassName(response)}>{
                        getBeautifiedText(response)
                      }</code>
                    </pre>
                  </>
                )
              }
            </>
          )
          : (
            <SpaceBetween size="m" direction="horizontal">
              <Spinner />
              <Button onClick={onCancel}>Cancel</Button>
            </SpaceBetween>
          )
      }
    </Container>
  );
}