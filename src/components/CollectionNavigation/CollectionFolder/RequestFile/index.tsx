import { useState } from "react";
import {
  CollectionDisplay,
  Request,
  RequestDisplay,
} from "@quigeon/interfaces";
import { validateRequestName } from "@quigeon/validators";
import { Button, Input, SpaceBetween } from "@cloudscape-design/components";
import { connect } from "react-redux";
import { AppDispatch, RootState } from "@quigeon/redux/store";
import { deleteRequest, updateRequest } from "@quigeon/redux/collections-slice";
import { activeRequestSlice } from "@quigeon/redux/active-request-slice";

interface StateProps {
  collectionDisplays: CollectionDisplay[];
  activeRequestDisplay: RequestDisplay;
}

interface DispatchProps {
  updateRequest: (
    collectionDisplayIdx: number,
    requestIdx: number,
    request: Request,
  ) => Promise<void>;
  deleteRequest: (
    collectionDisplayIdx: number,
    requestIdx: number,
  ) => Promise<void>;
  setActiveRequestDisplay: (requestDisplay: RequestDisplay) => void;
  resetActiveRequestDisplay: () => void;
}

interface OwnProps {
  collectionDisplayIdx: number;
  requestIdx: number;
}

type Props = StateProps & DispatchProps & OwnProps;

function RequestFile(props: Props) {
  const {
    collectionDisplays,
    activeRequestDisplay,
    collectionDisplayIdx,
    requestIdx,
    updateRequest,
    deleteRequest,
    setActiveRequestDisplay,
    resetActiveRequestDisplay,
  } = props;

  const request = collectionDisplays[collectionDisplayIdx].requests[requestIdx];

  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingName, setPendingName] = useState(request.name);
  const [isPendingNameValid, setIsPendingNameValid] = useState(true);

  return (
    <SpaceBetween direction="horizontal" size="xxxs">
      {isEditingName ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const isValid = validateRequestName(pendingName);
            setIsPendingNameValid(isValid);
            if (isValid) {
              const updatedRequest = structuredClone(
                collectionDisplays[collectionDisplayIdx].requests[requestIdx],
              );
              updatedRequest.name = pendingName;

              await updateRequest(
                collectionDisplayIdx,
                requestIdx,
                updatedRequest,
              );

              if (
                activeRequestDisplay.indices?.collectionDisplayIdx ===
                  collectionDisplayIdx &&
                activeRequestDisplay.indices.requestIdx === requestIdx
              ) {
                const updatedActiveRequestDisplay =
                  structuredClone(activeRequestDisplay);
                updatedActiveRequestDisplay.request = updatedRequest;

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
                setPendingName(request.name);
                setIsEditingName(false);
              }}
            />
          </SpaceBetween>
        </form>
      ) : (
        <SpaceBetween direction="horizontal" size="xxxs">
          <Button
            variant="link"
            iconName="file"
            onClick={() => {
              const requestDisplay = {
                request: structuredClone(
                  collectionDisplays[collectionDisplayIdx].requests[requestIdx],
                ),
                collection: structuredClone(
                  collectionDisplays[collectionDisplayIdx].collection,
                ),
                indices: {
                  collectionDisplayIdx,
                  requestIdx,
                },
              };
              setActiveRequestDisplay(requestDisplay);
            }}
          >
            {request.method} {request.name}
          </Button>
          <Button
            iconName="edit"
            variant="icon"
            onClick={() => {
              setPendingName(request.name);
              setIsEditingName(true);
            }}
          />
          <Button
            iconName="remove"
            variant="icon"
            onClick={async () => {
              const isConfirmed = await confirm(`Delete "${request.name}"?`);
              if (isConfirmed) {
                await deleteRequest(collectionDisplayIdx, requestIdx);

                if (
                  activeRequestDisplay.indices?.collectionDisplayIdx ===
                    collectionDisplayIdx &&
                  activeRequestDisplay.indices?.requestIdx === requestIdx
                ) {
                  resetActiveRequestDisplay();
                }
              }
            }}
          />
        </SpaceBetween>
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
    updateRequest: (
      collectionDisplayIdx: number,
      requestIdx: number,
      request: Request,
    ) => dispatch(updateRequest(collectionDisplayIdx, requestIdx, request)),
    deleteRequest: (collectionDisplayIdx: number, requestIdx: number) =>
      dispatch(deleteRequest(collectionDisplayIdx, requestIdx)),
    setActiveRequestDisplay: (requestDisplay: RequestDisplay) =>
      dispatch({
        type: activeRequestSlice.actions.setActiveRequestDisplay.type,
        payload: { requestDisplay },
      }),
    resetActiveRequestDisplay: () =>
      dispatch({
        type: activeRequestSlice.actions.resetActiveRequestDisplay.type,
      }),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RequestFile);
