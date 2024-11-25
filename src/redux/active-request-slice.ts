import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getDefaultRequestDisplay } from "@quigeon/generators";
import { RequestDisplay } from "@quigeon/interfaces";

interface ActiveRequestState {
  requestDisplay: RequestDisplay;
}

const initialState: ActiveRequestState = {
  requestDisplay: getDefaultRequestDisplay(),
};

export const activeRequestSlice = createSlice({
  name: "active-request",
  initialState,
  reducers: {
    setActiveRequestDisplay: (
      state,
      action: PayloadAction<{ requestDisplay: RequestDisplay }>,
    ) => {
      state.requestDisplay = action.payload.requestDisplay;
    },
    resetActiveRequestDisplay: (state) => {
      state.requestDisplay = getDefaultRequestDisplay();
    },
  },
});
