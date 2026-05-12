import { configureStore } from "@reduxjs/toolkit";

import type { AppState as AppSliceState } from "./appSlice";
import appReducer from "./appSlice";

export const store = configureStore({
	reducer: {
		app: appReducer,
	},
});

export type RootState = {
	app: AppSliceState;
};
export type AppDispatch = typeof store.dispatch;
