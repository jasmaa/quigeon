import React from "react";
import { confirm } from '@tauri-apps/api/dialog';
import { Button, Header, Container, SpaceBetween, } from "@cloudscape-design/components";
import { CollectionPartial, RequestPartial, RequestPayload } from "@awspostman/interfaces";
import { generateId } from "@awspostman/file";
import Collection from "./Collection";

export default function CollectionNavigation({
  collections,
  onChange,
  onOpenRequest,
  saveRequest,
  saveCollection,
  deleteCollection,
}: {
  collections: CollectionPartial[];
  onChange?: (collections: CollectionPartial[]) => void;
  onOpenRequest?: (request: RequestPartial) => void;
  saveRequest?: (request: RequestPayload) => Promise<void>
  saveCollection?: (collection: CollectionPartial) => Promise<void>
  deleteCollection?: (collection: CollectionPartial) => Promise<void>
}) {

  return (
    <Container header={
      <Header>
        Collections
      </Header>
    }>
      <SpaceBetween size="s" direction="vertical">
        {collections.map((collection, collectionIdx) => (
          <Collection
            collections={collections}
            collectionIdx={collectionIdx}
            onSaveCollectionName={(name: string) => {
              const updatedCollections = [...collections];
              updatedCollections[collectionIdx].name = name;
              onChange?.(updatedCollections);

              saveCollection?.(updatedCollections[collectionIdx]);
            }}
            onDeleteCollection={async () => {
              const isConfirmed = await confirm(`Delete "${collection.name}"?`);
              if (isConfirmed) {
                const updatedCollections = [...collections];
                updatedCollections.splice(collectionIdx, 1);
                onChange?.(updatedCollections);

                deleteCollection?.(collection);
              }
            }}
            onOpenRequest={onOpenRequest}
            onAddRequest={() => {
              const addedRequest: RequestPayload = {
                id: generateId(),
                name: "My Request",
                collectionId: collection.id,
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

              const updatedCollections = [...collections];
              const targetCollectionIdx = updatedCollections.findIndex(({ id }) => id === addedRequest.collectionId);
              updatedCollections[targetCollectionIdx].requests.push(addedRequest);
              onChange?.(updatedCollections);

              saveRequest?.(addedRequest);
            }}
          />
        ))}
        <Button iconName="add-plus" onClick={() => {
          const addedCollection = {
            id: generateId(),
            name: "My Collection",
            isOpen: false,
            isEditing: false,
            requests: [],
          }

          const updatedCollections = [...collections, addedCollection];
          onChange?.(updatedCollections);

          saveCollection?.(addedCollection);
        }}>Add</Button>
      </SpaceBetween>
    </Container>
  );
}