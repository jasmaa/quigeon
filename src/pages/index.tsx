import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event';
import { open, save } from '@tauri-apps/api/dialog';
import { Badge, Button, SpaceBetween, Grid, Input, Select, Container, Header, Tabs, Textarea, FormField, Spinner, ColumnLayout, Flashbar } from "@cloudscape-design/components";
import { OptionDefinition } from "@cloudscape-design/components/internal/components/option/interfaces";
import { ResponsePayload } from "@awspostman/interfaces";
import RequestHeaderEditor, { RequestHeader } from "@awspostman/components/RequestHeaderEditor";
import hljs from "highlight.js";
import * as beautify from "js-beautify";
import { CollectionContent, RequestContent, contentCache } from "@awspostman/file";

// Request id for matching current request when multiple requests are in flight
let pendingRequestId: string | null = null;

enum PayloadType {
  JSON,
  HTML,
  UNKNOWN,
}

export default function Home() {
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
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [response, setResponse] = useState<ResponsePayload>();
  const [responseErrorText, setResponseErrorText] = useState("");

  useEffect(() => {
    const unlistenNew = listen("new", async (event) => {
      reset();
      contentCache.setCollection(null);
      contentCache.setFilePath(null);
    });

    const unlistenLoad = listen("open", async (event) => {
      const selected = await open({
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });
      if (selected) {
        const blob: string = await invoke("open_file_cmd", {
          filePath: selected,
        });
        const collection = JSON.parse(blob);
        if (collection) {
          const request = collection.requests[0];
          setAccessKey(request.accessKey);
          setSecretKey(request.secretKey);
          setSessionToken(request.sessionToken);
          setRegion(request.region);
          setService(request.service);
          setMethodOption(request.methodOption);
          setUrl(request.url);
          setBody(request.body);
          setHeaders(request.headers);

          contentCache.setCollection(collection);
          contentCache.setFilePath(selected as string);
        }
      }
    });

    const unlistenSave = listen("save", async (event) => {
      const collection = contentCache.getCollection();
      let filePath = contentCache.getFilePath();
      if (!filePath) {
        filePath = await save({
          filters: [{
            name: 'JSON',
            extensions: ['json']
          }]
        });
      }
      if (collection && filePath) {
        await invoke("save_file_cmd", {
          filePath,
          blob: JSON.stringify(collection),
        });
        contentCache.setFilePath(filePath);
      }
    });

    const unlistenSaveAs = listen("save-as", async (event) => {
      const selected = await save({
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });
      const collection = contentCache.getCollection();
      if (collection) {
        await invoke("save_file_cmd", {
          filePath: selected,
          blob: JSON.stringify(collection),
        });
      }
    });

    return () => {
      unlistenNew.then((f) => f());
      unlistenLoad.then((f) => f());
      unlistenSave.then((f) => f());
      unlistenSaveAs.then((f) => f());
    }
  }, []);

  useEffect(() => {
    // Sync collection on state change. State cannot be directly used in Tauri event listener
    // since state is not reflecting updates in listen.
    const request: RequestContent = {
      accessKey,
      secretKey,
      sessionToken,
      region,
      service,
      methodOption,
      url,
      body,
      headers,
    };
    const collection = {
      requests: [request]
    };
    contentCache.setCollection(collection);
  }, [
    accessKey,
    secretKey,
    sessionToken,
    region,
    service,
    methodOption,
    url,
    body,
    headers,
  ]);

  useEffect(() => {
    hljs.highlightAll();
  }, [response]);

  const reset = () => {
    setAccessKey("");
    setSecretKey("");
    setSessionToken("");
    setRegion("");
    setService("");
    setMethodOption({ label: "GET", value: "GET" });
    setUrl("");
    setBody("");
    setHeaders([
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
  }

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
    <SpaceBetween size="l" direction="vertical">
      <Container>
        <form onSubmit={(e) => {
          e.preventDefault();

          if (isSendingRequest) {
            return;
          }

          // Generate a unique id for this request
          const currentRequestId = crypto.randomUUID();
          pendingRequestId = currentRequestId;

          setIsSendingRequest(true);
          setResponse(undefined);
          setResponseErrorText("");
          (async () => {
            try {
              const res = await invoke('send_sigv4_cmd', {
                method: methodOption.value,
                url,
                headers: headers.filter((header) => header.editable),
                body,
                accessKey,
                secretKey,
                sessionToken,
                region,
                service,
              }) as ResponsePayload;
              // Only update if this request is still the current request
              if (pendingRequestId === currentRequestId) {
                setResponse(res);
              }
            } catch (err) {
              console.error(err);
              if (pendingRequestId === currentRequestId) {
                setResponseErrorText(err as string);
              }
            } finally {
              if (pendingRequestId === currentRequestId) {
                pendingRequestId = null;
                setIsSendingRequest(false);
              }
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
            <Button loading={isSendingRequest}>Send</Button>
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
                        label="Session Token (optional)">
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
            ? (
              <>
                <Flashbar items={
                  responseErrorText
                    ? ([
                      {
                        header: "Error sending request",
                        type: "error",
                        content: responseErrorText,
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
                <Button onClick={() => {
                  pendingRequestId = null;
                  setIsSendingRequest(false);
                  setResponseErrorText("Request cancelled");
                }}>Cancel</Button>
              </SpaceBetween>
            )
        }
      </Container>
    </SpaceBetween>
  );
}