import { useEffect } from "react";
import {
  updateStakeRelayFee,
  updateUnstakeRelayFee,
} from "redux/reducers/TokenSlice";
import { RootState } from "redux/store";
import { useAppDispatch, useAppSelector } from "./common";
import { useAppSlice } from "./selector";

export function useRelayFee() {
  const { updateFlag } = useAppSlice();
  const dispatch = useAppDispatch();

  const { relayFee } = useAppSelector((state: RootState) => {
    return {
      relayFee: state.token.relayFee,
    };
  });

  useEffect(() => {
    if (!updateFlag) return;
    dispatch(updateStakeRelayFee());
    dispatch(updateUnstakeRelayFee());
  }, [dispatch, updateFlag]);

  return {
    relayFee,
  };
}
