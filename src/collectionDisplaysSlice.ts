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
}

export const collectionDisplaysSlice = createSlice({
  name: "collectionDisplays",
  initialState,
  reducers: {
    setCollectionDisplays: (state, action: PayloadAction<{ collectionDisplays: CollectionDisplay[] }>) => {
      state.value = action.payload.collectionDisplays;
    },
    setCollectionDisplay: (state, action: PayloadAction<{ collectionDisplayIdx: number, collectionDisplay: CollectionDisplay }>) => {
      const updatedCollectionDisplays = [...state.value];
      updatedCollectionDisplays[action.payload.collectionDisplayIdx] = action.payload.collectionDisplay;
      state.value = updatedCollectionDisplays;
    },
    appendCollectionDisplay: (state, action: PayloadAction<{ collectionDisplay: CollectionDisplay }>) => {
      state.value = [
        ...state.value,
        action.payload.collectionDisplay,
      ];
    },
    removeCollectionDisplay: (state, action: PayloadAction<{ collectionDisplayIdx: number }>) => {
      const updatedCollectionDisplays = [...state.value];
      updatedCollectionDisplays.splice(action.payload.collectionDisplayIdx, 1);
      state.value = updatedCollectionDisplays;
    },
    appendRequest: (state, action: PayloadAction<{ collectionIdx: number, request: Request }>) => { },
    updateRequest: () => { },
    removeRequest: () => { },
  }
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
      }
    });
  }
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
      }
    });
  };
}

export function updateCollectionDisplay(collectionDisplayIdx: number, collectionDisplay: CollectionDisplay) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const requestDisplay = getState().requestDisplay.value;

    const store = await getOrCreateStore();
    await store.upsertCollection(collectionDisplay.collection);

    dispatch({
      type: collectionDisplaysSlice.actions.setCollectionDisplay.type,
      payload: {
        collectionDisplayIdx,
        collectionDisplay,
      }
    });

    if (
      requestDisplay.indices?.collectionDisplayIdx ===
      collectionDisplayIdx
    ) {
      const updatedRequestDisplay = structuredClone(requestDisplay);
      dispatch({
        type: requestDisplaySlice.actions.setRequestDisplay.type,
        payload: {
          requestDisplay: updatedRequestDisplay,
        }
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
      }
    });

    if (
      requestDisplay.indices?.collectionDisplayIdx ===
      collectionDisplayIdx
    ) {
      dispatch({
        type: requestDisplaySlice.actions.resetRequestDisplay.type,
      });
    }
  };
}

export function createDefaultRequest(collectionDisplayIdx: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const collectionDisplay = getState().collectionDisplays.value[collectionDisplayIdx];

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
      }
    });
  };
}