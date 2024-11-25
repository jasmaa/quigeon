import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CollectionDisplay, Request } from "../interfaces";
import { getOrCreateAppStorage } from "../app-storage";
import { AppDispatch, RootState } from "@quigeon/redux/store";
import { getDefaultCollectionDisplay, getDefaultRequest } from "../generators";
import { activeRequestSlice } from "./active-request-slice";

interface CollectionDisplaysState {
  collectionDisplays: CollectionDisplay[];
}

const initialState: CollectionDisplaysState = {
  collectionDisplays: [],
};

export const collectionsSlice = createSlice({
  name: "collections",
  initialState,
  reducers: {
    setCollectionDisplays: (
      state,
      action: PayloadAction<{ collectionDisplays: CollectionDisplay[] }>,
    ) => {
      const { collectionDisplays } = action.payload;
      state.collectionDisplays = collectionDisplays;
    },
    setCollectionDisplay: (
      state,
      action: PayloadAction<{
        collectionDisplayIdx: number;
        collectionDisplay: CollectionDisplay;
      }>,
    ) => {
      const { collectionDisplayIdx, collectionDisplay } = action.payload;
      state.collectionDisplays[collectionDisplayIdx] = collectionDisplay;
    },
    appendCollectionDisplay: (
      state,
      action: PayloadAction<{ collectionDisplay: CollectionDisplay }>,
    ) => {
      const { collectionDisplay } = action.payload;
      state.collectionDisplays.push(collectionDisplay);
    },
    removeCollectionDisplay: (
      state,
      action: PayloadAction<{ collectionDisplayIdx: number }>,
    ) => {
      const { collectionDisplayIdx } = action.payload;
      state.collectionDisplays.splice(collectionDisplayIdx, 1);
    },
    setRequest: (
      state,
      action: PayloadAction<{
        collectionDisplayIdx: number;
        requestIdx: number;
        request: Request;
      }>,
    ) => {
      const { collectionDisplayIdx, requestIdx, request } = action.payload;
      state.collectionDisplays[collectionDisplayIdx].requests[requestIdx] =
        request;
    },
    appendRequest: (
      state,
      action: PayloadAction<{ collectionDisplayIdx: number; request: Request }>,
    ) => {
      const { collectionDisplayIdx, request } = action.payload;
      state.collectionDisplays[collectionDisplayIdx].requests.push(request);
    },
    removeRequest: (
      state,
      action: PayloadAction<{
        collectionDisplayIdx: number;
        requestIdx: number;
      }>,
    ) => {
      const { collectionDisplayIdx, requestIdx } = action.payload;
      state.collectionDisplays[collectionDisplayIdx].requests.splice(
        requestIdx,
        1,
      );
    },
  },
});

export function loadCollectionDisplays() {
  return async (dispatch: AppDispatch) => {
    const appStorage = await getOrCreateAppStorage();

    const collectionDisplays = [];
    const collections = await appStorage.listCollections();
    for (const collection of collections) {
      const requests = await appStorage.listRequests(collection.id);
      const collectionDisplay = {
        collection,
        requests,
        isOpen: false,
      };
      collectionDisplays.push(collectionDisplay);
    }

    dispatch({
      type: collectionsSlice.actions.setCollectionDisplays.type,
      payload: {
        collectionDisplays,
      },
    });
  };
}

export function createDefaultCollectionDisplay() {
  return async (dispatch: AppDispatch) => {
    const addedCollectionDisplay = getDefaultCollectionDisplay();

    const appStorage = await getOrCreateAppStorage();
    await appStorage.upsertCollection(addedCollectionDisplay.collection);

    dispatch({
      type: collectionsSlice.actions.appendCollectionDisplay.type,
      payload: {
        collectionDisplay: addedCollectionDisplay,
      },
    });
  };
}

export function updateCollectionDisplay(
  collectionDisplayIdx: number,
  collectionDisplay: CollectionDisplay,
) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const requestDisplay = getState().activeRequest.requestDisplay;

    const appStorage = await getOrCreateAppStorage();
    await appStorage.upsertCollection(collectionDisplay.collection);

    dispatch({
      type: collectionsSlice.actions.setCollectionDisplay.type,
      payload: {
        collectionDisplayIdx,
        collectionDisplay,
      },
    });

    if (requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx) {
      const updatedRequestDisplay = structuredClone(requestDisplay);
      updatedRequestDisplay.collection = collectionDisplay.collection;

      dispatch({
        type: activeRequestSlice.actions.setActiveRequestDisplay.type,
        payload: {
          requestDisplay: updatedRequestDisplay,
        },
      });
    }
  };
}

export function deleteCollectionDisplay(collectionDisplayIdx: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const collectionDisplays = getState().collections.collectionDisplays;
    const requestDisplay = getState().activeRequest.requestDisplay;

    const appStorage = await getOrCreateAppStorage();
    const collectionId = collectionDisplays[collectionDisplayIdx].collection.id;
    await appStorage.deleteCollection(collectionId);

    dispatch({
      type: collectionsSlice.actions.removeCollectionDisplay.type,
      payload: {
        collectionDisplayIdx,
      },
    });

    if (requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx) {
      dispatch({
        type: activeRequestSlice.actions.resetActiveRequestDisplay.type,
      });
    }
  };
}

export function createDefaultRequest(collectionDisplayIdx: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const collectionDisplay =
      getState().collections.collectionDisplays[collectionDisplayIdx];

    const addedRequest: Request = getDefaultRequest();
    addedRequest.collectionId = collectionDisplay.collection.id;

    const appStorage = await getOrCreateAppStorage();
    await appStorage.upsertRequest(addedRequest);

    const updatedCollectionDisplay = structuredClone(collectionDisplay);
    updatedCollectionDisplay.requests.push(addedRequest);

    dispatch({
      type: collectionsSlice.actions.setCollectionDisplay.type,
      payload: {
        collectionDisplayIdx,
        collectionDisplay: updatedCollectionDisplay,
      },
    });
  };
}

export function updateRequest(
  collectionDisplayIdx: number,
  requestIdx: number,
  request: Request,
) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const requestDisplay = getState().activeRequest.requestDisplay;

    const appStorage = await getOrCreateAppStorage();
    await appStorage.upsertRequest(request);

    dispatch({
      type: collectionsSlice.actions.setRequest.type,
      payload: {
        collectionDisplayIdx,
        requestIdx,
        request,
      },
    });

    if (
      requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx &&
      requestDisplay.indices.requestIdx === requestIdx
    ) {
      const updatedRequestDisplay = structuredClone(requestDisplay);
      updatedRequestDisplay.request = request;

      dispatch({
        type: activeRequestSlice.actions.setActiveRequestDisplay.type,
        payload: {
          requestDisplay: updatedRequestDisplay,
        },
      });
    }
  };
}

export function deleteRequest(
  collectionDisplayIdx: number,
  requestIdx: number,
) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const requestId =
      getState().collections.collectionDisplays[collectionDisplayIdx].requests[
        requestIdx
      ].id;
    const requestDisplay = getState().activeRequest.requestDisplay;

    const appStorage = await getOrCreateAppStorage();
    await appStorage.deleteRequest(requestId);

    dispatch({
      type: collectionsSlice.actions.removeRequest.type,
      payload: {
        collectionDisplayIdx,
        requestIdx,
      },
    });

    if (
      requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx &&
      requestDisplay.indices?.requestIdx === requestIdx
    ) {
      dispatch({
        type: activeRequestSlice.actions.resetActiveRequestDisplay.type,
      });
    }
  };
}
