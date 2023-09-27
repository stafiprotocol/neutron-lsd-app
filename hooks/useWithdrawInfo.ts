import { useEffect } from "react";
import { updateLsdTokenUnbondingDuration } from "redux/reducers/LsdTokenSlice";
import { updateLsdTokenUserWithdrawInfo } from "redux/reducers/TokenSlice";
import { RootState } from "redux/store";
import { useAppDispatch, useAppSelector } from "./common";
import { useAppSlice } from "./selector";
import { useWalletAccount } from "./useWalletAccount";

export function useWithdrawInfo() {
  const dispatch = useAppDispatch();
  const { updateFlag } = useAppSlice();

  const { unbondingDuration } = useAppSelector((state: RootState) => {
    return {
      unbondingDuration: state.lsdToken.unbondingDuration,
    };
  });

  const { metaMaskAccount } = useWalletAccount();

  const { withdrawInfo } = useAppSelector((state: RootState) => {
    return {
      withdrawInfo: state.token.withdrawInfo,
    };
  });

  useEffect(() => {
    if (!updateFlag) return;
    dispatch(updateLsdTokenUnbondingDuration());
    dispatch(updateLsdTokenUserWithdrawInfo());
  }, [dispatch, updateFlag, unbondingDuration, metaMaskAccount]);

  return { withdrawInfo };
}
