import { RootState } from "redux/store";
import { useAppSelector } from "./common";

export function useCosmosChainAccount(chainId: string) {
  const account = useAppSelector((state: RootState) => {
    if (!chainId) {
      return null;
    }
    return state.wallet.cosmosAccounts[chainId];
  });

  return account;
}
