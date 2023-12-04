import React from "react";
import { Button, Header, Container, SpaceBetween, } from "@cloudscape-design/components";
import { CollectionDisplay, Collection, RequestDisplay, Request } from "@awspostman/interfaces";
import { generateId, getOrCreateStore } from "@awspostman/store";
import CollectionFolder from "./CollectionFolder";

export default function CollectionNavigation({
  collectionDisplays,
  setCollectionDisplays,
  setRequestDisplay,
}: {
  collectionDisplays: CollectionDisplay[];
  setCollectionDisplays: (collectionDisplays: CollectionDisplay[]) => void;
  setRequestDisplay: (requestIndices: RequestDisplay) => void;
}) {

  return (
    <Container header={
      <Header>
        Collections
      </Header>
    }>
      <SpaceBetween size="s" direction="vertical">
        {collectionDisplays.map((collectionDisplay, collectionDisplayIdx) => (
          <CollectionFolder
            key={collectionDisplay.collection.id}
            collectionDisplays={collectionDisplays}
            setCollectionDisplays={setCollectionDisplays}
            collectionDisplayIdx={collectionDisplayIdx}
            setRequestDisplay={setRequestDisplay}
          />
        ))}
        <Button iconName="add-plus" onClick={async () => {
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

          const store = await getOrCreateStore();
          await store.upsertCollection(addedCollectionDisplay.collection);
        }}>Add</Button>
      </SpaceBetween>
    </Container>
  );
}