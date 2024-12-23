import { useAppSelector } from "./common";
import { useMemo } from "react";

export function useCosmosChainAccount(chainId: string | undefined) {
  const { cosmosAccounts } = useAppSelector((state) => state.wallet);

  const account = useMemo(() => {
    if (!chainId) return null;
    return cosmosAccounts[chainId];
  }, [chainId, cosmosAccounts]);

  return account;
}
