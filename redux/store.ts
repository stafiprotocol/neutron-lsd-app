import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import appReducer from "./reducers/AppSlice";
import walletReducer from "./reducers/WalletSlice";
import tokenReducer from "./reducers/TokenSlice";
import lsdTokenReducer from "./reducers/LsdTokenSlice";
import redelegateReducer from "./reducers/RedelegateSlice";
import bridgeReducer from "./reducers/BridgeSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    wallet: walletReducer,
    token: tokenReducer,
    lsdToken: lsdTokenReducer,
    redelegate: redelegateReducer,
    bridge: bridgeReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
