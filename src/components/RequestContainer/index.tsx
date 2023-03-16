import React, { useEffect, useState } from "react";
import { Button, SpaceBetween, Grid, Input, Select, Container, Header, Tabs, Textarea, FormField, ColumnLayout } from "@cloudscape-design/components";
import RequestHeaderEditor, { RequestHeader } from "@awspostman/components/RequestHeaderEditor";
import { RequestPayload } from "@awspostman/interfaces";

export default function RequestContainer({
  initialRequest,
  loading = false,
  onChange,
  onSend,
}: {
  initialRequest: RequestPayload,
  loading?: boolean,
  onChange?: (requestContent: RequestPayload) => void,
  onSend?: (requestContent: RequestPayload) => void,
}) {
  const [name, setName] = useState<string>(initialRequest.name)
  const [accessKey, setAccessKey] = useState<string>(initialRequest.accessKey);
  const [secretKey, setSecretKey] = useState<string>(initialRequest.secretKey);
  const [region, setRegion] = useState<string>(initialRequest.region);
  const [service, setService] = useState<string>(initialRequest.service);
  const [sessionToken, setSessionToken] = useState<string>(initialRequest.sessionToken);
  const [method, setMethod] = useState<string>(initialRequest.method);
  const [url, setUrl] = useState<string>(initialRequest.url);
  const [body, setBody] = useState<string>(initialRequest.body);
  const [headers, setHeaders] = useState<RequestHeader[]>(initialRequest.headers);

  useEffect(() => {
    // Update state if a different initial request is loaded
    setName(initialRequest.name);
    setAccessKey(initialRequest.accessKey);
    setSecretKey(initialRequest.secretKey);
    setRegion(initialRequest.region);
    setService(initialRequest.service);
    setSessionToken(initialRequest.sessionToken);
    setMethod(initialRequest.method);
    setUrl(initialRequest.url);
    setBody(initialRequest.body);
    setHeaders(initialRequest.headers);
  }, [initialRequest]);

  useEffect(() => {
    // Sync collection on state change. State cannot be directly used in Tauri event listener
    // since state is not reflecting updates in listen.
    const request: RequestPayload = {
      id: initialRequest.id,
      name,
      collectionName: initialRequest.collectionName,
      accessKey,
      secretKey,
      sessionToken,
      region,
      service,
      method,
      url,
      body,
      headers,
    };
    onChange?.(request);
  }, [
    accessKey,
    secretKey,
    sessionToken,
    region,
    service,
    method,
    url,
    body,
    headers,
  ]);

  return (
    <Container header={
      <SpaceBetween size="m" direction="horizontal">
        <Header variant="h2">{name}</Header>
        <Button iconName="edit" variant="icon" />
      </SpaceBetween>
    }>
      <form onSubmit={(e) => {
        e.preventDefault();
        const request: RequestPayload = {
          id: initialRequest.id,
          name,
          collectionName: initialRequest.collectionName,
          accessKey,
          secretKey,
          sessionToken,
          region,
          service,
          method,
          url,
          body,
          headers,
        }
        onSend?.(request);
      }}>
        <Grid gridDefinition={[{ colspan: 2 }, { colspan: 8 }, { colspan: 2 }]}>
          <Select
            selectedOption={{ label: method, value: method }}
            onChange={({ detail }) => {
              setMethod(detail.selectedOption.value!);
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
          <Button loading={loading}>Send</Button>
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
  );
}