import React, { useEffect, useState } from "react";
import {
  Button,
  SpaceBetween,
  Grid,
  Input,
  Select,
  Container,
  Header,
  Tabs,
  TextContent,
  FormField,
  ColumnLayout,
} from "@cloudscape-design/components";
import RequestHeaderEditor from "@quigeon/components/RequestHeaderEditor";
import {
  RequestDisplay,
  Request,
  CollectionDisplay,
} from "@quigeon/interfaces";
import { validateRequestName } from "@quigeon/validators";
import { getOrCreateStore } from "@quigeon/db";
import { getDefaultRequestDisplay } from "@quigeon/generators";
import RichInput from "@quigeon/components/RichInput";
import BodyEditor from "./RequestBodyEditor";

export default function RequestContainer({
  collectionDisplays,
  setCollectionDisplays,
  requestDisplay,
  setRequestDisplay,
  loading = false,
  onSend,
}: {
  collectionDisplays: CollectionDisplay[];
  setCollectionDisplays: (collectionDisplays: CollectionDisplay[]) => void;
  requestDisplay: RequestDisplay;
  setRequestDisplay: (requestDisplay: RequestDisplay) => void;
  loading?: boolean;
  onSend?: (request: Request) => void;
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

  useEffect(() => {
    setIsEditingName(false);
  }, [requestDisplay]);

  const onChangeRequestDisplay = async (
    updatedRequestDisplay: RequestDisplay,
  ) => {
    setRequestDisplay(updatedRequestDisplay);

    if (updatedRequestDisplay.indices) {
      const updatedCollectionDisplays = structuredClone(collectionDisplays);
      updatedCollectionDisplays[
        updatedRequestDisplay.indices.collectionDisplayIdx
      ].requests[updatedRequestDisplay.indices.requestIdx] = structuredClone(
        updatedRequestDisplay.request,
      );
      setCollectionDisplays(updatedCollectionDisplays);

      const store = await getOrCreateStore();
      await store.upsertRequest(updatedRequestDisplay.request);
    }
  };

  return (
    <Container
      header={
        <SpaceBetween size="xxxs" direction="vertical">
          {requestDisplay.collection && (
            <>
              <div style={{ display: "flex" }}>
                <div style={{ flexGrow: 1, paddingRight: "1em" }}>
                  <TextContent>
                    <h5>{requestDisplay.collection.name}</h5>
                  </TextContent>
                </div>
                <Button
                  iconName="close"
                  variant="icon"
                  onClick={() => {
                    const updatedRequestDisplay = getDefaultRequestDisplay();
                    onChangeRequestDisplay(updatedRequestDisplay);
                  }}
                />
              </div>
              {isEditingName ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const isValid = validateRequestName(pendingName);
                    setIsPendingNameValid(isValid);
                    if (isValid) {
                      const updatedRequestDisplay =
                        structuredClone(requestDisplay);
                      updatedRequestDisplay.request.name = pendingName;
                      onChangeRequestDisplay(updatedRequestDisplay);
                      setIsEditingName(!isEditingName);
                    }
                  }}
                >
                  <SpaceBetween size="m" direction="horizontal">
                    <Input
                      value={pendingName}
                      invalid={!isPendingNameValid}
                      autoFocus
                      onChange={({ detail }) => {
                        setPendingName(detail.value);
                      }}
                    />
                    <Button iconName="check" variant="icon" />
                  </SpaceBetween>
                </form>
              ) : (
                <SpaceBetween size="m" direction="horizontal">
                  <Header variant="h2">{name}</Header>
                  <Button
                    iconName="edit"
                    variant="icon"
                    onClick={() => {
                      setPendingName(name);
                      setIsEditingName(!isEditingName);
                    }}
                  />
                </SpaceBetween>
              )}
            </>
          )}
        </SpaceBetween>
      }
    >
      <form
        onSubmit={(e) => {
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
          };
          onSend?.(sendingRequest);
        }}
      >
        <Grid gridDefinition={[{ colspan: 2 }, { colspan: 8 }, { colspan: 2 }]}>
          <Select
            selectedOption={{ label: method, value: method }}
            onChange={({ detail }) => {
              const updatedRequestDisplay = structuredClone(requestDisplay);
              updatedRequestDisplay.request.method =
                detail.selectedOption.value!;
              onChangeRequestDisplay(updatedRequestDisplay);
            }}
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
          <RichInput
            value={url}
            placeholder="URL"
            onChange={({ detail }) => {
              const updatedRequestDisplay = structuredClone(requestDisplay);
              updatedRequestDisplay.request.url = detail.value;
              onChangeRequestDisplay(updatedRequestDisplay);
            }}
          />
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
                    <FormField label="Access Key">
                      <RichInput
                        value={accessKey}
                        placeholder="Access key"
                        onChange={({ detail }) => {
                          const updatedRequestDisplay =
                            structuredClone(requestDisplay);
                          updatedRequestDisplay.request.accessKey =
                            detail.value;
                          onChangeRequestDisplay(updatedRequestDisplay);
                        }}
                      />
                    </FormField>
                    <FormField label="Secret Key">
                      <RichInput
                        value={secretKey}
                        placeholder="Secret key"
                        onChange={({ detail }) => {
                          const updatedRequestDisplay =
                            structuredClone(requestDisplay);
                          updatedRequestDisplay.request.secretKey =
                            detail.value;
                          onChangeRequestDisplay(updatedRequestDisplay);
                        }}
                      />
                    </FormField>
                  </SpaceBetween>
                  <SpaceBetween size="s" direction="vertical">
                    <FormField label="Region">
                      <RichInput
                        value={region}
                        placeholder="Region"
                        onChange={({ detail }) => {
                          const updatedRequestDisplay =
                            structuredClone(requestDisplay);
                          updatedRequestDisplay.request.region = detail.value;
                          onChangeRequestDisplay(updatedRequestDisplay);
                        }}
                      />
                    </FormField>
                    <FormField label="Service">
                      <RichInput
                        value={service}
                        placeholder="Service"
                        onChange={({ detail }) => {
                          const updatedRequestDisplay =
                            structuredClone(requestDisplay);
                          updatedRequestDisplay.request.service = detail.value;
                          onChangeRequestDisplay(updatedRequestDisplay);
                        }}
                      />
                    </FormField>
                    <FormField label="Session Token (optional)">
                      <RichInput
                        value={sessionToken}
                        placeholder="Session token"
                        onChange={({ detail }) => {
                          const updatedRequestDisplay =
                            structuredClone(requestDisplay);
                          updatedRequestDisplay.request.sessionToken =
                            detail.value;
                          onChangeRequestDisplay(updatedRequestDisplay);
                        }}
                      />
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
                    const updatedRequestDisplay =
                      structuredClone(requestDisplay);
                    updatedRequestDisplay.request.headers = updatedHeaders;
                    onChangeRequestDisplay(updatedRequestDisplay);
                  }}
                />
              ),
            },
            {
              label: "Body",
              id: "body",
              content: (
                <BodyEditor
                  requestDisplay={requestDisplay}
                  onChangeRequestDisplay={onChangeRequestDisplay}
                />
              ),
            },
          ]}
        />
      </form>
    </Container>
  );
}
