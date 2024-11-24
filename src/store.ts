import { configureStore } from "@reduxjs/toolkit";
import { collectionDisplaysSlice } from "./collectionDisplaysSlice";

const store = configureStore({
  reducer: {
    collectionDisplays: collectionDisplaysSlice.reducer,
  }
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;