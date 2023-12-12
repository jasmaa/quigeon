import React, { useState } from "react";
import { Button, Header, Container, SpaceBetween, Grid, Box } from "@cloudscape-design/components";
import { CollectionDisplay, RequestDisplay } from "@quigeon/interfaces";
import { getOrCreateStore } from "@quigeon/store";
import { getDefaultCollectionDisplay } from "@quigeon/generators";
import CollectionFolder from "./CollectionFolder";

export default function CollectionNavigation({
  collectionDisplays,
  setCollectionDisplays,
  requestDisplay,
  setRequestDisplay,
  isDrawerOpen,
  setIsDrawerOpen,
}: {
  collectionDisplays: CollectionDisplay[];
  setCollectionDisplays: (collectionDisplays: CollectionDisplay[]) => void;
  requestDisplay: RequestDisplay;
  setRequestDisplay: (requestDisplay: RequestDisplay) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isDrawerOpen: boolean) => void;
}) {

  return (
    isDrawerOpen
      ? (
        <div style={{ width: "30em" }}>
          <Container header={
            <Grid gridDefinition={[{ colspan: 10 }, { colspan: 2 }]}>
              <Header>
                Collections
              </Header>
              <Box textAlign="right">
                <Button iconName="angle-left" variant="icon" onClick={() => {
                  setIsDrawerOpen(false);
                }} />
              </Box>
            </Grid>
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
        </div>
      )
      : (
        <Button iconName="angle-right" variant="icon" onClick={() => {
          setIsDrawerOpen(true);
        }} />
      )
  );
}