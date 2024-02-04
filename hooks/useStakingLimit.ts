import {
  queryStakingParams,
  queryStakingPool,
  queryStakingTotalLiquidStaked,
} from "@stafihub/apps-wallet";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedEffect } from "./useDebouncedEffect";
import { lsdTokenChainConfig } from "config/chain";

export function useStakingLimit() {
  const [totalLiquidAmount, setTotalLiquidAmount] = useState<string>();
  const [totalStakeAmount, setTotalStakeAmount] = useState<string>();
  const [liquidStakingCap, setLiquidStakingCap] = useState<string>("1");

  useDebouncedEffect(
    () => {
      (async () => {
        const result = await queryStakingTotalLiquidStaked(lsdTokenChainConfig);
        setTotalLiquidAmount(result?.tokens);
      })();
    },
    [],
    1500
  );

  useDebouncedEffect(
    () => {
      (async () => {
        const result = await queryStakingPool(lsdTokenChainConfig);
        setTotalStakeAmount(result?.pool?.bondedTokens);
      })();
    },
    [],
    1500
  );

  useDebouncedEffect(
    () => {
      (async () => {
        const result = await queryStakingParams(lsdTokenChainConfig);

        setLiquidStakingCap(
          result?.params?.globalLiquidStakingCap
            ? Number(result?.params?.globalLiquidStakingCap) /
                Number("1000000000000000000") +
                ""
            : "1"
        );
      })();
    },
    [],
    1500
  );

  const exceedLimit = useMemo(() => {
    // console.log("xxx", totalStakeAmount, liquidStakingCap, totalLiquidAmount);
    return (
      Number(totalStakeAmount) * Number(liquidStakingCap) <=
      Number(totalLiquidAmount)
    );
  }, [totalLiquidAmount, totalStakeAmount, liquidStakingCap]);

  return { exceedLimit, liquidStakingCap };
}
