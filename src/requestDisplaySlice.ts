import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getDefaultRequestDisplay } from "./generators";
import { RequestDisplay } from "./interfaces";

interface RequestDisplayState {
  value: RequestDisplay;
}

const initialState: RequestDisplayState = {
  value: getDefaultRequestDisplay(),
}

export const requestDisplaySlice = createSlice({
  name: "requestDisplay",
  initialState,
  reducers: {
    setRequestDisplay: (state, action: PayloadAction<{ requestDisplay: RequestDisplay }>) => {
      state.value = action.payload.requestDisplay;
    },
    resetRequestDisplay: (state) => {
      state.value = getDefaultRequestDisplay();
    }
  }
});