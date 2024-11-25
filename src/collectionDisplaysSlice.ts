import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CollectionDisplay, Request } from "./interfaces";
import { getOrCreateStore } from "./db";
import { AppDispatch, RootState } from "./store";
import { getDefaultCollectionDisplay, getDefaultRequest } from "./generators";
import { requestDisplaySlice } from "./requestDisplaySlice";

interface CollectionDisplaysState {
  value: CollectionDisplay[];
}

const initialState: CollectionDisplaysState = {
  value: [],
};

export const collectionDisplaysSlice = createSlice({
  name: "collectionDisplays",
  initialState,
  reducers: {
    setCollectionDisplays: (
      state,
      action: PayloadAction<{ collectionDisplays: CollectionDisplay[] }>,
    ) => {
      const { collectionDisplays } = action.payload;
      state.value = collectionDisplays;
    },
    setCollectionDisplay: (
      state,
      action: PayloadAction<{
        collectionDisplayIdx: number;
        collectionDisplay: CollectionDisplay;
      }>,
    ) => {
      const { collectionDisplayIdx, collectionDisplay } = action.payload;
      state.value[collectionDisplayIdx] = collectionDisplay;
    },
    appendCollectionDisplay: (
      state,
      action: PayloadAction<{ collectionDisplay: CollectionDisplay }>,
    ) => {
      const { collectionDisplay } = action.payload;
      state.value.push(collectionDisplay);
    },
    removeCollectionDisplay: (
      state,
      action: PayloadAction<{ collectionDisplayIdx: number }>,
    ) => {
      const { collectionDisplayIdx } = action.payload;
      state.value.splice(collectionDisplayIdx, 1);
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
      state.value[collectionDisplayIdx].requests[requestIdx] = request;
    },
    appendRequest: (
      state,
      action: PayloadAction<{ collectionDisplayIdx: number; request: Request }>,
    ) => {
      const { collectionDisplayIdx, request } = action.payload;
      state.value[collectionDisplayIdx].requests.push(request);
    },
    removeRequest: (
      state,
      action: PayloadAction<{
        collectionDisplayIdx: number;
        requestIdx: number;
      }>,
    ) => {
      const { collectionDisplayIdx, requestIdx } = action.payload;
      state.value[collectionDisplayIdx].requests.splice(requestIdx, 1);
    },
  },
});

export function loadCollectionDisplays() {
  return async (dispatch: AppDispatch) => {
    const db = await getOrCreateStore();

    const collectionDisplays = [];
    const collections = await db.listCollections();
    for (const collection of collections) {
      const requests = await db.listRequests(collection.id);
      const collectionDisplay = {
        collection,
        requests,
        isOpen: false,
      };
      collectionDisplays.push(collectionDisplay);
    }

    dispatch({
      type: collectionDisplaysSlice.actions.setCollectionDisplays.type,
      payload: {
        collectionDisplays,
      },
    });
  };
}

export function createDefaultCollectionDisplay() {
  return async (dispatch: AppDispatch) => {
    const addedCollectionDisplay = getDefaultCollectionDisplay();

    const store = await getOrCreateStore();
    await store.upsertCollection(addedCollectionDisplay.collection);

    dispatch({
      type: collectionDisplaysSlice.actions.appendCollectionDisplay.type,
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
    const requestDisplay = getState().requestDisplay.value;

    const store = await getOrCreateStore();
    await store.upsertCollection(collectionDisplay.collection);

    dispatch({
      type: collectionDisplaysSlice.actions.setCollectionDisplay.type,
      payload: {
        collectionDisplayIdx,
        collectionDisplay,
      },
    });

    if (requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx) {
      const updatedRequestDisplay = structuredClone(requestDisplay);
      updatedRequestDisplay.collection = collectionDisplay.collection;

      dispatch({
        type: requestDisplaySlice.actions.setRequestDisplay.type,
        payload: {
          requestDisplay: updatedRequestDisplay,
        },
      });
    }
  };
}

export function deleteCollectionDisplay(collectionDisplayIdx: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const collectionDisplays = getState().collectionDisplays.value;
    const requestDisplay = getState().requestDisplay.value;

    const store = await getOrCreateStore();
    const collectionId = collectionDisplays[collectionDisplayIdx].collection.id;
    await store.deleteCollection(collectionId);

    dispatch({
      type: collectionDisplaysSlice.actions.removeCollectionDisplay.type,
      payload: {
        collectionDisplayIdx,
      },
    });

    if (requestDisplay.indices?.collectionDisplayIdx === collectionDisplayIdx) {
      dispatch({
        type: requestDisplaySlice.actions.resetRequestDisplay.type,
      });
    }
  };
}

export function createDefaultRequest(collectionDisplayIdx: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const collectionDisplay =
      getState().collectionDisplays.value[collectionDisplayIdx];

    const addedRequest: Request = getDefaultRequest();
    addedRequest.collectionId = collectionDisplay.collection.id;

    const store = await getOrCreateStore();
    await store.upsertRequest(addedRequest);

    const updatedCollectionDisplay = structuredClone(collectionDisplay);
    updatedCollectionDisplay.requests.push(addedRequest);

    dispatch({
      type: collectionDisplaysSlice.actions.setCollectionDisplay.type,
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
    const requestDisplay = getState().requestDisplay.value;

    const store = await getOrCreateStore();
    await store.upsertRequest(request);

    dispatch({
      type: collectionDisplaysSlice.actions.setRequest.type,
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
        type: requestDisplaySlice.actions.setRequestDisplay.type,
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
      getState().collectionDisplays.value[collectionDisplayIdx].requests[
        requestIdx
      ].id;
    const requestDisplay = getState().requestDisplay.value;

    const store = await getOrCreateStore();
    await store.deleteRequest(requestId);

    dispatch({
      type: collectionDisplaysSlice.actions.removeRequest.type,
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
        type: requestDisplaySlice.actions.resetRequestDisplay.type,
      });
    }
  };
}
