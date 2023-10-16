import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getLsdTokenContract,
  getLsdTokenContractAbi,
  getStakeManagerContract,
  getStakeManagerContractAbi,
} from "config/contract";
import { getExplorerTxUrl } from "config/explorer";
import { AppThunk } from "redux/store";
import { isMetaMaskCancelError, timeout, uuid } from "utils/commonUtils";
import {
  BLOCK_HASH_NOT_FOUND_MESSAGE,
  CANCELLED_MESSAGE,
  CONNECTION_ERROR_MESSAGE,
  LOADING_MESSAGE_UNSTAKING,
  LOADING_MESSAGE_WITHDRAWING,
  TRANSACTION_FAILED_MESSAGE,
} from "constants/common";
import { LocalNotice } from "utils/noticeUtils";
import { formatNumber, stakeAmountToBn } from "utils/numberUtils";
import snackbarUtil from "utils/snackbarUtils";
import {
  createWeb3,
  fetchTransactionReceipt,
  getMetaMaskTxErrorMsg,
  getWeb3,
} from "utils/web3Utils";
import Web3 from "web3";
import {
  addNotice,
  setStakeLoadingParams,
  setUnstakeLoadingParams,
  setStakeLoading,
  setUnstakeLoading,
  setWithdrawLoading,
  setWithdrawLoadingParams,
  updateStakeLoadingParams,
  updateWithdrawLoadingParams,
  updateUnstakeLoadingParams,
} from "./AppSlice";
import { getLsdTokenName, getTokenName } from "utils/configUtils";
import BN from "bn.js";
import { fromWei, toWei } from "web3-utils";
import { viemClient } from "connectors/walletConnect";
import { parseEther } from "viem";

export interface WithdrawInfo {
  overallAmount: string | undefined;
  avaiableWithdraw: string | undefined;
  remainingTime: number | undefined;
}

export interface RelayFee {
  stake: string | undefined;
  unstake: string | undefined;
  withdraw: string | undefined;
}

export interface TokenState {
  balance: string | undefined;
  currentNodeDepositAmount: string | undefined;
  latestBlockTimestamp: string;
  withdrawInfo: WithdrawInfo;
  relayFee: RelayFee;
  tokenPrice: number | undefined;
}

const initialState: TokenState = {
  balance: undefined,
  currentNodeDepositAmount: undefined,
  latestBlockTimestamp: "0",
  withdrawInfo: {
    overallAmount: undefined,
    avaiableWithdraw: undefined,
    remainingTime: undefined,
  },
  relayFee: {
    stake: undefined,
    unstake: undefined,
    withdraw: undefined,
  },
  tokenPrice: undefined,
};

export const tokenSlice = createSlice({
  name: "token",
  initialState,
  reducers: {
    setTokenBalance: (
      state: TokenState,
      action: PayloadAction<string | undefined>
    ) => {
      state.balance = action.payload;
    },
    setCurrentNodeDepositAmount: (
      state: TokenState,
      action: PayloadAction<string>
    ) => {
      state.currentNodeDepositAmount = action.payload;
    },
    setLatestBlockTimestamp: (
      state: TokenState,
      action: PayloadAction<string>
    ) => {
      state.latestBlockTimestamp = action.payload;
    },
    setWithdrawInfo: (
      state: TokenState,
      action: PayloadAction<WithdrawInfo>
    ) => {
      state.withdrawInfo = action.payload;
    },
    setRelayFee: (state: TokenState, action: PayloadAction<RelayFee>) => {
      state.relayFee = action.payload;
    },
    setTokenPrice: (state: TokenState, action: PayloadAction<number>) => {
      state.tokenPrice = action.payload;
    },
  },
});

export const {
  setTokenBalance,
  setCurrentNodeDepositAmount,
  setLatestBlockTimestamp,
  setWithdrawInfo,
  setRelayFee,
  setTokenPrice,
} = tokenSlice.actions;

export default tokenSlice.reducer;

/**
 * update evm token balance
 */
export const updateTokenBalance =
  (): AppThunk => async (dispatch, getState) => {
    const metaMaskAccount = getState().wallet.metaMaskAccount;
    if (!metaMaskAccount) {
      dispatch(setTokenBalance(undefined));
      return;
    }

    let web3 = getWeb3();
    try {
      const balance = await web3.eth.getBalance(metaMaskAccount);
      dispatch(
        setTokenBalance(Web3.utils.fromWei(balance.toString(), "ether"))
      );
    } catch (err: unknown) {}
  };

/**
 * stake token
 * @param stakeAmount stake token amount
 * @param willReceiveAmount will receive lsdToken amount
 * @param newLsdTokenBalance new lsdToken balance after staking
 * @param relayFee stake relay fee
 * @param isReTry is retry staking
 * @param cb callback function
 */
export const handleTokenStake =
  (
    writeAsync: any,
    stakeAmount: string,
    willReceiveAmount: string,
    newLsdTokenBalance: string,
    relayFee: string,
    isReTry: boolean,
    cb?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    if (!writeAsync) return;

    const metaMaskAccount = getState().wallet.metaMaskAccount;
    if (!metaMaskAccount) return;

    const noticeUuid = isReTry
      ? getState().app.stakeLoadingParams?.noticeUuid
      : uuid();
    try {
      dispatch(setStakeLoading(true));
      dispatch(
        setStakeLoadingParams({
          modalVisible: true,
          noticeUuid,
          status: "loading",
          amount: Number(stakeAmount) + "",
          willReceiveAmount,
          newLsdTokenBalance,
          relayFee,
          customMsg: `Please confirm the ${stakeAmount} ${getTokenName()} staking transaction in your MetaMask wallet`,
        })
      );

      // const web3 = getWeb3();

      const msgValue = stakeAmountToBn(stakeAmount).add(
        stakeAmountToBn(relayFee)
      );
      const amount = toWei(stakeAmount, "ether");

      // let contract = new web3.eth.Contract(
      //   getStakeManagerContractAbi(),
      //   getStakeManagerContract(),
      //   {
      //     from: metaMaskAccount,
      //   }
      // );

      // const result = await contract.methods
      //   .stake(amount)
      //   .send({ value: msgValue.toString() });

      const result = await writeAsync({
        function: "stake",
        args: [amount],
        from: metaMaskAccount,
        value: msgValue.toString(),
      });
      // @ts-ignore
      const txReceipt = await fetchTransactionReceipt(viemClient, result.hash);

      if (
        !txReceipt ||
        txReceipt.status !== "success" ||
        !txReceipt.blockHash
      ) {
        throw new Error(getMetaMaskTxErrorMsg(txReceipt));
      }

      const blockHash = txReceipt.blockHash;
      if (!blockHash) {
        throw new Error(BLOCK_HASH_NOT_FOUND_MESSAGE);
      }

      const txHash = txReceipt.transactionHash;
      dispatch(
        updateStakeLoadingParams(
          {
            status: "success",
            txHash: txHash,
            scanUrl: getExplorerTxUrl(txHash),
            customMsg: undefined,
          },
          (newParams) => {
            const newNotice: LocalNotice = {
              id: noticeUuid || uuid(),
              type: "Stake",
              txDetail: { transactionHash: txHash, sender: metaMaskAccount },
              data: {
                amount: Number(stakeAmount) + "",
                willReceiveAmount: Number(willReceiveAmount) + "",
              },
              scanUrl: getExplorerTxUrl(txHash),
              status: "Confirmed",
              stakeLoadingParams: newParams,
            };
            dispatch(addNotice(newNotice));
          }
        )
      );
      dispatch(setStakeLoading(false));
      cb && cb(true);
    } catch (err: any) {
      cb && cb(false);
      dispatch(setStakeLoading(false));
      let displayMsg = TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = CONNECTION_ERROR_MESSAGE;
      } else if (isMetaMaskCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setStakeLoadingParams(undefined));
        return;
      }
      dispatch(
        updateStakeLoadingParams(
          {
            status: "error",
            displayMsg: displayMsg,
          },
          (newParams) => {
            dispatch(
              addNotice({
                id: noticeUuid || uuid(),
                type: "Stake",
                data: {
                  amount: Number(stakeAmount) + "",
                  willReceiveAmount: Number(willReceiveAmount) + "",
                },
                status: "Error",
                stakeLoadingParams: newParams,
              })
            );
          }
        )
      );
    } finally {
      dispatch(updateTokenBalance());
    }
  };

/**
 * unstake lsdToken
 * @param unstakeAmount unstake lsdToken amount
 * @param willReceiveAmount will receive token amount
 * @param newLsdTokenBalance new lsdToken balance after unstaking
 * @param isReTry is retry unstaking
 * @param cb callback function
 */
export const handleLsdTokenUnstake =
  (
    approveWriteAsync: any,
    unstakeWriteAsync: any,
    unstakeAmount: string,
    willReceiveAmount: string,
    newLsdTokenBalance: string,
    relayFee: string,
    isReTry: boolean,
    cb?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    if (!approveWriteAsync || !unstakeWriteAsync) {
      return;
    }

    const metaMaskAccount = getState().wallet.metaMaskAccount;
    if (!metaMaskAccount) return;

    const noticeUuid = isReTry
      ? getState().app.unstakeLoadingParams?.noticeUuid
      : uuid();

    dispatch(setUnstakeLoading(true));

    try {
      // const web3 = createWeb3();
      dispatch(
        setUnstakeLoadingParams({
          modalVisible: true,
          status: "loading",
          targetAddress: metaMaskAccount,
          amount: unstakeAmount,
          willReceiveAmount,
          newLsdTokenBalance,
          relayFee,
        })
      );

      const stakeManagerContractAddr = getStakeManagerContract();
      // const lsdTokenContract = new web3.eth.Contract(
      //   getLsdTokenContractAbi(),
      //   getLsdTokenContract(),
      //   {
      //     from: metaMaskAccount,
      //   }
      // );
      const allowanceResult = await viemClient.readContract({
        address: getLsdTokenContract() as `0x${string}`,
        abi: getLsdTokenContractAbi(),
        functionName: "allowance",
        args: [metaMaskAccount, stakeManagerContractAddr],
      });

      // const allowanceResult = await lsdTokenContract.methods
      //   .allowance(metaMaskAccount, stakeManagerContractAddr)
      //   .call();
      // let allowance = web3.utils.fromWei(allowanceResult);
      let allowance = fromWei(allowanceResult + "");

      // const contract = new web3.eth.Contract(
      //   getStakeManagerContractAbi(),
      //   stakeManagerContractAddr,
      //   {
      //     from: metaMaskAccount,
      //   }
      // );

      if (Number(allowance) < Number(unstakeAmount)) {
        allowance = toWei("1000000");
        // const approveResult = await lsdTokenContract.methods
        //   .approve(stakeManagerContractAddr, allowance)
        //   .send({ from: metaMaskAccount });
        // if (!approveResult || !approveResult.status) {
        //   //
        // }
        const approveResult = await approveWriteAsync({
          args: [stakeManagerContractAddr, allowance],
          from: metaMaskAccount,
        });
        const approveTxReceipt = await fetchTransactionReceipt(
          // @ts-ignore
          viemClient,
          approveResult.hash
        );

        if (!approveTxReceipt || approveTxReceipt.status !== "success") {
          throw new Error(getMetaMaskTxErrorMsg(approveTxReceipt));
        }
        await timeout(5000);
      }

      const amount = toWei(unstakeAmount, "ether");
      const msgValue = stakeAmountToBn(relayFee);
      // const unstakeResult = await contract.methods
      //   .unstake(amount)
      //   .send({ value: msgValue.toString(), gas: "0x54647" });
      const unstakeResult = await unstakeWriteAsync({
        args: [amount],
        from: metaMaskAccount,
        value: parseEther(relayFee as `${number}`, "wei"),
        gas: Number("0x54647"),
      });
      const unstakeTxReceipt = await fetchTransactionReceipt(
        // @ts-ignore
        viemClient,
        unstakeResult.hash
      );

      if (
        !unstakeTxReceipt ||
        unstakeTxReceipt.status !== "success" ||
        !unstakeTxReceipt.blockHash
      ) {
        throw new Error(getMetaMaskTxErrorMsg(unstakeTxReceipt));
      }

      const blockHash = unstakeTxReceipt.blockHash;
      if (!blockHash) {
        throw new Error(BLOCK_HASH_NOT_FOUND_MESSAGE);
      }

      const txHash = unstakeTxReceipt.transactionHash;
      dispatch(
        updateUnstakeLoadingParams({
          status: "success",
          txHash: txHash,
          scanUrl: getExplorerTxUrl(txHash),
        })
      );
      const newNotice: LocalNotice = {
        id: noticeUuid || uuid(),
        type: "Unstake",
        txDetail: { transactionHash: txHash, sender: metaMaskAccount },
        data: {
          amount: Number(unstakeAmount) + "",
          willReceiveAmount: Number(willReceiveAmount) + "",
        },
        scanUrl: getExplorerTxUrl(unstakeResult.transactionHash),
        status: "Confirmed",
      };
      dispatch(addNotice(newNotice));
      dispatch(setUnstakeLoading(false));
    } catch (err: any) {
      dispatch(setUnstakeLoading(false));
      // snackbarUtil.error(err.message);
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = CONNECTION_ERROR_MESSAGE;
      } else if (isMetaMaskCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setUnstakeLoadingParams(undefined));
        return;
      }
      dispatch(
        updateUnstakeLoadingParams({
          status: "error",
          customMsg: displayMsg || "Unstake failed",
        })
      );
    } finally {
      dispatch(updateTokenBalance());
    }
  };

interface LsdTokenUnstakeInfo {
  amount: string;
  era: string;
}

/**
 * update user withdraw info
 */
export const updateLsdTokenUserWithdrawInfo =
  (): AppThunk => async (dispatch, getState) => {
    const metaMaskAccount = getState().wallet.metaMaskAccount;
    if (!metaMaskAccount) return;

    const unbondingDuration = getState().lsdToken.unbondingDuration;
    if (!unbondingDuration) {
      return;
    }

    try {
      const web3 = getWeb3();
      const stakeManagerContract = new web3.eth.Contract(
        getStakeManagerContractAbi(),
        getStakeManagerContract(),
        { from: metaMaskAccount }
      );

      const eraSeconds = await stakeManagerContract.methods.eraSeconds().call();

      const unstakeIndexList = await stakeManagerContract.methods
        .getUnstakeIndexListOf(metaMaskAccount)
        .call();
      // console.log(unstakeIndexList);
      if (!Array.isArray(unstakeIndexList)) {
        // console.log("unstake index list error");
        return;
      }
      let avaiableWithdrawAmount: BN = new BN(0);
      let overallWithdrawAmount: BN = new BN(0);

      const currentEra = await stakeManagerContract.methods.currentEra().call();
      let remainingEra = 0;

      for (let i = 0; i < unstakeIndexList.length; i++) {
        const unstakeInfo: LsdTokenUnstakeInfo =
          await stakeManagerContract.methods
            .unstakeAtIndex(unstakeIndexList[i])
            .call();
        overallWithdrawAmount = overallWithdrawAmount.add(
          web3.utils.toBN(unstakeInfo.amount)
        );
        // console.log(unstakeInfo.era, unbondingDuration, currentEra);
        if (
          Number(unstakeInfo.era) +
            Number(unbondingDuration) / Number(eraSeconds) >
          Number(currentEra)
        ) {
          remainingEra = Math.max(
            remainingEra,
            Number(unstakeInfo.era) +
              Number(unbondingDuration) / Number(eraSeconds) -
              Number(currentEra)
          );
          continue;
        }
        avaiableWithdrawAmount = avaiableWithdrawAmount.add(
          web3.utils.toBN(unstakeInfo.amount)
        );
      }

      dispatch(
        setWithdrawInfo({
          avaiableWithdraw: web3.utils.fromWei(avaiableWithdrawAmount),
          overallAmount: web3.utils.fromWei(overallWithdrawAmount),
          remainingTime: remainingEra * Number(eraSeconds) * 1000,
        })
      );
    } catch (err: any) {}
  };

/**
 * withdraw unstaked token
 * @param relayFee withdraw relay fee
 * @param amount withdraw amount
 */
export const handleTokenWithdraw =
  (writeAsync: any, relayFee: string, amount: string): AppThunk =>
  async (dispatch, getState) => {
    if (!writeAsync) return;
    const metaMaskAccount = getState().wallet.metaMaskAccount;
    if (!metaMaskAccount) {
      return;
    }

    try {
      dispatch(setWithdrawLoading(true));
      dispatch(
        setWithdrawLoadingParams({
          modalVisible: true,
          status: "loading",
          tokenAmount: amount,
          relayFee,
        })
      );

      // const web3 = createWeb3();
      // const contract = new web3.eth.Contract(
      //   getStakeManagerContractAbi(),
      //   getStakeManagerContract(),
      //   {
      //     from: metaMaskAccount,
      //   }
      // );
      const withdrawResult = await writeAsync({
        args: [],
        from: metaMaskAccount,
        value: parseEther(relayFee as `${number}`, "wei"),
      });
      const withdrawTxReceipt = await fetchTransactionReceipt(
        // @ts-ignore
        viemClient,
        withdrawResult.hash
      );

      if (
        !withdrawTxReceipt ||
        withdrawTxReceipt.status !== "success" ||
        !withdrawTxReceipt.blockHash
      ) {
        throw new Error(getMetaMaskTxErrorMsg(withdrawTxReceipt));
      }

      // const result = await contract.methods
      //   .withdraw(claimableWithdrawals)
      //   .send();

      // cb && cb(result.status, result);

      const blockHash = withdrawTxReceipt.blockHash;
      if (!blockHash) {
        throw new Error(BLOCK_HASH_NOT_FOUND_MESSAGE);
      }

      const txHash = withdrawTxReceipt.transactionHash;
      dispatch(
        updateWithdrawLoadingParams(
          {
            status: "success",
            broadcastStatus: "success",
            packStatus: "success",
            finalizeStatus: "success",
            txHash: txHash,
            scanUrl: getExplorerTxUrl(txHash),
            customMsg: undefined,
          },
          (newParams) => {
            dispatch(
              addNotice({
                id: uuid(),
                type: "Withdraw",
                data: {
                  tokenAmount: amount,
                },
                status: "Confirmed",
                scanUrl: getExplorerTxUrl(txHash),
              })
            );
          }
        )
      );
      dispatch(setWithdrawLoading(false));
    } catch (err: any) {
      dispatch(setWithdrawLoading(false));
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (err.code === -32603) {
        displayMsg = CONNECTION_ERROR_MESSAGE;
      } else if (isMetaMaskCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setWithdrawLoadingParams(undefined));
        return;
      }
      dispatch(
        updateWithdrawLoadingParams({
          status: "error",
          customMsg: displayMsg || "Unstake failed",
        })
      );
    } finally {
      dispatch(updateTokenBalance());
    }
  };

/**
 * query staking relay fee from stake manager contract
 */
export const updateStakeRelayFee =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const web3 = getWeb3();
      const stakeManagerContract = new web3.eth.Contract(
        getStakeManagerContractAbi(),
        getStakeManagerContract()
      );
      let feeResult = await stakeManagerContract.methods
        .getStakeRelayerFee()
        .call();
      feeResult = feeResult || "0";
      const fee = web3.utils.fromWei(feeResult);
      const relayFee = getState().token.relayFee;
      dispatch(
        setRelayFee({
          ...relayFee,
          stake: fee,
        })
      );
    } catch (err: any) {}
  };

/**
 * query unstaking relay fee from stake manager contract
 */
export const updateUnstakeRelayFee =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const web3 = getWeb3();
      const stakeManagerContract = new web3.eth.Contract(
        getStakeManagerContractAbi(),
        getStakeManagerContract()
      );
      let feeResult = await stakeManagerContract.methods
        .getUnstakeRelayerFee()
        .call();
      feeResult = feeResult || "0";
      const fee = web3.utils.fromWei(feeResult);
      // console.log({ fee });
      const relayFee = getState().token.relayFee;
      dispatch(
        setRelayFee({
          ...relayFee,
          unstake: fee,
        })
      );
    } catch (err: any) {}
  };

/**
 * query withdraw relay fee from stake manager contract
 */
export const updateWithdrawRelayFee =
  (): AppThunk => async (dispatch, getState) => {
    try {
      const web3 = getWeb3();
      const stakeManagerContract = new web3.eth.Contract(
        getStakeManagerContractAbi(),
        getStakeManagerContract()
      );
      let feeResult = await stakeManagerContract.methods
        .CROSS_DISTRIBUTE_RELAY_FEE()
        .call();
      feeResult = feeResult || "0";
      const fee = web3.utils.fromWei(feeResult);
      // console.log({ withdraw: fee });
      const relayFee = getState().token.relayFee;
      dispatch(
        setRelayFee({
          ...relayFee,
          withdraw: fee,
        })
      );
    } catch (err: any) {}
  };
