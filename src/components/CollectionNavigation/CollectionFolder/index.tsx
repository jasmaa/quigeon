import { useState } from "react";
import {
  Box,
  Button,
  Input,
  SpaceBetween,
} from "@cloudscape-design/components";
import { validateCollectionName } from "@quigeon/validators";
import { CollectionDisplay, RequestDisplay } from "@quigeon/interfaces";
import RequestFile from "./RequestFile";
import { AppDispatch, RootState } from "@quigeon/redux/store";
import {
  createDefaultRequest,
  deleteCollectionDisplay,
  updateCollectionDisplay,
} from "@quigeon/redux/collections-slice";
import { connect } from "react-redux";
import { activeRequestSlice } from "@quigeon/redux/active-request-slice";

interface StateProps {
  collectionDisplays: CollectionDisplay[];
  activeRequestDisplay: RequestDisplay;
}

interface DispatchProps {
  updateCollectionDisplay: (
    collectionDisplayIdx: number,
    collectionDisplay: CollectionDisplay,
  ) => Promise<void>;
  deleteCollectionDisplay: (collectionDisplayIdx: number) => Promise<void>;
  createDefaultRequest: (collectionDisplayIdx: number) => Promise<void>;
  setActiveRequestDisplay: (requestDisplay: RequestDisplay) => void;
  resetActiveRequestDisplay: () => void;
}

interface OwnProps {
  collectionDisplayIdx: number;
}

type Props = StateProps & DispatchProps & OwnProps;

function CollectionFolder(props: Props) {
  const {
    collectionDisplays,
    activeRequestDisplay,
    collectionDisplayIdx,
    deleteCollectionDisplay,
    updateCollectionDisplay,
    createDefaultRequest,
    setActiveRequestDisplay,
    resetActiveRequestDisplay,
  } = props;

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
              const updatedCollectionDisplay = structuredClone(
                collectionDisplays[collectionDisplayIdx],
              );
              updatedCollectionDisplay.collection.name = pendingName;

              await updateCollectionDisplay(
                collectionDisplayIdx,
                updatedCollectionDisplay,
              );

              if (
                activeRequestDisplay.indices?.collectionDisplayIdx ===
                collectionDisplayIdx
              ) {
                const updatedActiveRequestDisplay =
                  structuredClone(activeRequestDisplay);
                updatedActiveRequestDisplay.collection =
                  updatedCollectionDisplay.collection;

                setActiveRequestDisplay(updatedActiveRequestDisplay);
              }

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
              const updatedCollectionDisplay = structuredClone(
                collectionDisplays[collectionDisplayIdx],
              );
              updatedCollectionDisplay.isOpen =
                !updatedCollectionDisplay.isOpen;

              await updateCollectionDisplay(
                collectionDisplayIdx,
                updatedCollectionDisplay,
              );

              if (
                activeRequestDisplay.indices?.collectionDisplayIdx ===
                collectionDisplayIdx
              ) {
                const updatedRequestDisplay =
                  structuredClone(activeRequestDisplay);
                updatedRequestDisplay.collection =
                  updatedCollectionDisplay.collection;

                setActiveRequestDisplay(updatedRequestDisplay);
              }
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
                  activeRequestDisplay.indices?.collectionDisplayIdx ===
                  collectionDisplayIdx
                ) {
                  resetActiveRequestDisplay();
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
              />
            ))}
            <Button
              iconName="add-plus"
              onClick={() => createDefaultRequest(collectionDisplayIdx)}
            >
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
    collectionDisplays: state.collections.collectionDisplays,
    activeRequestDisplay: state.activeRequest.requestDisplay,
  };
};

const mapDispatchToProps = (dispatch: AppDispatch) => {
  return {
    updateCollectionDisplay: (
      collectionDisplayIdx: number,
      collectionDisplay: CollectionDisplay,
    ) =>
      dispatch(
        updateCollectionDisplay(collectionDisplayIdx, collectionDisplay),
      ),
    deleteCollectionDisplay: (collectionDisplayIdx: number) =>
      dispatch(deleteCollectionDisplay(collectionDisplayIdx)),
    createDefaultRequest: (collectionDisplayIdx: number) =>
      dispatch(createDefaultRequest(collectionDisplayIdx)),
    setActiveRequestDisplay: (requestDisplay: RequestDisplay) =>
      dispatch({
        type: activeRequestSlice.actions.setActiveRequestDisplay.type,
        payload: {
          requestDisplay,
        },
      }),
    resetActiveRequestDisplay: () =>
      dispatch({
        type: activeRequestSlice.actions.resetActiveRequestDisplay.type,
      }),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CollectionFolder);
