import { getDefaultRequestDisplay } from "@awspostman/generators";
import { CollectionDisplay, RequestDisplay } from "@awspostman/interfaces";
import { getOrCreateStore } from "@awspostman/store";
import { validateRequestName } from "@awspostman/validators";
import { Button, Input, SpaceBetween } from "@cloudscape-design/components";
import { useState } from "react";

export default function RequestFile({
  collectionDisplayIdx,
  requestIdx,
  collectionDisplays,
  setCollectionDisplays,
  requestDisplay,
  setRequestDisplay,
}: {
  collectionDisplayIdx: number;
  requestIdx: number;
  collectionDisplays: CollectionDisplay[];
  setCollectionDisplays: (collectionDisplays: CollectionDisplay[]) => void;
  requestDisplay: RequestDisplay;
  setRequestDisplay: (requestDisplay: RequestDisplay) => void;
}) {
  const request = collectionDisplays[collectionDisplayIdx].requests[requestIdx];

  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingName, setPendingName] = useState(request.name);
  const [isPendingNameValid, setIsPendingNameValid] = useState(true);

  return (
    <SpaceBetween direction="horizontal" size="xxxs">
      {
        isEditingName
          ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const isValid = validateRequestName(pendingName);
              setIsPendingNameValid(isValid);
              if (isValid) {
                const updatedCollectionDisplays = structuredClone(collectionDisplays);
                updatedCollectionDisplays[collectionDisplayIdx].requests[requestIdx].name = pendingName;
                setCollectionDisplays(updatedCollectionDisplays);

                if (requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx && requestDisplay.indices.requestIdx === requestIdx) {
                  const updatedRequestDisplay = structuredClone(requestDisplay);
                  updatedRequestDisplay.request.name = pendingName;
                  setRequestDisplay(updatedRequestDisplay);
                }

                const store = await getOrCreateStore();
                await store.upsertRequest(updatedCollectionDisplays[collectionDisplayIdx].requests[requestIdx]);

                setIsEditingName(false);
              }
            }}>
              <SpaceBetween direction="horizontal" size="xxxs">
                <Input value={pendingName} invalid={!isPendingNameValid} autoFocus onChange={({ detail }) => {
                  setPendingName(detail.value);
                }} />
                <Button iconName="check" variant="icon" />
                <Button iconName="close" variant="icon" formAction="none" onClick={() => {
                  setPendingName(request.name);
                  setIsEditingName(false);
                }} />
              </SpaceBetween>
            </form>
          )
          : (
            <SpaceBetween direction="horizontal" size="xxxs">
              <Button variant="link" iconName="file" onClick={() => {
                const requestDisplay = {
                  request: structuredClone(collectionDisplays[collectionDisplayIdx].requests[requestIdx]),
                  collection: structuredClone(collectionDisplays[collectionDisplayIdx].collection),
                  indices: {
                    collectionDisplayIdx,
                    requestIdx,
                  }
                };
                setRequestDisplay(requestDisplay);
              }}>{request.method} {request.name}</Button>
              <Button iconName="edit" variant="icon" onClick={() => {
                setPendingName(request.name);
                setIsEditingName(true);
              }} />
              <Button iconName="remove" variant="icon" onClick={async () => {
                const isConfirmed = await confirm(`Delete "${request.name}"?`);
                if (isConfirmed) {
                  const updatedCollectionDisplays = structuredClone(collectionDisplays);
                  updatedCollectionDisplays[collectionDisplayIdx].requests.splice(requestIdx, 1);
                  setCollectionDisplays(updatedCollectionDisplays);

                  if (requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx && requestDisplay.indices?.requestIdx === requestIdx) {
                    const updatedRequestDisplay = getDefaultRequestDisplay();
                    setRequestDisplay(updatedRequestDisplay);
                  }

                  const store = await getOrCreateStore();
                  await store.deleteRequest(request.id);
                }
              }} />
            </SpaceBetween>
          )
      }
    </SpaceBetween>
  );
}