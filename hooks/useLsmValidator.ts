import { humanToAtomicNew } from "@stafihub/apps-util";
import {
  queryStakingParams,
  queryStakingValidator,
} from "@stafihub/apps-wallet";
import {
  QueryStakingParamsResponse,
  QueryStakingValidatorResponse,
} from "@stafihub/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getNeutronPoolInfo } from "utils/cosmosUtils";
import { useAppSlice } from "./selector";
import { lsdTokenChainConfig } from "config/chain";
import { useDebouncedEffect } from "./useDebouncedEffect";

export function useLsmValidator(stakeAmount: string) {
  const { updateFlag } = useAppSlice();

  const [validValidators, setValidValidators] = useState<string[]>([]);
  const [selectedValidatorAddr, setSelectedValidatorAddr] = useState<string>();
  const [noValidValidator, setNoValidValidator] = useState(false);
  const [stakingParamsResponse, setStakingParamsResponse] =
    useState<QueryStakingParamsResponse | null>();
  const [validatorDetailResponses, setValidatorDetailResponses] = useState<
    (QueryStakingValidatorResponse | null)[]
  >([]);

  const updateValidatorData = useCallback(async () => {
    if (!updateFlag) {
      return;
    }

    const poolInfo = await getNeutronPoolInfo();
    const rValidatorList = poolInfo?.validator_addrs || [];
    // console.log(poolInfo?.validator_addrs);

    const reqs = rValidatorList.map((validatorAddr) => {
      return (async () => {
        const validatorResponse = await queryStakingValidator(
          lsdTokenChainConfig,
          validatorAddr
        );
        return validatorResponse;
      })();
    });
    const validatorDetails = await Promise.all(reqs);
    setValidatorDetailResponses(validatorDetails);

    const stakingParamsResult = await queryStakingParams(lsdTokenChainConfig);
    setStakingParamsResponse(stakingParamsResult);
  }, [updateFlag]);

  const handleInputChange = useCallback(async () => {
    if (!stakeAmount) {
      setNoValidValidator(false);
      return;
    }

    const tempValidValidators: string[] = [];

    validatorDetailResponses.forEach((response) => {
      const validator = response?.validator;

      if (validator) {
        const bondFactor =
          Number(stakingParamsResponse?.params?.validatorBondFactor) /
          Number("1000000000000000000");
        const validatorLiquidStakingCap =
          Number(stakingParamsResponse?.params?.validatorLiquidStakingCap) /
          Number("1000000000000000000");
        const liquidShares =
          Number(validator.liquidShares) / Number("1000000000000000000");
        const delegatorShares =
          Number(validator.delegatorShares) / Number("1000000000000000000");
        const liquidvalidatorBondSharesShares =
          Number(validator.validatorBondShares) / Number("1000000000000000000");

        const liquidStakePercent =
          (liquidShares + Number(humanToAtomicNew(stakeAmount))) /
          (delegatorShares + Number(humanToAtomicNew(stakeAmount)));

        if (liquidStakePercent > validatorLiquidStakingCap) {
          return;
        }

        if (bondFactor === -1) {
          tempValidValidators.push(validator.operatorAddress);
        } else {
          if (
            liquidShares + Number(humanToAtomicNew(stakeAmount)) <=
            liquidvalidatorBondSharesShares * bondFactor
          ) {
            tempValidValidators.push(validator.operatorAddress);
          }
        }
      }
    });

    // console.log({ tempValidValidators });

    setValidValidators(tempValidValidators);
    setNoValidValidator(tempValidValidators.length === 0);

    if (tempValidValidators.length > 0) {
      const randomElement =
        tempValidValidators[
          Math.floor(Math.random() * tempValidValidators.length)
        ];
      setSelectedValidatorAddr(randomElement);
    } else {
      setSelectedValidatorAddr(undefined);
    }
  }, [stakeAmount, stakingParamsResponse, validatorDetailResponses]);

  useDebouncedEffect(
    () => {
      updateValidatorData();
    },
    [updateValidatorData],
    1500
  );

  useDebouncedEffect(
    () => {
      handleInputChange();
    },
    [handleInputChange],
    500
  );

  return { noValidValidator, selectedValidatorAddr, validValidators };
}
