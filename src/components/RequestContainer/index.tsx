import React from "react";
import { Button, SpaceBetween, Grid, Input, Select, Container, Header, Tabs, Textarea, FormField, ColumnLayout } from "@cloudscape-design/components";
import RequestHeaderEditor from "@awspostman/components/RequestHeaderEditor";
import { RequestPayload } from "@awspostman/interfaces";

export default function RequestContainer({
  request,
  loading = false,
  onChange,
  onSend,
}: {
  request: RequestPayload,
  loading?: boolean,
  onChange?: (requestContent: RequestPayload) => void,
  onSend?: (requestContent: RequestPayload) => void,
}) {

  const {
    name,
    accessKey,
    secretKey,
    sessionToken,
    region,
    service,
    method,
    url,
    body,
    headers,
  } = request;

  return (
    <Container header={
      <SpaceBetween size="m" direction="horizontal">
        <Header variant="h2">{name}</Header>
        <Button iconName="edit" variant="icon" />
      </SpaceBetween>
    }>
      <form onSubmit={(e) => {
        e.preventDefault();
        const sendingRequest: RequestPayload = {
          id: request.id,
          name,
          collectionName: request.collectionName,
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
        onSend?.(sendingRequest);
      }}>
        <Grid gridDefinition={[{ colspan: 2 }, { colspan: 8 }, { colspan: 2 }]}>
          <Select
            selectedOption={{ label: method, value: method }}
            onChange={({ detail }) => {
              const updatedRequest = {
                ...request,
                method: detail.selectedOption.value!,
              };
              onChange?.(updatedRequest);
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
            const updatedRequest = {
              ...request,
              url: detail.value,
            };
            onChange?.(updatedRequest);
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
                        const updatedRequest = {
                          ...request,
                          accessKey: detail.value,
                        };
                        onChange?.(updatedRequest);
                      }} />
                    </FormField>
                    <FormField
                      label="Secret Key">
                      <Input value={secretKey} placeholder="Secret key" onChange={({ detail }) => {
                        const updatedRequest = {
                          ...request,
                          secretKey: detail.value,
                        };
                        onChange?.(updatedRequest);

                      }} />
                    </FormField>
                  </SpaceBetween>
                  <SpaceBetween size="s" direction="vertical">
                    <FormField
                      label="Region">
                      <Input value={region} placeholder="Region" onChange={({ detail }) => {
                        const updatedRequest = {
                          ...request,
                          region: detail.value,
                        };
                        onChange?.(updatedRequest);
                      }} />
                    </FormField>
                    <FormField
                      label="Service">
                      <Input value={service} placeholder="Service" onChange={({ detail }) => {
                        const updatedRequest = {
                          ...request,
                          service: detail.value,
                        };
                        onChange?.(updatedRequest);
                      }} />
                    </FormField>
                    <FormField
                      label="Session Token (optional)">
                      <Input value={sessionToken} placeholder="Session token" onChange={({ detail }) => {
                        const updatedRequest = {
                          ...request,
                          sessionToken: detail.value,
                        };
                        onChange?.(updatedRequest);
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
                <RequestHeaderEditor
                  headers={headers}
                  onChange={(updatedHeaders) => {
                    const updatedRequest = {
                      ...request,
                      headers: updatedHeaders,
                    };
                    onChange?.(updatedRequest);
                  }} />
              )
            },
            {
              label: "Body",
              id: "body",
              content: (
                <Textarea
                  onChange={({ detail }) => {
                    const updatedRequest = {
                      ...request,
                      body: detail.value,
                    };
                    onChange?.(updatedRequest);
                  }}
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