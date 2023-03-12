import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Button, SpaceBetween, Grid, Input, Select, Container, Header, Tabs, Textarea, FormField, Spinner, ColumnLayout } from "@cloudscape-design/components";
import { OptionDefinition } from "@cloudscape-design/components/internal/components/option/interfaces";
import { ResponsePayload } from "@awspostman/interfaces";
import RequestHeaderEditor, { RequestHeader } from "@awspostman/components/RequestHeaderEditor";
import hljs from "highlight.js";
import * as beautify from "js-beautify";

enum PayloadType {
  JSON,
  HTML,
  UNKNOWN,
}

export default function Home() {
  const [greeting, setGreeting] = useState("");
  const [accessKey, setAccessKey] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [methodOption, setMethodOption] = useState<OptionDefinition>({ label: "GET", value: "GET" });
  const [url, setUrl] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [headers, setHeaders] = useState<RequestHeader[]>([
    {
      key: "Authorization",
      value: "<calculated value>",
      editable: false,
    },
    {
      key: "x-amz-date",
      value: "<calculated value>",
      editable: false,
    },
    {
      key: "x-amz-content-sha256",
      value: "<calculated value>",
      editable: false,
    },
  ]);
  const [response, setResponse] = useState<ResponsePayload>();
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    void (async () => {
      const text = await invoke('greet', { name: 'World' }) as string;
      setGreeting(text);
    })();
  }, []);

  useEffect(() => {
    hljs.highlightAll();
  }, [response]);

  const getResponsePayloadType = () => {
    if (response) {
      if (response.text.startsWith("<")) {
        return PayloadType.HTML;
      } else if (response.text.startsWith("{")) {
        return PayloadType.JSON;
      }
    }
    return PayloadType.UNKNOWN;
  }

  const getHighlightClassName = () => {
    const payloadType = getResponsePayloadType();
    switch (payloadType) {
      case PayloadType.HTML:
        return "language-html";
      case PayloadType.JSON:
        return "language-json";
      default:
        return "nohighlight";
    }
  }

  const getBeautifiedResponseText = () => {
    if (response) {
      const payloadType = getResponsePayloadType();
      switch (payloadType) {
        case PayloadType.HTML:
          return beautify.html_beautify(response.text, {});
        case PayloadType.JSON:
          return beautify.js_beautify(response.text, {});
        default:
          return response.text;
      }
    }
  }

  return (
    <SpaceBetween size="l" direction="vertical">
      <Container>
        <form onSubmit={(e) => {
          e.preventDefault();
          setIsSendingRequest(true);
          (async () => {
            try {
              const res = await invoke('send_request', {
                method: methodOption.value,
                url,
                headers: headers.filter((header) => header.editable),
                accessKey,
                secretKey,
                region,
                service,
              }) as ResponsePayload;
              setResponse(res);
            } catch (err) {
              console.error(err);
            } finally {
              setIsSendingRequest(false);
            }
          })();
        }}>
          <Grid gridDefinition={[{ colspan: 2 }, { colspan: 8 }, { colspan: 2 }]}>
            <Select
              selectedOption={methodOption}
              onChange={({ detail }) => {
                setMethodOption(detail.selectedOption);
              }
              }
              options={[
                { label: "GET", value: "GET" },
                { label: "HEAD", value: "HEAD" },
                { label: "POST", value: "POST" },
                { label: "PUT", value: "PUT" },
                { label: "DELETE", value: "DELETE" },
                { label: "CONNECT", value: "CONNECT" },
                { label: "OPTIONS", value: "OPTIONS" },
                { label: "TRACE", value: "TRACE" },
                { label: "PATCH", value: "PATCH" },
              ]}
              selectedAriaLabel="Selected"
            />
            <Input value={url} placeholder="URL" onChange={({ detail }) => {
              setUrl(detail.value);
            }} />
            <Button disabled={isSendingRequest}>Send</Button>
          </Grid>
          <Tabs
            tabs={[
              {
                label: "Authorization",
                id: "authorization",
                content: (
                  <ColumnLayout columns={2} variant="text-grid">
                    <SpaceBetween size="s" direction="vertical">
                      <FormField
                        label="Access Key">
                        <Input value={accessKey} placeholder="Access key" onChange={({ detail }) => {
                          setAccessKey(detail.value);
                        }} />
                      </FormField>
                      <FormField
                        label="Secret Key">
                        <Input value={secretKey} placeholder="Secret key" onChange={({ detail }) => {
                          setSecretKey(detail.value);
                        }} />
                      </FormField>
                    </SpaceBetween>
                    <SpaceBetween size="s" direction="vertical">
                      <FormField
                        label="Region">
                        <Input value={region} placeholder="Region" onChange={({ detail }) => {
                          setRegion(detail.value);
                        }} />
                      </FormField>
                      <FormField
                        label="Service">
                        <Input value={service} placeholder="Service" onChange={({ detail }) => {
                          setService(detail.value);
                        }} />
                      </FormField>
                      <FormField
                        label="Session Token">
                        <Input value={sessionToken} placeholder="Session token" onChange={({ detail }) => {
                          setSessionToken(detail.value);
                        }} />
                      </FormField>
                    </SpaceBetween>
                  </ColumnLayout>
                ),
              },
              {
                label: "Headers",
                id: "headers",
                content: (
                  <RequestHeaderEditor headers={headers} onChange={(updatedHeaders) => { setHeaders(updatedHeaders) }} />
                )
              },
              {
                label: "Body",
                id: "body",
                content: (
                  <Textarea
                    onChange={({ detail }) => setBody(detail.value)}
                    value={body}
                    placeholder="Body"
                    rows={10}
                  />
                )
              },
            ]}
          />
        </form>
      </Container>
      <Container header={<Header variant="h2">Response</Header>}>
        {
          !isSendingRequest
            ? response && (
              <>
                <pre>{response.status}</pre>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  <code className={getHighlightClassName()}>{
                    getBeautifiedResponseText()
                  }</code>
                </pre>
              </>
            )
            : <Spinner />
        }
      </Container>
    </SpaceBetween>
  );
}