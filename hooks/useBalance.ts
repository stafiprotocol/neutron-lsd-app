import { useEffect } from "react";
import { updateLsdTokenBalance } from "redux/reducers/LsdTokenSlice";
import { RootState } from "redux/store";
import { useAppDispatch, useAppSelector } from "./common";
import { useAppSlice } from "./selector";

export function useBalance() {
  const { updateFlag } = useAppSlice();
  const dispatch = useAppDispatch();

  const { balance, lsdBalance } = useAppSelector((state: RootState) => {
    return {
      balance: state.token.balance,
      lsdBalance: state.lsdToken.balance,
    };
  });

  useEffect(() => {
    if (updateFlag) {
      dispatch(updateLsdTokenBalance());
    }
  }, [dispatch, updateFlag]);

  return {
    balance,
    lsdBalance,
  };
}
