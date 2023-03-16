import React from "react";
import { Box, Button, Header, Container, SpaceBetween } from "@cloudscape-design/components";
import { CollectionPartial, RequestPartial } from "@awspostman/interfaces";

export default function CollectionNavigation({
  collections,
  onChange,
  onOpenRequest,
}: {
  collections: CollectionPartial[];
  onChange?: (collections: CollectionPartial[]) => void;
  onOpenRequest?: (request: RequestPartial) => void;
}) {

  return (
    <Container header={
      <Header>
        Collections
      </Header>
    }>
      {
        collections.length > 0
          ? (
            <SpaceBetween size="s" direction="vertical">
              {collections.map((collection, collectionIdx) => (
                <SpaceBetween direction="vertical" size="xxxs">
                  <SpaceBetween direction="horizontal" size="xxxs">
                    <Button iconName={collection.isOpen ? "folder-open" : "folder"} variant="link" onClick={() => {
                      const updatedCollections = [...collections];
                      updatedCollections[collectionIdx] = {
                        ...collection,
                        isOpen: !collection.isOpen,
                      }
                      onChange?.(updatedCollections);
                    }}>{collection.name}</Button>
                    <Button iconName="edit" variant="icon" />
                  </SpaceBetween>
                  {collection.isOpen && (
                    <Box margin={{ left: "l" }}>
                      {
                        collection.requests.length > 0
                          ? (
                            <SpaceBetween direction="vertical" size="xxxs">
                              {collection.requests.map((request) => (
                                <Button variant="link" iconName="file" onClick={() => {
                                  onOpenRequest?.(request);
                                }}>{request.method} {request.name}</Button>
                              ))}
                            </SpaceBetween>
                          )
                          : <p>No requests</p>
                      }
                      <Button iconName="add-plus" onClick={() => {
                        // TODO
                      }}>Add</Button>
                    </Box>
                  )}
                </SpaceBetween>
              ))}
            </SpaceBetween>
          )
          : <p>No collections</p>
      }
    </Container>
  );
}