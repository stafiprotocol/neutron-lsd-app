import { atomicToHuman } from "@stafihub/apps-util";
import {
  queryAccountBalances,
  queryTokenizeShareRecords,
} from "@stafihub/apps-wallet";
import { Coin } from "@stafihub/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSlice } from "./selector";
import { useDebouncedEffect } from "./useDebouncedEffect";
import { useCosmosChainAccount } from "./useCosmosChainAccount";
import { lsdTokenChainConfig } from "config/chain";
import { getNeutronPoolInfo } from "utils/cosmosUtils";
import { LsmBalanceItem } from "interfaces/common";
import { useMinimalStake } from "./useMinimalStake";

export function useLsmBalance() {
  const { updateFlag } = useAppSlice();
  const chainAccount = useCosmosChainAccount(lsdTokenChainConfig.chainId);

  const [lsmBalances, setLsmBalances] = useState<LsmBalanceItem[]>([]);
  const minimalStake = useMinimalStake();

  const updateData = useCallback(async () => {
    if (!updateFlag || !chainAccount?.bech32Address) {
      return;
    }

    const result = await queryTokenizeShareRecords(
      lsdTokenChainConfig,
      chainAccount?.bech32Address || ""
    );

    const userBalances = await queryAccountBalances(
      lsdTokenChainConfig,
      chainAccount?.bech32Address
    );

    const poolInfo = await getNeutronPoolInfo();

    const newLsmBalances: LsmBalanceItem[] = [];

    result?.records.forEach((item) => {
      const tokenizeShareDenom = `${item.validator}/${item.id.toString()}`;
      const tokenizeShareBalance = userBalances.find((item) => {
        return item.denom === tokenizeShareDenom;
      });
      if (
        tokenizeShareBalance &&
        Number(atomicToHuman(tokenizeShareBalance.amount)) >=
          Number(minimalStake) / 2
      ) {
        newLsmBalances.push({
          validatorAddr: item.validator,
          recordId: item.id.toString(),
          balance: tokenizeShareBalance,
        });
      }
    });

    newLsmBalances.sort((item1, item2) => {
      return Number(item2.balance.amount) - Number(item1.balance.amount);
    });

    // console.log({ result });
    setLsmBalances(newLsmBalances);
  }, [chainAccount?.bech32Address, minimalStake, updateFlag]);

  useDebouncedEffect(
    () => {
      updateData();
    },
    [updateData],
    1500
  );

  return { lsmBalances };
}
