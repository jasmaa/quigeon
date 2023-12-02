import { validateCollectionName } from "@awspostman/file";
import { CollectionPartial, RequestPartial } from "@awspostman/interfaces";
import { Box, Button, Input, SpaceBetween } from "@cloudscape-design/components";
import { useState } from "react";

export default function Collection({
  collections,
  collectionIdx,
  onSaveCollectionName,
  onDeleteCollection,
  onOpenRequest,
  onAddRequest,
}: {
  collections: CollectionPartial[]
  collectionIdx: number
  onSaveCollectionName?: (name: string) => void;
  onDeleteCollection?: () => Promise<void>
  onOpenRequest?: (request: RequestPartial) => void;
  onAddRequest?: () => void
}) {

  const collection = collections[collectionIdx];

  const [isEditingName, setIsEditingName] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingName, setPendingName] = useState(collection.name);
  const [isPendingNameValid, setIsPendingNameValid] = useState(true);

  return (
    <SpaceBetween direction="vertical" size="xxxs">

      <SpaceBetween direction="horizontal" size="xxxs">
        {
          isEditingName
            ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                const isValid = validateCollectionName(pendingName);
                setIsPendingNameValid(isValid);
                if (isValid) {
                  onSaveCollectionName?.(pendingName);
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
                  setIsEditingName(true);
                }} />
              </SpaceBetween>
            )
        }
        <Button iconName="remove" variant="icon" onClick={onDeleteCollection} />
      </SpaceBetween>
      {
        isOpen && (
          <Box margin={{ left: "l" }}>
            <SpaceBetween direction="vertical" size="xxxs">
              {collection.requests.map((request) => (
                <Button variant="link" iconName="file" onClick={() => {
                  onOpenRequest?.(request);
                }}>{request.method} {request.name}</Button>
              ))}
              <Button iconName="add-plus" onClick={onAddRequest}>Add</Button>
            </SpaceBetween>
          </Box>
        )
      }
    </SpaceBetween >
  );
}