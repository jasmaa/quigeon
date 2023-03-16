import { useEffect } from "react";
import { Badge, Button, SpaceBetween, Container, Header, Spinner, Flashbar } from "@cloudscape-design/components";
import hljs from "highlight.js";
import * as beautify from "js-beautify";
import { ResponsePayload } from "@awspostman/interfaces";

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

  const getPayloadType = (text: string) => {
    if (text.startsWith("<")) {
      return PayloadType.HTML;
    } else if (text.startsWith("{")) {
      return PayloadType.JSON;
    } else {
      return PayloadType.UNKNOWN;
    }
  }

  const getHighlightClassName = (text: string) => {
    const payloadType = getPayloadType(text);
    switch (payloadType) {
      case PayloadType.HTML:
        return "language-html";
      case PayloadType.JSON:
        return "language-json";
      default:
        return "nohighlight";
    }
  }

  const getBeautifiedText = (text: string) => {
    const payloadType = getPayloadType(text);
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
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                      <code className={getHighlightClassName(response.text)}>{
                        getBeautifiedText(response.text)
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