import React from "react";
import { Box, Button, Header, Container, SpaceBetween } from "@cloudscape-design/components";
import { CollectionPartial, RequestPartial } from "@awspostman/interfaces";
import { generateId } from "@awspostman/file";

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
                <SpaceBetween direction="vertical" size="xxxs">
                  {collection.requests.map((request) => (
                    <Button variant="link" iconName="file" onClick={() => {
                      onOpenRequest?.(request);
                    }}>{request.method} {request.name}</Button>
                  ))}
                  <Button iconName="add-plus" onClick={() => {
                    const updatedCollections = [...collections];
                    const updatedCollection = updatedCollections[collectionIdx];
                    updatedCollection.requests.push({
                      id: generateId(),
                      name: "My Request",
                      collectionId: updatedCollection.id,
                      collectionName: updatedCollection.name,
                      method: "GET",
                    });
                    onChange?.(updatedCollections);
                    // TODO: save request as file
                  }}>Add</Button>
                </SpaceBetween>
              </Box>
            )}
          </SpaceBetween>
        ))}
        <Button iconName="add-plus" onClick={() => {
          const updatedCollections = [
            ...collections,
            {
              id: generateId(),
              name: "My Collection",
              isOpen: false,
              requests: [],
            }
          ];
          onChange?.(updatedCollections);
          // TODO: save collection as folder
        }}>Add</Button>
      </SpaceBetween>
    </Container>
  );
}