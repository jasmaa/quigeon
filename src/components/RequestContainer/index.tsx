import React, { useState } from "react";
import { Button, SpaceBetween, Grid, Input, Select, Container, Header, Tabs, Textarea, FormField, ColumnLayout } from "@cloudscape-design/components";
import RequestHeaderEditor from "@awspostman/components/RequestHeaderEditor";
import { RequestDisplay, Request } from "@awspostman/interfaces";
import { validateRequestName } from "@awspostman/validators";

export default function RequestContainer({
  requestDisplay,
  loading = false,
  onChange,
  onSend,
}: {
  requestDisplay: RequestDisplay,
  loading?: boolean,
  onChange?: (requestDisplay: RequestDisplay) => void,
  onSend?: (request: Request) => void,
}) {
  const { request } = requestDisplay;
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

  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingName, setPendingName] = useState(name);
  const [isPendingNameValid, setIsPendingNameValid] = useState(true);

  return (
    <Container header={
      isEditingName
        ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            const isValid = validateRequestName(pendingName);
            setIsPendingNameValid(isValid);
            if (isValid) {
              const updatedRequest = {
                ...request,
                name: pendingName,
              };
              const updatedRequestDisplay = {
                request: updatedRequest,
                indices: requestDisplay.indices,
              };
              onChange?.(updatedRequestDisplay);
              setIsEditingName(!isEditingName);
            }
          }}>
            <SpaceBetween size="m" direction="horizontal">
              <Input value={pendingName} invalid={!isPendingNameValid} autoFocus onChange={({ detail }) => {
                setPendingName(detail.value);
              }} />
              <Button iconName="check" variant="icon" />
            </SpaceBetween>
          </form>
        )
        : (
          <SpaceBetween size="m" direction="horizontal">
            <Header variant="h2">{name}</Header>
            <Button iconName="edit" variant="icon" onClick={
              () => {
                setPendingName(name);
                setIsEditingName(!isEditingName);
              }
            } />
          </SpaceBetween>
        )
    }>
      <form onSubmit={(e) => {
        e.preventDefault();
        const sendingRequest: Request = {
          id: request.id,
          name,
          collectionId: request.collectionId,
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
              const updatedRequestDisplay = {
                request: updatedRequest,
                indices: requestDisplay.indices,
              };
              onChange?.(updatedRequestDisplay);
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
            const updatedRequestDisplay = {
              request: updatedRequest,
              indices: requestDisplay.indices,
            };
            onChange?.(updatedRequestDisplay);
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
                        const updatedRequestDisplay = {
                          request: updatedRequest,
                          indices: requestDisplay.indices,
                        };
                        onChange?.(updatedRequestDisplay);
                      }} />
                    </FormField>
                    <FormField
                      label="Secret Key">
                      <Input value={secretKey} placeholder="Secret key" onChange={({ detail }) => {
                        const updatedRequest = {
                          ...request,
                          secretKey: detail.value,
                        };
                        const updatedRequestDisplay = {
                          request: updatedRequest,
                          indices: requestDisplay.indices,
                        };
                        onChange?.(updatedRequestDisplay);

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
                        const updatedRequestDisplay = {
                          request: updatedRequest,
                          indices: requestDisplay.indices,
                        };
                        onChange?.(updatedRequestDisplay);
                      }} />
                    </FormField>
                    <FormField
                      label="Service">
                      <Input value={service} placeholder="Service" onChange={({ detail }) => {
                        const updatedRequest = {
                          ...request,
                          service: detail.value,
                        };
                        const updatedRequestDisplay = {
                          request: updatedRequest,
                          indices: requestDisplay.indices,
                        };
                        onChange?.(updatedRequestDisplay);
                      }} />
                    </FormField>
                    <FormField
                      label="Session Token (optional)">
                      <Input value={sessionToken} placeholder="Session token" onChange={({ detail }) => {
                        const updatedRequest = {
                          ...request,
                          sessionToken: detail.value,
                        };
                        const updatedRequestDisplay = {
                          request: updatedRequest,
                          indices: requestDisplay.indices,
                        };
                        onChange?.(updatedRequestDisplay);
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
                    const updatedRequestDisplay = {
                      request: updatedRequest,
                      indices: requestDisplay.indices,
                    };
                    onChange?.(updatedRequestDisplay);
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
                    const updatedRequestDisplay = {
                      request: updatedRequest,
                      indices: requestDisplay.indices,
                    };
                    onChange?.(updatedRequestDisplay);
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
    </Container >
  );
}