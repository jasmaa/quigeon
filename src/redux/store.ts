import { configureStore } from "@reduxjs/toolkit";
import { collectionsSlice } from "@quigeon/redux/collections-slice";
import { activeRequestSlice } from "@quigeon/redux/active-request-slice";

const store = configureStore({
  reducer: {
    collections: collectionsSlice.reducer,
    activeRequest: activeRequestSlice.reducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
