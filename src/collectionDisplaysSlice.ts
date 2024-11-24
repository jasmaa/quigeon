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
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const collectionDisplays = getState().collectionDisplays.value;

    const addedCollectionDisplay = getDefaultCollectionDisplay();

    const store = await getOrCreateStore();
    await store.upsertCollection(addedCollectionDisplay.collection);

    const updatedCollectionDisplays = [
      ...collectionDisplays,
      addedCollectionDisplay,
    ];
    dispatch({
      type: collectionDisplaysSlice.actions.setCollectionDisplays.type,
      payload: {
        collectionDisplays: updatedCollectionDisplays,
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

    const updatedCollectionDisplays = [...collectionDisplays];
    updatedCollectionDisplays.splice(collectionDisplayIdx, 1);
    dispatch({
      type: collectionDisplaysSlice.actions.setCollectionDisplays.type,
      payload: {
        collectionDisplays: updatedCollectionDisplays,
      }
    });
  };
}