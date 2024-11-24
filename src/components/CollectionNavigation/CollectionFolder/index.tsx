import { useState } from "react";
import {
  Box,
  Button,
  Input,
  SpaceBetween,
} from "@cloudscape-design/components";
import { validateCollectionName } from "@quigeon/validators";
import { getOrCreateStore } from "@quigeon/db";
import {
  CollectionDisplay,
  RequestDisplay,
  Request,
} from "@quigeon/interfaces";
import {
  getDefaultRequest,
} from "@quigeon/generators";
import RequestFile from "./RequestFile";
import { AppDispatch, RootState } from "@quigeon/store";
import { deleteCollectionDisplay } from "@quigeon/collectionDisplaysSlice";
import { connect } from "react-redux";
import { requestDisplaySlice } from "@quigeon/requestDisplaySlice";

interface StateProps {
  collectionDisplays: CollectionDisplay[];
  requestDisplay: RequestDisplay;
}

interface DispatchProps {
  deleteCollectionDisplay: (collectionDisplayIdx: number) => Promise<void>;
  resetRequestDisplay: () => void;
}

interface OwnProps {
  collectionDisplayIdx: number;
}

type Props = StateProps & DispatchProps & OwnProps;

function CollectionFolder(props: Props) {

  const { collectionDisplays, collectionDisplayIdx, requestDisplay, deleteCollectionDisplay, resetRequestDisplay } = props;

  const { collection, requests, isOpen } =
    collectionDisplays[collectionDisplayIdx];

  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingName, setPendingName] = useState(collection.name);
  const [isPendingNameValid, setIsPendingNameValid] = useState(true);

  const onAddRequest = async () => {
    const addedRequest: Request = getDefaultRequest();
    addedRequest.collectionId = collection.id;

    const updatedCollectionDisplays = structuredClone(collectionDisplays);
    updatedCollectionDisplays[collectionDisplayIdx].requests.push(addedRequest);
    // setCollectionDisplays(updatedCollectionDisplays);

    const store = await getOrCreateStore();
    await store.upsertRequest(addedRequest);
  };

  return (
    <SpaceBetween direction="vertical" size="xxxs">
      {isEditingName ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const isValid = validateCollectionName(pendingName);
            setIsPendingNameValid(isValid);
            if (isValid) {
              const updatedCollectionDisplays =
                structuredClone(collectionDisplays);
              updatedCollectionDisplays[collectionDisplayIdx].collection.name =
                pendingName;
              // setCollectionDisplays(updatedCollectionDisplays);

              if (
                requestDisplay.indices?.collectionDisplayIdx ===
                collectionDisplayIdx
              ) {
                const updatedRequestDisplay = structuredClone(requestDisplay);
                updatedRequestDisplay.collection =
                  updatedCollectionDisplays[collectionDisplayIdx].collection;
                // setRequestDisplay(updatedRequestDisplay);
              }

              const store = await getOrCreateStore();
              await store.upsertCollection(
                updatedCollectionDisplays[collectionDisplayIdx].collection,
              );

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
            onClick={() => {
              const updatedCollectionDisplays =
                structuredClone(collectionDisplays);
              updatedCollectionDisplays[collectionDisplayIdx].isOpen =
                !updatedCollectionDisplays[collectionDisplayIdx].isOpen;
              // setCollectionDisplays(updatedCollectionDisplays);
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
                if (
                  requestDisplay.indices?.collectionDisplayIdx ===
                  collectionDisplayIdx
                ) {
                  resetRequestDisplay();
                }
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
                collectionDisplays={collectionDisplays}
                setCollectionDisplays={() => { }}
                requestDisplay={requestDisplay}
                setRequestDisplay={() => { }}
              />
            ))}
            <Button iconName="add-plus" onClick={onAddRequest}>
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
    deleteCollectionDisplay: (collectionDisplayIdx: number) => dispatch(deleteCollectionDisplay(collectionDisplayIdx)),
    resetRequestDisplay: () => dispatch({ type: requestDisplaySlice.actions.resetRequestDisplay.type })
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CollectionFolder);