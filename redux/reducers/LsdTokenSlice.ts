import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppThunk } from "redux/store";
import {
  decodeBalancesUpdatedLog,
  getErc20AssetBalance,
  getWeb3,
} from "utils/web3Utils";
import {
  getLsdTokenContract,
  getLsdTokenContractAbi,
  getStakeManagerContract,
  getStakeManagerContractAbi,
} from "config/contract";
import { getDefaultApr, getTokenDecimals } from "utils/configUtils";

export interface LsdTokenState {
  balance: string | undefined; // balance of lsdToken
  rate: string | undefined; // rate of lsdToken to Token
  apr: number | undefined; // lsdToken apr
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
    setApr: (state: LsdTokenState, action: PayloadAction<number>) => {
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
      const metaMaskAccount = getState().wallet.metaMaskDisconnected
        ? undefined
        : getState().wallet.metaMaskAccount;

      const tokenAbi = getLsdTokenContractAbi();
      const tokenAddress = getLsdTokenContract();
      const newBalance = await getErc20AssetBalance(
        metaMaskAccount,
        tokenAbi,
        tokenAddress
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

      const web3 = getWeb3();
      let contract = new web3.eth.Contract(
        getStakeManagerContractAbi(),
        getStakeManagerContract()
      );
      const result = await contract.methods.getRate().call();
      newRate = web3.utils.fromWei(result + "", "ether");

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
    const web3 = getWeb3();
    const contract = new web3.eth.Contract(
      getStakeManagerContractAbi(),
      getStakeManagerContract()
    );

    const eraSeconds = await contract.methods.eraSeconds().call();
    if (!eraSeconds) return;
    const currentEra = await contract.methods.currentEra().call();
    if (!currentEra) return;

    // 7 days before
    const numEras = (60 * 60 * 24 * 7) / Number(eraSeconds);

    const beginRate = await contract.methods
      .eraRate(currentEra - numEras)
      .call();
    const endRate = await contract.methods.getRate().call();

    if (
      !isNaN(beginRate) &&
      !isNaN(endRate) &&
      endRate !== 1 &&
      beginRate !== 1 &&
      beginRate !== endRate
    ) {
      apr =
        (((endRate - beginRate) / 7) * 365.25 * 100) /
        Math.pow(10, getTokenDecimals());
    }

    dispatch(setApr(apr));
  } catch (err: any) {
    dispatch(setApr(apr));
  }
};

/**
 * query unbonding duration from stake manager contract
 */
export const updateLsdTokenUnbondingDuration =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const web3 = getWeb3();
      const stakeManagerContract = new web3.eth.Contract(
        getStakeManagerContractAbi(),
        getStakeManagerContract()
      );

      const unbondingDuration = await stakeManagerContract.methods
        .unbondingDuration()
        .call();
      const eraSeconds = await stakeManagerContract.methods.eraSeconds().call();
      if (!eraSeconds) return;

      dispatch(
        setUnbondingDuration(Number(unbondingDuration) * Number(eraSeconds))
      );
    } catch (err: any) {
      console.log(err);
    }
  };
