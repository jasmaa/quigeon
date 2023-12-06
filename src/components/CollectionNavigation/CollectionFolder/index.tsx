import { useState } from "react";
import { Box, Button, Input, SpaceBetween } from "@cloudscape-design/components";
import { validateCollectionName } from "@awspostman/validators";
import { generateId, getOrCreateStore } from "@awspostman/store";
import { CollectionDisplay, RequestDisplay, Request } from "@awspostman/interfaces";
import RequestFile from "./RequestFile";

export default function CollectionFolder({
  collectionDisplays,
  collectionDisplayIdx,
  onChange,
  onOpenRequest,
}: {
  collectionDisplays: CollectionDisplay[];
  collectionDisplayIdx: number;
  onChange?: (updatedCollectionDisplays: CollectionDisplay[]) => void;
  onOpenRequest?: (collectionDisplayIdx: number, requestIdx: number) => void;
}) {
  const { collection, requests } = collectionDisplays[collectionDisplayIdx];

  const [isEditingName, setIsEditingName] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingName, setPendingName] = useState(collection.name);
  const [isPendingNameValid, setIsPendingNameValid] = useState(true);

  const onAddRequest = async () => {
    const addedRequest: Request = {
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

    const updatedCollectionDisplays = [...collectionDisplays];
    const updatedRequests = [...updatedCollectionDisplays[collectionDisplayIdx].requests, addedRequest];
    updatedCollectionDisplays[collectionDisplayIdx].requests = updatedRequests;
    onChange?.(updatedCollectionDisplays);

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
                  onChange?.(updatedCollectionDisplays);

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
            onChange?.(updatedCollectionDisplays);

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
                  collectionDisplays={collectionDisplays}
                  onChange={onChange}
                  collectionDisplayIdx={collectionDisplayIdx}
                  requestIdx={requestIdx}
                  onOpenRequest={onOpenRequest}
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