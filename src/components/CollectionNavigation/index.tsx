import React from "react";
import { Button, Header, Container, SpaceBetween, } from "@cloudscape-design/components";
import { CollectionDisplay, RequestDisplay } from "@awspostman/interfaces";
import { getOrCreateStore } from "@awspostman/store";
import { getDefaultCollectionDisplay } from "@awspostman/generators";
import CollectionFolder from "./CollectionFolder";

export default function CollectionNavigation({
  collectionDisplays,
  setCollectionDisplays,
  requestDisplay,
  setRequestDisplay,
}: {
  collectionDisplays: CollectionDisplay[];
  setCollectionDisplays: (collectionDisplays: CollectionDisplay[]) => void;
  requestDisplay: RequestDisplay;
  setRequestDisplay: (requestDisplay: RequestDisplay) => void;
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
            collectionDisplayIdx={collectionDisplayIdx}
            collectionDisplays={collectionDisplays}
            setCollectionDisplays={setCollectionDisplays}
            requestDisplay={requestDisplay}
            setRequestDisplay={setRequestDisplay}
          />
        ))}
        <Button iconName="add-plus" onClick={async () => {
          const addedCollectionDisplay = getDefaultCollectionDisplay();

          const updatedCollectionDisplays = [...collectionDisplays, addedCollectionDisplay];
          setCollectionDisplays(updatedCollectionDisplays);

          const store = await getOrCreateStore();
          await store.upsertCollection(addedCollectionDisplay.collection);
        }}>Add</Button>
      </SpaceBetween>
    </Container>
  );
}