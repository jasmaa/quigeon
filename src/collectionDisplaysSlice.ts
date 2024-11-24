import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CollectionDisplay, Request } from "./interfaces";
import { getOrCreateStore } from "./db";
import { AppDispatch, RootState } from "./store";
import { getDefaultCollectionDisplay } from "./generators";

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
    createRequest: (state, action: PayloadAction<{ collectionIdx: number, request: Request }>) => { },
    updateRequest: () => { },
    deleteRequest: () => { },
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

export function updateCollectionDisplay(collectionIdx: number, updatedCollectionDisplay: CollectionDisplay) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {

  };
}

export function deleteCollectionDisplay(collectionDisplayIdx: number) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const collectionDisplays = getState().collectionDisplays.value;

    const store = await getOrCreateStore();
    const collectionId = collectionDisplays[collectionDisplayIdx].collection.id;
    await store.deleteCollection(collectionId);

    dispatch({
      type: collectionDisplaysSlice.actions.removeCollectionDisplay.type,
      payload: {
        collectionDisplayIdx,
      }
    });
  };
}