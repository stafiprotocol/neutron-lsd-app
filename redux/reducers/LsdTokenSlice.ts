import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StakeManager } from "codegen/neutron";
import { neutronChainConfig } from "config/chain";
import { getPoolAddress, getStakeManagerContract } from "config/contract";
import { AppThunk } from "redux/store";
import { getDefaultApr } from "utils/configUtils";
import {
  getNeutronLsdTokenBalance,
  getNeutronPoolInfo,
  getNeutronWasmClient,
  getStakeManagerClient,
} from "utils/cosmosUtils";
import { chainAmountToHuman } from "utils/numberUtils";

export interface LsdTokenState {
  balance: string | undefined; // balance of lsdToken
  rate: string | undefined; // rate of lsdToken to Token
  apr: string | undefined; // lsdToken apr
  price: string | undefined; // price of lsdToken
  unbondingDuration: number | undefined;
  lsdTokenPrice: number | undefined;
}

const initialState: LsdTokenState = {
  balance: undefined,
  rate: undefined,
  apr: undefined,
  price: undefined,
  unbondingDuration: undefined,
  lsdTokenPrice: undefined,
};

export const lsdTokenSlice = createSlice({
  name: "lsdToken",
  initialState,
  reducers: {
    setBalance: (
      state: LsdTokenState,
      action: PayloadAction<string | undefined>
    ) => {
      state.balance = action.payload;
    },
    setRate: (state: LsdTokenState, action: PayloadAction<string>) => {
      state.rate = action.payload;
    },
    setPrice: (state: LsdTokenState, action: PayloadAction<string>) => {
      state.price = action.payload;
    },
    setApr: (state: LsdTokenState, action: PayloadAction<string>) => {
      state.apr = action.payload;
    },
    setUnbondingDuration: (
      state: LsdTokenState,
      action: PayloadAction<number>
    ) => {
      state.unbondingDuration = action.payload;
    },
    setLsdTokenPrice: (state: LsdTokenState, aciton: PayloadAction<number>) => {
      state.lsdTokenPrice = aciton.payload;
    },
  },
});

export const {
  setBalance,
  setRate,
  setPrice,
  setApr,
  setUnbondingDuration,
  setLsdTokenPrice,
} = lsdTokenSlice.actions;

export default lsdTokenSlice.reducer;

export const clearLsdTokenBalance =
  (): AppThunk => async (dispatch, getState) => {
    dispatch(setBalance(undefined));
  };

/**
 * update lsdToken balance
 */
export const updateLsdTokenBalance =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const neutronAccount =
        getState().wallet.cosmosAccounts[neutronChainConfig.chainId];

      const newBalance = await getNeutronLsdTokenBalance(
        neutronAccount?.bech32Address
      );
      dispatch(setBalance(newBalance));
    } catch (err: unknown) {}
  };

/**
 * query lsdToken to token's rate
 */
export const updateLsdTokenRate =
  (): AppThunk => async (dispatch, getState) => {
    try {
      let newRate = "--";

      const poolInfo = await getNeutronPoolInfo();
      newRate = chainAmountToHuman(poolInfo?.rate);

      dispatch(setRate(newRate));
    } catch (err: unknown) {
      console.log(err);
    }
  };

/**
 * query apr of lsdToken
 */
export const updateApr = (): AppThunk => async (dispatch, getState) => {
  let apr = getDefaultApr();
  try {
    const poolInfo = await getNeutronPoolInfo();
    if (!poolInfo) {
      return;
    }

    const eraSeconds = poolInfo.era_seconds;
    const currentEra = poolInfo.era;

    // 7 days before
    const numEras = (60 * 60 * 24 * 7) / Number(eraSeconds);

    const stakeManagerClient = await getStakeManagerClient();

    const beginEra = Math.max(0, currentEra - numEras);

    // console.log({ beginEra });
    // console.log({ currentEra });
    const beginRateRes = await stakeManagerClient.queryEraRate({
      pool_addr: getPoolAddress(),
      era: beginEra,
    });

    const endRateRes = await stakeManagerClient.queryEraRate({
      pool_addr: getPoolAddress(),
      era: currentEra,
    });

    // console.log({ beginRateRes });
    // console.log({ endRateRes });

    const beginRate = Number(beginRateRes);
    const endRate = Number(endRateRes);

    if (
      !isNaN(beginRate) &&
      !isNaN(endRate) &&
      endRate !== 1 &&
      beginRate !== 1 &&
      beginRate !== endRate
    ) {
      apr = chainAmountToHuman(((endRate - beginRate) / 7) * 365.25 * 100);
    }

    dispatch(setApr(apr || ""));
  } catch (err: any) {
    console.error({ err });
    dispatch(setApr(apr || ""));
  }
};

/**
 * query unbonding duration from stake manager contract
 */
export const updateLsdTokenUnbondingDuration =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const stakeManagerClient = await getStakeManagerClient();
      const poolInfo = await stakeManagerClient.queryPoolInfo({
        pool_addr: getPoolAddress(),
      });

      // console.log({ poolInfo });
      const unbondingSeconds = poolInfo.unbonding_period * poolInfo.era_seconds;
      // console.log({ unbondingSeconds });
      dispatch(setUnbondingDuration(unbondingSeconds));
    } catch (err: any) {
      console.log(err);
    }
  };
