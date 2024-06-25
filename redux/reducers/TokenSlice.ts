import {
  ExecuteInstruction,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  getOfflineSigner,
  queryAccountBalances,
  sendIBCTransferTx,
} from "@stafihub/apps-wallet";
import { LsdToken, StakeManager } from "codegen/neutron";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { getPoolAddress, getStakeManagerContract } from "config/contract";
import { getExplorerTxUrl } from "config/explorer";
import {
  CANCELLED_MESSAGE,
  TRANSACTION_FAILED_MESSAGE,
} from "constants/common";
import { CosmosAccountMap } from "interfaces/common";
import { AppThunk } from "redux/store";
import { isKeplrCancelError, timeout, uuid } from "utils/commonUtils";
import { getTokenName } from "utils/configUtils";
import {
  getCosmosTxErrorMsg,
  getNeutronPoolInfo,
  getNeutronWasmClient,
  getNeutronWithdrawFeeAmount,
  getStakeManagerClient,
} from "utils/cosmosUtils";
import { LocalNotice } from "utils/noticeUtils";
import {
  amountToChain,
  chainAmountToHuman,
  formatNumber,
} from "utils/numberUtils";
import snackbarUtil from "utils/snackbarUtils";
import {
  addNotice,
  setStakeLoading,
  setStakeLoadingParams,
  setUnstakeLoading,
  setUnstakeLoadingParams,
  setWithdrawLoading,
  setWithdrawLoadingParams,
  updateStakeLoadingParams,
  updateUnstakeLoadingParams,
  updateWithdrawLoadingParams,
} from "./AppSlice";
import { updateCosmosAccounts } from "./WalletSlice";
import { Coin, PoolInfo } from "codegen/neutron/stakeManager";

export interface WithdrawInfo {
  overallAmount: string | undefined;
  avaiableWithdraw: string | undefined;
  remainingTime: number | undefined;
  neutronUnstakeIndexList?: number[];
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
  ntrnPrice: number | undefined;
  neutronPoolInfo: PoolInfo | undefined;
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
  ntrnPrice: undefined,
  neutronPoolInfo: undefined,
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
    setNtrnPrice: (state: TokenState, action: PayloadAction<number>) => {
      state.ntrnPrice = action.payload;
    },
    setNeutronPoolInfo: (
      state: TokenState,
      action: PayloadAction<PoolInfo | undefined>
    ) => {
      state.neutronPoolInfo = action.payload;
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
  setNtrnPrice,
  setNeutronPoolInfo,
} = tokenSlice.actions;

export default tokenSlice.reducer;

/**
 * update cosmos token balances
 */
export const updateCosmosTokenBalances =
  (): AppThunk => async (dispatch, getState) => {
    // console.log("updateCosmosTokenBalances");
    const chainConfigs = [neutronChainConfig, lsdTokenChainConfig];

    const requests = chainConfigs.map((chainConfig) => {
      return (async () => {
        try {
          const account = getState().wallet.cosmosAccounts[chainConfig.chainId];
          if (!account) {
            return;
          }
          const newAccount = { ...account };
          const userAddress = newAccount.bech32Address;

          const balances = await queryAccountBalances(chainConfig, userAddress);
          newAccount.allBalances = balances;

          // Prevent disconnect conflict.
          if (
            !getState().wallet.cosmosAccounts[chainConfig.chainId] ||
            getState().wallet.cosmosAccounts[chainConfig.chainId]
              ?.bech32Address !== userAddress
          ) {
            return;
          }
          return { network: chainConfig.chainId, account: newAccount };
        } catch (err: unknown) {
          // console.log(`updateTokenBalance ${chainId} error`, err);
          return null;
        }
      })();
    });

    const results = await Promise.all(requests);

    const accountsMap: CosmosAccountMap = {};
    results.forEach((result) => {
      if (result) {
        accountsMap[result.network] = result.account;
      }
    });
    dispatch(updateCosmosAccounts(accountsMap));
  };

/**
 * update user withdraw info
 */
export const updateLsdTokenUserWithdrawInfo =
  (): AppThunk => async (dispatch, getState) => {
    const neutronAccount =
      getState().wallet.cosmosAccounts[neutronChainConfig.chainId];
    if (!neutronAccount) {
      dispatch(
        setWithdrawInfo({
          overallAmount: undefined,
          avaiableWithdraw: undefined,
          remainingTime: undefined,
        })
      );
      return;
    }

    try {
      const stakeManagerClient = await getStakeManagerClient();

      const poolInfo = await stakeManagerClient.queryPoolInfo({
        pool_addr: getPoolAddress(),
      });

      const userUnstakeList = await stakeManagerClient.queryUserUnstake({
        pool_addr: getPoolAddress(),
        user_neutron_addr: neutronAccount.bech32Address,
      });

      // console.log({ userUnstakeList });

      // console.log({ poolInfo });
      // console.log({ rate });

      let overallAmount = 0;
      let withdrawableAmount = 0;
      let remainingUnlockEra = 0;
      const unstakeIndexList: number[] = [];
      userUnstakeList.forEach((item: any) => {
        const willReceiveTokenAmount = Number(item.amount);
        overallAmount += willReceiveTokenAmount;
        if (item.era + poolInfo.unbonding_period <= poolInfo.era) {
          withdrawableAmount += willReceiveTokenAmount;
          unstakeIndexList.push(item.index);
        } else {
          const itemRemainingUnlockEra =
            item.era + poolInfo.unbonding_period - poolInfo.era;
          if (remainingUnlockEra === 0) {
            remainingUnlockEra = itemRemainingUnlockEra;
          } else {
            remainingUnlockEra = Math.min(
              remainingUnlockEra,
              itemRemainingUnlockEra
            );
          }
        }
      });

      // console.log({ unstakeIndexList });

      dispatch(
        setWithdrawInfo({
          avaiableWithdraw: chainAmountToHuman(withdrawableAmount),
          overallAmount: chainAmountToHuman(overallAmount),
          remainingTime: remainingUnlockEra * poolInfo.era_seconds * 1000,
          neutronUnstakeIndexList: unstakeIndexList,
        })
      );
    } catch (err: any) {
      dispatch(
        setWithdrawInfo({
          overallAmount: undefined,
          avaiableWithdraw: undefined,
          remainingTime: undefined,
        })
      );
      console.log({ err });
    }
  };

/**
 * update user withdraw info
 */
export const updateNeutronPoolInfo =
  (): AppThunk => async (dispatch, getState) => {
    const poolInfo = await getNeutronPoolInfo();
    dispatch(setNeutronPoolInfo(poolInfo));
  };

/**
 * stake token
 * @param stakeAmount stake token amount
 * @param willReceiveAmount will receive lsdToken amount
 * @param newLsdTokenBalance new lsdToken balance after staking
 * @param isReTry is retry staking
 * @param cb callback function
 */
export const handleTokenStake =
  (
    stakeAmount: string,
    willReceiveAmount: string,
    isReTry: boolean,
    cb?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const sender =
      getState().wallet.cosmosAccounts[lsdTokenChainConfig.chainId];
    const neutronAccount =
      getState().wallet.cosmosAccounts[neutronChainConfig.chainId];
    if (!neutronAccount || !sender) {
      snackbarUtil.error("Please connect Chain Account first");
      return;
    }
    if (!lsdTokenChainConfig.stakeIbcChannel) {
      snackbarUtil.error("Please config Ibc channel");
      return;
    }

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
          newLsdTokenBalance: "",
          customMsg: `Please confirm the ${stakeAmount} ${getTokenName()} staking transaction in your wallet`,
        })
      );

      const poolInfo = await getNeutronPoolInfo();
      const lsdTokenContract = poolInfo?.lsd_token;
      if (!lsdTokenContract) {
        throw new Error("Lsd Token Contract Address not found");
      }

      const chainAmount = amountToChain(stakeAmount);

      const memo = JSON.stringify({
        wasm: {
          contract: getStakeManagerContract(),
          msg: {
            stake: {
              neutron_address: neutronAccount.bech32Address,
              pool_addr: getPoolAddress(),
            },
          },
        },
      });

      const cosmWasmClient = await getNeutronWasmClient();

      const lsdTokenClient = new LsdToken.Client(
        cosmWasmClient,
        lsdTokenContract
      );

      const userOldBalanceInChain = await lsdTokenClient.queryBalance({
        address: neutronAccount.bech32Address,
      });
      const oldLsdBalance = chainAmountToHuman(userOldBalanceInChain.balance);

      const response = await sendIBCTransferTx(
        lsdTokenChainConfig,
        sender.bech32Address,
        getStakeManagerContract(),
        chainAmount,
        "transfer",
        lsdTokenChainConfig.stakeIbcChannel,
        lsdTokenChainConfig.denom,
        memo,
        true
      );

      if (!response || response.code !== 0) {
        throw new Error(getCosmosTxErrorMsg(response));
      }

      let newLsdBalance;
      let count = 0;
      while (true) {
        await timeout(3000);
        count++;
        const userNewBalanceInChain = await lsdTokenClient.queryBalance({
          address: neutronAccount.bech32Address,
        });
        newLsdBalance = chainAmountToHuman(userNewBalanceInChain.balance);
        if (newLsdBalance > oldLsdBalance || count > 20) {
          break;
        }
      }

      const txHash = response.transactionHash;
      dispatch(
        updateStakeLoadingParams(
          {
            status: "success",
            txHash: txHash,
            scanUrl: getExplorerTxUrl(txHash, lsdTokenChainConfig.chainId),
            customMsg: undefined,
            newLsdTokenBalance: newLsdBalance,
          },
          (newParams) => {
            const newNotice: LocalNotice = {
              id: noticeUuid || uuid(),
              type: "Stake",
              txDetail: {
                transactionHash: txHash,
                sender: sender.bech32Address,
              },
              data: {
                amount: Number(stakeAmount) + "",
                willReceiveAmount: Number(willReceiveAmount) + "",
              },
              scanUrl: getExplorerTxUrl(txHash, lsdTokenChainConfig.chainId),
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
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (isKeplrCancelError(err)) {
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
      dispatch(updateCosmosTokenBalances());
    }
  };

/**
 * unstake lsdToken
 * @param unstakeAmount unstake lsdToken amount
 * @param willReceiveAmount will receive token amount
 * @param isReTry is retry unstaking
 * @param cb callback function
 */
export const handleLsdTokenUnstake =
  (
    unstakeAmount: string,
    receiver: string | undefined,
    willReceiveAmount: string,
    isReTry: boolean,
    cb?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const neutronAccount =
      getState().wallet.cosmosAccounts[neutronChainConfig.chainId];
    const offlineSigner = await getOfflineSigner(neutronChainConfig.chainId);

    if (!neutronAccount || !offlineSigner || !receiver) {
      snackbarUtil.error("Please connect wallet account first");
      dispatch(setStakeLoading(false));
      return;
    }

    dispatch(setUnstakeLoading(true));
    const noticeUuid = isReTry
      ? getState().app.unstakeLoadingParams?.noticeUuid
      : uuid();
    const amountInChain = amountToChain(unstakeAmount);

    try {
      dispatch(
        setUnstakeLoadingParams({
          modalVisible: true,
          status: "loading",
          targetAddress: receiver,
          amount: unstakeAmount,
          willReceiveAmount,
        })
      );

      const poolInfo = await getNeutronPoolInfo();
      const lsdTokenContract = poolInfo?.lsd_token;
      if (!lsdTokenContract) {
        throw new Error("Lsd Token Contract Address not found");
      }

      const fee = {
        amount: [
          {
            denom: "untrn",
            amount: "1",
          },
        ],
        gas: "1000000",
      };

      const signingCosmWasmClient =
        await SigningCosmWasmClient.connectWithSigner(
          neutronChainConfig.restEndpoint,
          offlineSigner
        );

      const instructions: ExecuteInstruction[] = [];

      const lsdTokenClient = new LsdToken.Client(
        signingCosmWasmClient,
        lsdTokenContract
      );
      const allowance = await lsdTokenClient.queryAllowance({
        owner: neutronAccount.bech32Address,
        spender: getStakeManagerContract(),
      });
      // console.log({ allowance });

      if (Number(allowance.allowance) < Number(amountInChain)) {
        instructions.push({
          contractAddress: lsdTokenContract,
          msg: {
            increase_allowance: {
              spender: getStakeManagerContract(),
              amount: Number(amountInChain) - Number(allowance.allowance) + "",
            },
          },
        });
      }

      instructions.push({
        contractAddress: getStakeManagerContract(),
        msg: {
          unstake: {
            amount: amountInChain + "",
            pool_addr: getPoolAddress(),
          },
        },
      });

      const executeResult = await signingCosmWasmClient.executeMultiple(
        neutronAccount.bech32Address,
        instructions,
        fee
      );

      if (!executeResult?.transactionHash) {
        throw new Error(getCosmosTxErrorMsg(executeResult));
      }

      const userBalanceInChain = await lsdTokenClient.queryBalance({
        address: neutronAccount.bech32Address,
      });
      const newLsdTokenBalance = chainAmountToHuman(userBalanceInChain.balance);

      const txHash = executeResult.transactionHash;
      dispatch(
        updateUnstakeLoadingParams({
          status: "success",
          txHash: txHash,
          scanUrl: getExplorerTxUrl(txHash, neutronChainConfig.chainId),
          newLsdTokenBalance: newLsdTokenBalance,
        })
      );
      const newNotice: LocalNotice = {
        id: noticeUuid || uuid(),
        type: "Unstake",
        txDetail: {
          transactionHash: txHash,
          sender: neutronAccount.bech32Address,
        },
        data: {
          amount: Number(unstakeAmount) + "",
          willReceiveAmount: Number(willReceiveAmount) + "",
        },
        scanUrl: getExplorerTxUrl(txHash, neutronChainConfig.chainId),
        status: "Confirmed",
      };
      dispatch(addNotice(newNotice));
      dispatch(setUnstakeLoading(false));
      cb && cb(true);
    } catch (err: any) {
      dispatch(setUnstakeLoading(false));
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (isKeplrCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setUnstakeLoadingParams(undefined));
        return;
      }
      dispatch(
        updateUnstakeLoadingParams({
          status: "error",
          customMsg: displayMsg,
        })
      );
    } finally {
      dispatch(updateCosmosTokenBalances());
    }
  };

interface LsdTokenUnstakeInfo {
  amount: string;
  era: string;
}

/**
 * withdraw unstaked token
 */
export const handleTokenWithdraw =
  (
    unstakeIndexList: number[],
    withdrawAmount: string,
    receiver: string
  ): AppThunk =>
  async (dispatch, getState) => {
    const neutronAccount =
      getState().wallet.cosmosAccounts[neutronChainConfig.chainId];
    const offlineSigner = await getOfflineSigner(neutronChainConfig.chainId);

    if (!neutronAccount || !offlineSigner) {
      snackbarUtil.error("Please connect Neutron Account first");
      dispatch(setStakeLoading(false));
      return;
    }

    try {
      dispatch(setWithdrawLoading(true));
      dispatch(
        setWithdrawLoadingParams({
          modalVisible: true,
          status: "loading",
          tokenAmount: withdrawAmount,
          params: {
            unstakeIndexList,
            withdrawAmount,
            receiver,
          },
        })
      );

      const fee = {
        amount: [
          {
            denom: "untrn",
            amount: "1",
          },
        ],
        gas: "1000000",
      };

      const funds: Coin[] = [];
      const fundAmount = await getNeutronWithdrawFeeAmount();

      const ntrnBalance = neutronAccount?.allBalances?.find(
        (item) => item.denom === neutronChainConfig.denom
      );
      if (
        Number(ntrnBalance ? ntrnBalance.amount : 0) <
        Number(fundAmount) + 0.02
      ) {
        throw new Error(
          `Insufficient NTRN balance, need est. ${formatNumber(
            Number(chainAmountToHuman(fundAmount, 6)) + 0.02
          )} NTRN for fee`
        );
      }

      funds.push({
        denom: "untrn",
        amount: fundAmount + "",
      });

      const signingCosmWasmClient =
        await SigningCosmWasmClient.connectWithSigner(
          neutronChainConfig.restEndpoint,
          offlineSigner
        );
      const stakeManagerClient = new StakeManager.Client(
        signingCosmWasmClient,
        getStakeManagerContract()
      );

      const executeResult = await stakeManagerClient.withdraw(
        neutronAccount.bech32Address,
        {
          pool_addr: getPoolAddress(),
          receiver,
          unstake_index_list: unstakeIndexList,
        },
        fee,
        "",
        funds
      );

      if (!executeResult?.transactionHash) {
        throw new Error(getCosmosTxErrorMsg(executeResult));
      }

      let hasFail = false;

      while (true) {
        const userUnstakeList = await stakeManagerClient.queryUserUnstake({
          pool_addr: getPoolAddress(),
          user_neutron_addr: neutronAccount.bech32Address,
        });

        let allSuccess = true;

        unstakeIndexList.forEach((unstakeIndex) => {
          const matched = userUnstakeList.find(
            (item) => item.index === unstakeIndex
          );
          if (matched) {
            allSuccess = false;
            if (matched.status === "default") {
              hasFail = true;
            }
          }
        });

        if (allSuccess || hasFail) {
          break;
        }
      }

      if (hasFail) {
        dispatch(
          updateWithdrawLoadingParams(
            {
              status: "error",
              broadcastStatus: "error",
              packStatus: "error",
              finalizeStatus: "error",
              txHash: executeResult.transactionHash,
              scanUrl: getExplorerTxUrl(
                executeResult.transactionHash,
                neutronChainConfig.chainId
              ),
              customMsg: undefined,
            },
            (newParams) => {
              dispatch(
                addNotice({
                  id: uuid(),
                  type: "Withdraw",
                  data: {
                    tokenAmount: withdrawAmount,
                  },
                  status: "Error",
                  scanUrl: getExplorerTxUrl(
                    executeResult.transactionHash,
                    neutronChainConfig.chainId
                  ),
                })
              );
            }
          )
        );
        dispatch(setWithdrawLoading(false));
        return;
      }

      dispatch(updateLsdTokenUserWithdrawInfo());

      dispatch(
        updateWithdrawLoadingParams(
          {
            status: "success",
            broadcastStatus: "success",
            packStatus: "success",
            finalizeStatus: "success",
            txHash: executeResult.transactionHash,
            scanUrl: getExplorerTxUrl(
              executeResult.transactionHash,
              neutronChainConfig.chainId
            ),
            customMsg: undefined,
          },
          (newParams) => {
            dispatch(
              addNotice({
                id: uuid(),
                type: "Withdraw",
                data: {
                  tokenAmount: withdrawAmount,
                },
                status: "Confirmed",
                scanUrl: getExplorerTxUrl(
                  executeResult.transactionHash,
                  neutronChainConfig.chainId
                ),
              })
            );
          }
        )
      );
      dispatch(setWithdrawLoading(false));
    } catch (err: any) {
      dispatch(setWithdrawLoading(false));
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (isKeplrCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setWithdrawLoadingParams(undefined));
        return;
      }
      dispatch(
        updateWithdrawLoadingParams({
          status: "error",
          customMsg: displayMsg,
        })
      );
    } finally {
      dispatch(updateCosmosTokenBalances());
    }
  };
