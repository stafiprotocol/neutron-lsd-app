import { useEffect, useMemo } from "react";
import { updateLsdTokenBalance } from "redux/reducers/LsdTokenSlice";
import { RootState } from "redux/store";
import { useAppDispatch, useAppSelector } from "./common";
import { useAppSlice } from "./selector";
import { useCosmosChainAccount } from "./useCosmosChainAccount";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { getTokenBalance } from "utils/cosmosUtils";
import { chainAmountToHuman } from "utils/numberUtils";

export function useBalance() {
  const { updateFlag } = useAppSlice();
  const dispatch = useAppDispatch();
  const neutronAccount = useCosmosChainAccount(neutronChainConfig.chainId);
  const lsdTokenAccount = useCosmosChainAccount(lsdTokenChainConfig.chainId);

  const balance = useMemo(() => {
    const tokenBalance = getTokenBalance(
      lsdTokenAccount?.allBalances,
      lsdTokenChainConfig.denom
    );
    return chainAmountToHuman(tokenBalance, lsdTokenChainConfig.decimals);
  }, [lsdTokenAccount]);

  const { lsdBalance } = useAppSelector((state: RootState) => {
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
