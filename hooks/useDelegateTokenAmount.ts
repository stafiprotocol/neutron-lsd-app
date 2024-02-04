import { atomicToHuman } from "@stafihub/apps-util";
import { queryDelegatorDelegations } from "@stafihub/apps-wallet";
import { DelegationResponse } from "@stafihub/types";
import { lsdTokenChainConfig } from "config/chain";
import { useState } from "react";
import { useAppSlice } from "./selector";
import { useCosmosChainAccount } from "./useCosmosChainAccount";
import { useDebouncedEffect } from "./useDebouncedEffect";

export function useDelegateTokenAmount() {
  const { updateFlag } = useAppSlice();
  const lsdTokenChainAccount = useCosmosChainAccount(
    lsdTokenChainConfig.chainId
  );
  const [delegateTokenBalance, setDelegateTokenBalance] = useState<string>();
  const [delegationList, setDelegationList] = useState<DelegationResponse[]>(
    []
  );

  useDebouncedEffect(
    () => {
      (async () => {
        if (!lsdTokenChainAccount?.bech32Address) {
          return;
        }
        const delegatorDelegationsResult = await queryDelegatorDelegations(
          lsdTokenChainConfig,
          lsdTokenChainAccount?.bech32Address
        );
        // console.log({ delegatorDelegationsResult });
        let total = 0;
        delegatorDelegationsResult?.delegationResponses.forEach((item) => {
          total += Number(item.balance?.amount);
        });
        // console.log({ total });
        setDelegateTokenBalance(atomicToHuman(total));
        setDelegationList(
          delegatorDelegationsResult?.delegationResponses || []
        );
      })();
    },
    [lsdTokenChainAccount, updateFlag],
    1500
  );

  return { delegateTokenBalance, delegationList };
}
