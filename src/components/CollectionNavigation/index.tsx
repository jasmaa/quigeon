import React from "react";
import { Button, Header, Container, SpaceBetween, } from "@cloudscape-design/components";
import { CollectionDisplay, CollectionPartial, RequestDisplay, RequestPayload } from "@awspostman/interfaces";
import { generateId } from "@awspostman/file";
import Collection from "./Collection";

export default function CollectionNavigation({
  collectionDisplays,
  setCollectionDisplays,
  setRequestDisplay,
  saveRequest,
  saveCollection,
  deleteCollection,
}: {
  collectionDisplays: CollectionDisplay[];
  setCollectionDisplays: (collectionDisplays: CollectionDisplay[]) => void;
  setRequestDisplay: (requestIndices: RequestDisplay) => void;
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
        {collectionDisplays.map((collectionDisplay, collectionDisplayIdx) => (
          <Collection
            key={collectionDisplay.collection.id}
            collectionDisplays={collectionDisplays}
            setCollectionDisplays={setCollectionDisplays}
            collectionDisplayIdx={collectionDisplayIdx}
            setRequestDisplay={setRequestDisplay}
            saveRequest={saveRequest}
            saveCollection={saveCollection}
            deleteCollection={deleteCollection}
          />
        ))}
        <Button iconName="add-plus" onClick={() => {
          const addedCollectionDisplay = {
            collection: {
              id: generateId(),
              name: "My Collection",
              isOpen: false,
              isEditing: false,
              requests: [],
            },
            requests: [],
          };

          const updatedCollectionDisplays = [...collectionDisplays, addedCollectionDisplay];
          setCollectionDisplays(updatedCollectionDisplays);

          saveCollection?.(addedCollectionDisplay.collection);
        }}>Add</Button>
      </SpaceBetween>
    </Container>
  );
}