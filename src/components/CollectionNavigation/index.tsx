import React from "react";
import { Button, Header, Container, SpaceBetween, } from "@cloudscape-design/components";
import { CollectionDisplay, RequestDisplay } from "@awspostman/interfaces";
import { generateId, getOrCreateStore } from "@awspostman/store";
import CollectionFolder from "./CollectionFolder";

export default function CollectionNavigation({
  collectionDisplays,
  onChange,
  onOpenRequest,
}: {
  collectionDisplays: CollectionDisplay[];
  onChange?: (updatedCollectionDisplays: CollectionDisplay[]) => void
  onOpenRequest?: (collectionDisplayIdx: number, requestIdx: number) => void
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
            collectionDisplayIdx={collectionDisplayIdx}
            onChange={onChange}
            onOpenRequest={onOpenRequest}
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
          onChange?.(updatedCollectionDisplays);

          const store = await getOrCreateStore();
          await store.upsertCollection(addedCollectionDisplay.collection);
        }}>Add</Button>
      </SpaceBetween>
    </Container>
  );
}