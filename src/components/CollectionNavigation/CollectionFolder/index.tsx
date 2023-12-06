import { useState } from "react";
import { Box, Button, Input, SpaceBetween } from "@cloudscape-design/components";
import { validateCollectionName } from "@awspostman/validators";
import { getOrCreateStore } from "@awspostman/store";
import { CollectionDisplay, RequestDisplay, Request } from "@awspostman/interfaces";
import { getDefaultRequest, getDefaultRequestDisplay } from "@awspostman/generators";
import RequestFile from "./RequestFile";

export default function CollectionFolder({
  collectionDisplayIdx,
  collectionDisplays,
  setCollectionDisplays,
  requestDisplay,
  setRequestDisplay,
}: {
  collectionDisplayIdx: number;
  collectionDisplays: CollectionDisplay[];
  setCollectionDisplays: (collectionDisplays: CollectionDisplay[]) => void;
  requestDisplay: RequestDisplay;
  setRequestDisplay: (requestDisplay: RequestDisplay) => void;
}) {
  const { collection, requests } = collectionDisplays[collectionDisplayIdx];

  const [isEditingName, setIsEditingName] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingName, setPendingName] = useState(collection.name);
  const [isPendingNameValid, setIsPendingNameValid] = useState(true);

  const onAddRequest = async () => {
    const addedRequest: Request = getDefaultRequest();

    const updatedCollectionDisplays = [...collectionDisplays];
    const updatedRequests = [...updatedCollectionDisplays[collectionDisplayIdx].requests, addedRequest];
    updatedCollectionDisplays[collectionDisplayIdx].requests = updatedRequests;
    setCollectionDisplays(updatedCollectionDisplays);

    const store = await getOrCreateStore();
    await store.upsertRequest(addedRequest);
  }

  return (
    <SpaceBetween direction="vertical" size="xxxs">
      <SpaceBetween direction="horizontal" size="xxxs">
        {
          isEditingName
            ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const isValid = validateCollectionName(pendingName);
                setIsPendingNameValid(isValid);
                if (isValid) {
                  const updatedCollectionDisplays = structuredClone(collectionDisplays);
                  updatedCollectionDisplays[collectionDisplayIdx].collection.name = pendingName;
                  setCollectionDisplays(updatedCollectionDisplays);

                  if (requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx) {
                    const updatedRequestDisplay = structuredClone(requestDisplay);
                    updatedRequestDisplay.collection = updatedCollectionDisplays[collectionDisplayIdx].collection;
                    setRequestDisplay(updatedRequestDisplay);
                  }

                  const store = await getOrCreateStore();
                  await store.upsertCollection(updatedCollectionDisplays[collectionDisplayIdx].collection);

                  setIsEditingName(false);
                }
              }}>
                <SpaceBetween direction="horizontal" size="xxxs">
                  <Input value={pendingName} invalid={!isPendingNameValid} autoFocus onChange={({ detail }) => {
                    setPendingName(detail.value);
                  }} />
                  <Button iconName="check" variant="icon" />
                </SpaceBetween>
              </form>
            )
            : (
              <SpaceBetween direction="horizontal" size="xxxs">
                <Button iconName={isOpen ? "folder-open" : "folder"} variant="link" onClick={() => {
                  setIsOpen(!isOpen);
                }}>{collection.name}</Button>
                <Button iconName="edit" variant="icon" onClick={() => {
                  setPendingName(collection.name);
                  setIsEditingName(true);
                }} />
              </SpaceBetween>
            )
        }
        <Button iconName="remove" variant="icon" onClick={async () => {
          const isConfirmed = await confirm(`Delete "${collection.name}"?`);
          if (isConfirmed) {
            const updatedCollectionDisplays = [...collectionDisplays];
            updatedCollectionDisplays.splice(collectionDisplayIdx, 1);
            setCollectionDisplays(updatedCollectionDisplays);

            if (requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx) {
              const updatedRequestDisplay = getDefaultRequestDisplay();
              setRequestDisplay(updatedRequestDisplay);
            }

            const store = await getOrCreateStore();
            await store.deleteCollection(collectionDisplays[collectionDisplayIdx].collection.id);
          }
        }} />
      </SpaceBetween>
      {
        isOpen && (
          <Box margin={{ left: "l" }}>
            <SpaceBetween direction="vertical" size="xxxs">
              {requests.map((request, requestIdx) => (
                <RequestFile
                  key={request.id}
                  collectionDisplayIdx={collectionDisplayIdx}
                  requestIdx={requestIdx}
                  collectionDisplays={collectionDisplays}
                  setCollectionDisplays={setCollectionDisplays}
                  requestDisplay={requestDisplay}
                  setRequestDisplay={setRequestDisplay}
                />
              ))}
              <Button iconName="add-plus" onClick={onAddRequest}>Add</Button>
            </SpaceBetween>
          </Box>
        )
      }
    </SpaceBetween>
  );
}