import { useState } from "react";
import {
  Box,
  Button,
  Input,
  SpaceBetween,
} from "@cloudscape-design/components";
import { validateCollectionName } from "@quigeon/validators";
import {
  CollectionDisplay,
  RequestDisplay,
} from "@quigeon/interfaces";
import RequestFile from "./RequestFile";
import { AppDispatch, RootState } from "@quigeon/store";
import { createDefaultRequest, deleteCollectionDisplay, updateCollectionDisplay } from "@quigeon/collectionDisplaysSlice";
import { connect } from "react-redux";

interface StateProps {
  collectionDisplays: CollectionDisplay[];
  requestDisplay: RequestDisplay;
}

interface DispatchProps {
  updateCollectionDisplay: (collectionDisplayIdx: number, collectionDisplay: CollectionDisplay) => Promise<void>;
  deleteCollectionDisplay: (collectionDisplayIdx: number) => Promise<void>;
  createDefaultRequest: (collectionDisplayIdx: number) => Promise<void>;
}

interface OwnProps {
  collectionDisplayIdx: number;
}

type Props = StateProps & DispatchProps & OwnProps;

function CollectionFolder(props: Props) {

  const { collectionDisplays, collectionDisplayIdx, requestDisplay, deleteCollectionDisplay, updateCollectionDisplay, createDefaultRequest } = props;

  const { collection, requests, isOpen } =
    collectionDisplays[collectionDisplayIdx];

  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingName, setPendingName] = useState(collection.name);
  const [isPendingNameValid, setIsPendingNameValid] = useState(true);

  return (
    <SpaceBetween direction="vertical" size="xxxs">
      {isEditingName ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const isValid = validateCollectionName(pendingName);
            setIsPendingNameValid(isValid);
            if (isValid) {
              const updatedCollectionDisplay = structuredClone(collectionDisplays[collectionDisplayIdx]);
              updatedCollectionDisplay.collection.name = pendingName;

              await updateCollectionDisplay(collectionDisplayIdx, updatedCollectionDisplay);

              setIsEditingName(false);
            }
          }}
        >
          <SpaceBetween direction="horizontal" size="xxxs">
            <Input
              value={pendingName}
              invalid={!isPendingNameValid}
              autoFocus
              onChange={({ detail }) => {
                setPendingName(detail.value);
              }}
            />
            <Button iconName="check" variant="icon" />
            <Button
              iconName="close"
              variant="icon"
              formAction="none"
              onClick={() => {
                setPendingName(collection.name);
                setIsEditingName(false);
              }}
            />
          </SpaceBetween>
        </form>
      ) : (
        <SpaceBetween direction="horizontal" size="xxxs">
          <Button
            iconName={isOpen ? "folder-open" : "folder"}
            variant="link"
            onClick={async () => {
              const updatedCollectionDisplay = structuredClone(collectionDisplays[collectionDisplayIdx]);
              updatedCollectionDisplay.isOpen = !updatedCollectionDisplay.isOpen;

              await updateCollectionDisplay(collectionDisplayIdx, updatedCollectionDisplay);
            }}
          >
            {collection.name}
          </Button>
          <Button
            iconName="edit"
            variant="icon"
            onClick={() => {
              setPendingName(collection.name);
              setIsEditingName(true);
            }}
          />
          <Button
            iconName="remove"
            variant="icon"
            onClick={async () => {
              const isConfirmed = await confirm(`Delete "${collection.name}"?`);
              if (isConfirmed) {
                await deleteCollectionDisplay(collectionDisplayIdx);
              }
            }}
          />
        </SpaceBetween>
      )}
      {isOpen && (
        <Box margin={{ left: "l" }}>
          <SpaceBetween direction="vertical" size="xxxs">
            {requests.map((request, requestIdx) => (
              <RequestFile
                key={request.id}
                collectionDisplayIdx={collectionDisplayIdx}
                requestIdx={requestIdx}
              />
            ))}
            <Button iconName="add-plus" onClick={() => createDefaultRequest(collectionDisplayIdx)}>
              Add
            </Button>
          </SpaceBetween>
        </Box>
      )}
    </SpaceBetween>
  );
}

const mapStateToProps = (state: RootState) => {
  return {
    collectionDisplays: state.collectionDisplays.value,
    requestDisplay: state.requestDisplay.value,
  };
}

const mapDispatchToProps = (dispatch: AppDispatch) => {
  return {
    updateCollectionDisplay: (collectionDisplayIdx: number, collectionDisplay: CollectionDisplay) => dispatch(updateCollectionDisplay(collectionDisplayIdx, collectionDisplay)),
    deleteCollectionDisplay: (collectionDisplayIdx: number) => dispatch(deleteCollectionDisplay(collectionDisplayIdx)),
    createDefaultRequest: (collectionDisplayIdx: number) => dispatch(createDefaultRequest(collectionDisplayIdx)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CollectionFolder);