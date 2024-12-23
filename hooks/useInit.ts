import dayjs from "dayjs";
import { useEffect } from "react";
import {
  setDarkMode,
  setUnreadNoticeFlag,
  setUpdateFlag,
} from "redux/reducers/AppSlice";
import { updateApr } from "redux/reducers/LsdTokenSlice";
import {
  updateCosmosTokenBalances,
  updateNeutronPoolInfo,
} from "redux/reducers/TokenSlice";
import { autoConnectKeplrChains } from "redux/reducers/WalletSlice";
import {
  STORAGE_KEY_DARK_MODE,
  STORAGE_KEY_UNREAD_NOTICE,
  getStorage,
} from "utils/storageUtils";
import { useAppDispatch } from "./common";
import { useAppSlice } from "./selector";
import { useInterval } from "./useInterval";
import { updateTargetsChainTokenBalances } from "redux/reducers/BridgeSlice";

export function useInit() {
  const dispatch = useAppDispatch();
  const { updateFlag, darkMode } = useAppSlice();

  useEffect(() => {
    // Init local data.
    const unreadNotice = getStorage(STORAGE_KEY_UNREAD_NOTICE);
    dispatch(setUnreadNoticeFlag(!!unreadNotice));
    dispatch(setDarkMode(!!getStorage(STORAGE_KEY_DARK_MODE)));
  }, [dispatch]);

  useEffect(() => {
    if (dispatch && updateFlag) {
      // Query Dex Price change data
      // dispatch(updatePriceChangeRateData());
      // query apr
      dispatch(updateApr());
    }
  }, [updateFlag, dispatch]);

  useInterval(() => {
    dispatch(setUpdateFlag(dayjs().unix()));
  }, 6000); // 6s

  useEffect(() => {
    // Auto connect Keplr accounts
    dispatch(autoConnectKeplrChains());

    const onKeplrAccountChange = () => {
      dispatch(autoConnectKeplrChains());
    };

    // Keplr account change event.
    addEventListener("keplr_keystorechange", onKeplrAccountChange);

    return () => {
      removeEventListener("keplr_keystorechange", onKeplrAccountChange);
    };
  }, [dispatch]);

  // Update data.
  useEffect(() => {
    dispatch(updateCosmosTokenBalances());
    dispatch(updateNeutronPoolInfo());
    dispatch(updateTargetsChainTokenBalances());
  }, [dispatch, updateFlag]);

  // Change body backgroundColor
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#222C3C" : "#E8EFFD";
  }, [darkMode]);
}
