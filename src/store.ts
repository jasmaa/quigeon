import { configureStore } from "@reduxjs/toolkit";
import { collectionDisplaysSlice } from "./collectionDisplaysSlice";
import { requestDisplaySlice } from "./requestDisplaySlice";

const store = configureStore({
  reducer: {
    collectionDisplays: collectionDisplaysSlice.reducer,
    requestDisplay: requestDisplaySlice.reducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
