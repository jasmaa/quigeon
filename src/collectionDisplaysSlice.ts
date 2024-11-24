import { createSlice, Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { Collection, CollectionDisplay, Request } from "./interfaces";
import { getOrCreateStore } from "./db";

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
    loadCollectionDisplays: (state, action: PayloadAction<{ collectionDisplays: CollectionDisplay[] }>) => {
      state.value = action.payload.collectionDisplays;
    },
    createCollectionDisplay: (state, action: PayloadAction<{ collection: Collection }>) => { },
    openCollectionDisplay: (state, action: PayloadAction<{ collectionIdx: number }>) => { },
    closeCollectionDisplay: (state, action: PayloadAction<{ collectionIdx: number }>) => { },
    deleteCollectionDisplay: (state, action: PayloadAction<{ collectionIdx: number }>) => { },
    createRequest: (state, action: PayloadAction<{ collectionIdx: number, request: Request }>) => { },
    updateRequest: () => { },
    deleteRequest: () => { },
  }
})

export function loadCollectionDisplays() {
  return async (dispatch: Dispatch) => {
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
      type: "collectionDisplays/loadCollectionDisplays",
      payload: {
        collectionDisplays,
      }
    });
  }
}