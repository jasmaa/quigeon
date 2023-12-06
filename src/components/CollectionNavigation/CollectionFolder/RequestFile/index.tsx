import { CollectionDisplay, Request, RequestDisplay } from "@awspostman/interfaces";
import { getOrCreateStore } from "@awspostman/store";
import { validateRequestName } from "@awspostman/validators";
import { Button, Input, SpaceBetween } from "@cloudscape-design/components";
import { useState } from "react";

export default function RequestFile({
  collectionDisplays,
  collectionDisplayIdx,
  requestIdx,
  onChange,
  onOpenRequest,
}: {
  collectionDisplays: CollectionDisplay[];
  collectionDisplayIdx: number;
  requestIdx: number;
  onChange?: (updatedCollectionDisplays: CollectionDisplay[]) => void;
  onOpenRequest?: (collectionDisplayIdx: number, requestIdx: number) => void;
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
                onChange?.(updatedCollectionDisplays);

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
              </SpaceBetween>
            </form>
          )
          : (
            <SpaceBetween direction="horizontal" size="xxxs">
              <Button variant="link" iconName="file" onClick={() => {
                onOpenRequest?.(collectionDisplayIdx, requestIdx);
              }}>{request.method} {request.name}</Button>
              <Button iconName="edit" variant="icon" onClick={() => {
                setPendingName(request.name);
                setIsEditingName(true);
              }} />
            </SpaceBetween>
          )
      }
    </SpaceBetween>
  );
}