import React from "react";
import { Box, Button, Header, Container, SpaceBetween } from "@cloudscape-design/components";
import { CollectionPartial, RequestPartial, RequestPayload } from "@awspostman/interfaces";
import { generateId } from "@awspostman/file";

export default function CollectionNavigation({
  collections,
  onOpenCollection,
  onOpenRequest,
  onAddRequest,
  onAddCollection,
}: {
  collections: CollectionPartial[];
  onOpenCollection?: (collection: CollectionPartial) => void;
  onOpenRequest?: (request: RequestPartial) => void;
  onAddRequest?: (request: RequestPayload) => void;
  onAddCollection?: (collection: CollectionPartial) => void;
}) {

  return (
    <Container header={
      <Header>
        Collections
      </Header>
    }>
      <SpaceBetween size="s" direction="vertical">
        {collections.map((collection) => (
          <SpaceBetween direction="vertical" size="xxxs">
            <SpaceBetween direction="horizontal" size="xxxs">
              <Button iconName={collection.isOpen ? "folder-open" : "folder"} variant="link" onClick={() => {
                onOpenCollection?.(collection);
              }}>{collection.name}</Button>
              <Button iconName="edit" variant="icon" />
            </SpaceBetween>
            {collection.isOpen && (
              <Box margin={{ left: "l" }}>
                <SpaceBetween direction="vertical" size="xxxs">
                  {collection.requests.map((request) => (
                    <Button variant="link" iconName="file" onClick={() => {
                      onOpenRequest?.(request);
                    }}>{request.method} {request.name}</Button>
                  ))}
                  <Button iconName="add-plus" onClick={() => {
                    const addedRequest: RequestPayload = {
                      id: generateId(),
                      name: "My Request",
                      collectionId: collection.id,
                      collectionName: collection.name,
                      accessKey: "",
                      secretKey: "",
                      sessionToken: "",
                      region: "",
                      service: "",
                      method: "GET",
                      url: "",
                      body: "",
                      headers: [],
                    };
                    onAddRequest?.(addedRequest);
                  }}>Add</Button>
                </SpaceBetween>
              </Box>
            )}
          </SpaceBetween>
        ))}
        <Button iconName="add-plus" onClick={() => {
          const addedCollection = {
            id: generateId(),
            name: "My Collection",
            isOpen: false,
            requests: [],
          }
          onAddCollection?.(addedCollection);
        }}>Add</Button>
      </SpaceBetween>
    </Container>
  );
}