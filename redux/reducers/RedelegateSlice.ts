import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { AppThunk } from "redux/store";
import { isKeplrCancelError, timeout, uuid } from "utils/commonUtils";
import {
  getNeutronPoolInfo,
  getNeutronWasmClient,
  getStakeManagerClient,
  getWasmIbcTransferMessage,
} from "utils/cosmosUtils";
import snackbarUtil from "utils/snackbarUtils";
import {
  addNotice,
  resetRedelegateLoadingParams,
  setStakeLoading,
  updateNotice,
  updateRedelegateLoadingParams,
} from "./AppSlice";
import {
  queryAccountBalances,
  queryDelegatorDelegations,
  queryStakingDelegation,
  queryStakingValidator,
  queryTokenizeShareLockInfo,
  queryTokenizeShareRecords,
  sendCosmosClientTx,
} from "@stafihub/apps-wallet";
import {
  amountToChain,
  chainAmountToHuman,
  formatNumber,
} from "utils/numberUtils";
import { Coin } from "@cosmjs/proto-signing";
import { getPoolAddress, getStakeManagerContract } from "config/contract";
import { LocalNotice, NoticeStatus } from "utils/noticeUtils";
import { getTokenName } from "utils/configUtils";
import { getExplorerTxUrl } from "config/explorer";
import { LsdToken } from "codegen/neutron";
import { updateCosmosTokenBalances } from "./TokenSlice";
import {
  CANCELLED_MESSAGE,
  COMMON_ERROR_MESSAGE,
  TOAST_MESSAGE_INCREASE_GAS,
} from "constants/common";
import _, { cloneDeep } from "lodash";

export interface LsdTokenState {
  data: string | undefined; // balance of lsdToken
}

const initialState: LsdTokenState = {
  data: undefined,
};

export const redelegateSlice = createSlice({
  name: "redelegate",
  initialState,
  reducers: {
    setData: (
      state: LsdTokenState,
      action: PayloadAction<string | undefined>
    ) => {
      state.data = action.payload;
    },
  },
});

export const { setData } = redelegateSlice.actions;

export default redelegateSlice.reducer;

export const redelegateStakedToken =
  (
    validValidators: string[],
    validatorAddr: string,
    delegateAmount: string,
    willReceiveAmount: string,
    newRTokenBalance: string,
    onTxSuccess: () => void,
    isReTry?: boolean,
    callback?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const neutronAccount =
      getState().wallet.cosmosAccounts[neutronChainConfig.chainId];
    const sender =
      getState().wallet.cosmosAccounts[lsdTokenChainConfig.chainId];

    if (!neutronAccount || !sender) {
      snackbarUtil.error("Please connect Chain Account first");
      return;
    }

    const noticeUuid =
      isReTry && getState().app.redelegateLoadingParams?.noticeUuid
        ? getState().app.redelegateLoadingParams?.noticeUuid
        : uuid();

    try {
      dispatch(setStakeLoading(true));
      dispatch(
        resetRedelegateLoadingParams({
          modalVisible: true,
          noticeUuid,
          type: "staked",
          status: "loading",
          amount: Number(delegateAmount) + "",
          willReceiveAmount,
          newRTokenBalance,
          steps: ["tokenizeShares", "sending"],
          progressDetail: {
            tokenizeShares: {
              totalStatus: "loading",
            },
          },
        })
      );

      // Check account lock status.
      {
        const lockInfoResponse = await queryTokenizeShareLockInfo(
          lsdTokenChainConfig,
          sender.bech32Address
        );
        if (lockInfoResponse?.status === "TOKENIZE_SHARE_LOCK_STATUS_LOCKED") {
          throw new Error("Your account is locked and cannot tokenize shares.");
        } else if (
          lockInfoResponse?.status ===
          "TOKENIZE_SHARE_LOCK_STATUS_LOCK_EXPIRING"
        ) {
          throw new Error(
            `Tokenization will be allowed at ${lockInfoResponse?.expirationTime}.`
          );
        }

        let queryDelegationResponse;
        try {
          queryDelegationResponse = await queryStakingDelegation(
            lsdTokenChainConfig,
            sender.bech32Address,
            validatorAddr
          );
        } catch {}

        if (
          queryDelegationResponse?.delegationResponse?.delegation
            ?.validatorBond === true
        ) {
          throw new Error("Validator bond is not allowed for TokenizeShare.");
        }
        // console.log({ lockInfoResponse });
        // console.log({ queryDelegationResponse });
      }

      const delegatorDelegationsResult = await queryDelegatorDelegations(
        lsdTokenChainConfig,
        sender.bech32Address
      );

      const delegationList =
        delegatorDelegationsResult?.delegationResponses || [];

      const sortDelegationList = _.cloneDeep(delegationList).sort(
        (item1, item2) => {
          return Number(item2.balance?.amount) - Number(item1.balance?.amount);
        }
      );

      // console.log({ sortDelegationList });

      let tokenizeShareCount = 0;

      const prepareMessages: { typeUrl: any; value: any }[] = [];
      let chainDelegateAmount = amountToChain(delegateAmount);

      for (let i = 0; i < sortDelegationList.length; i++) {
        if (Number(chainDelegateAmount) <= 0) {
          break;
        }
        const currentDelegation = sortDelegationList[i];
        let currentAmount = "0";
        if (
          Number(currentDelegation.balance?.amount) >=
          Number(chainDelegateAmount)
        ) {
          currentAmount = chainDelegateAmount;
          chainDelegateAmount = "0";
        } else {
          currentAmount = currentDelegation.balance?.amount || "0";
          chainDelegateAmount =
            Number(chainDelegateAmount) - Number(currentAmount) + "";
        }

        let needChangeValidator = false;

        if (
          validValidators.indexOf(
            currentDelegation.delegation?.validatorAddress || ""
          ) < 0
        ) {
          needChangeValidator = true;
          prepareMessages.push({
            typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
            value: {
              delegatorAddress: sender.bech32Address,
              validatorSrcAddress:
                currentDelegation.delegation?.validatorAddress || "",
              validatorDstAddress: validatorAddr,
              amount: {
                denom: currentDelegation.balance?.denom,
                amount: currentAmount,
              },
            },
          });
        }

        tokenizeShareCount++;
        prepareMessages.push({
          typeUrl: "/cosmos.staking.v1beta1.MsgTokenizeShares",
          value: {
            delegatorAddress: sender.bech32Address,
            validatorAddress: needChangeValidator
              ? validatorAddr
              : currentDelegation.delegation?.validatorAddress || "",
            tokenizedShareOwner: sender.bech32Address,
            amount: {
              denom: currentDelegation.balance?.denom,
              amount:
                Number(currentAmount) > 1
                  ? Number(currentAmount) - 1 + ""
                  : currentAmount,
            },
          },
        });
      }
      // console.log({ messages: prepareMessages });

      dispatch(
        updateRedelegateLoadingParams({
          customMsg:
            "Please approve the TokenizeShares transaction in your wallet",
        })
      );

      const prepareTxResponse = await sendCosmosClientTx(
        lsdTokenChainConfig,
        sender.bech32Address,
        prepareMessages
      );
      // console.log({ prepareTxResponse });

      if (prepareTxResponse?.code !== 0) {
        throw new Error(prepareTxResponse?.rawLog);
      }

      onTxSuccess();

      // Transfer tx
      const userBalances = await queryAccountBalances(
        lsdTokenChainConfig,
        sender.bech32Address
      );
      // console.log({ userBalances });
      const result = await queryTokenizeShareRecords(
        lsdTokenChainConfig,
        sender.bech32Address || ""
      );
      const transferMessages: { typeUrl: any; value: any }[] = [];
      const balanceTransferAmounts: Coin[] = [];
      if (result?.records && result.records.length >= tokenizeShareCount) {
        for (
          let recordIndex = result.records.length - 1;
          recordIndex > result.records.length - 1 - tokenizeShareCount;
          recordIndex--
        ) {
          const tokenizeSharesRecord = result.records[recordIndex];
          const tokenizeShareDenom = `${
            tokenizeSharesRecord.validator
          }/${tokenizeSharesRecord.id.toString()}`;
          const tokenizeShareBalance = userBalances.find((item) => {
            return item.denom === tokenizeShareDenom;
          });
          if (!tokenizeShareBalance) {
            throw new Error("TokenizeShare Balance not found");
          }
          // transferMessages.push({
          //   typeUrl: "/cosmos.staking.v1beta1.MsgTransferTokenizeShareRecord",
          //   value: {
          //     sender: sender.bech32Address,
          //     newOwner: poolAddress,
          //     tokenizeShareRecordId: tokenizeSharesRecord.id,
          //   },
          // });
          // balanceTransferAmounts.push({
          //   denom: tokenizeShareBalance.denom,
          //   amount: tokenizeShareBalance.amount,
          // });

          const memo = JSON.stringify({
            wasm: {
              contract: getStakeManagerContract(),
              msg: {
                stake_lsm: {
                  neutron_address: neutronAccount.bech32Address,
                  pool_addr: getPoolAddress(),
                },
              },
            },
          });

          const ibcTransferMessage = await getWasmIbcTransferMessage(
            lsdTokenChainConfig,
            sender.bech32Address,
            getStakeManagerContract(),
            tokenizeShareBalance.amount,
            "transfer",
            lsdTokenChainConfig.stakeIbcChannel || "",
            tokenizeShareBalance.denom,
            memo
          );

          transferMessages.push(ibcTransferMessage);
        }

        // balanceTransferAmounts.sort((item1, item2) => {
        //   return item1.denom.localeCompare(item2.denom);
        // });
        // transferMessages.push({
        //   typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        //   value: {
        //     fromAddress: userAddress,
        //     toAddress: poolAddress,
        //     amount: balanceTransferAmounts,
        //   },
        // });

        // console.log({ transferMessages });

        dispatch(
          updateRedelegateLoadingParams(
            {
              prepareTxHash: prepareTxResponse?.transactionHash,
              customMsg:
                "Please approve the token transfer transaction in your wallet",
              currentStep: "sending",
              cosmosTxMessagesJSON: JSON.stringify(transferMessages),
            },
            (newParams) => {
              const newNotice: LocalNotice = {
                id: noticeUuid || uuid(),
                type: "Redelegate",
                txDetail: {
                  transactionHash: prepareTxResponse.transactionHash,
                  sender: sender.bech32Address,
                },
                data: {
                  amount: Number(delegateAmount) + "",
                  willReceiveAmount: Number(willReceiveAmount) + "",
                },
                scanUrl: getExplorerTxUrl(
                  prepareTxResponse.transactionHash,
                  lsdTokenChainConfig.chainId
                ),
                status: "Pending",
                redelegateLoadingParams: newParams,
              };
              dispatch(addNotice(newNotice));
            }
          )
        );

        dispatch(
          redelegateStakedTokenSendAction(
            noticeUuid || "",
            neutronAccount.bech32Address,
            transferMessages,
            callback
          )
        );
      } else {
        throw new Error("TokenizeShares records not match");
      }
    } catch (err: any) {
      console.log({ err });
      let displayMsg = err.message;

      if (isKeplrCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(resetRedelegateLoadingParams(undefined));
        return;
      }
      dispatch(
        updateRedelegateLoadingParams(
          {
            status: "error",
            customMsg: displayMsg,
            progressDetail: {
              tokenizeShares: {
                totalStatus: "error",
                broadcastStatus: "error",
              },
            },
          },
          (newParams) => {
            dispatch(
              updateNotice(noticeUuid, {
                status: "Error",
                redelegateLoadingParams: newParams,
              })
            );
          }
        )
      );
    } finally {
      dispatch(setStakeLoading(false));
    }
  };

export interface LsmSendItem {
  recordId: string;
  validator: string;
  amount: string;
}

export const redelegateLsmToken =
  (
    validatorAddr: string,
    sendItems: LsmSendItem[],
    delegateAmount: string,
    willReceiveAmount: string,
    newRTokenBalance: string,
    isReTry?: boolean,
    callback?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const neutronAccount =
      getState().wallet.cosmosAccounts[neutronChainConfig.chainId];
    const sender =
      getState().wallet.cosmosAccounts[lsdTokenChainConfig.chainId];

    if (!neutronAccount || !sender) {
      snackbarUtil.error("Please connect Chain Account first");
      return;
    }

    const noticeUuid =
      isReTry && getState().app.redelegateLoadingParams?.noticeUuid
        ? getState().app.redelegateLoadingParams?.noticeUuid
        : uuid();

    let directCancel = true;
    try {
      dispatch(setStakeLoading(true));
      dispatch(
        resetRedelegateLoadingParams({
          modalVisible: true,
          noticeUuid,
          type: "lsm",
          status: "loading",
          amount: Number(delegateAmount) + "",
          willReceiveAmount,
          newRTokenBalance,
        })
      );

      // Check account lock status.
      {
        const lockInfoResponse = await queryTokenizeShareLockInfo(
          lsdTokenChainConfig,
          sender.bech32Address
        );
        if (lockInfoResponse?.status === "TOKENIZE_SHARE_LOCK_STATUS_LOCKED") {
          throw new Error("Your account is locked and cannot tokenize shares.");
        } else if (
          lockInfoResponse?.status ===
          "TOKENIZE_SHARE_LOCK_STATUS_LOCK_EXPIRING"
        ) {
          throw new Error(
            `Tokenization will be allowed at ${lockInfoResponse?.expirationTime}.`
          );
        }

        let queryDelegationResponse;
        try {
          queryDelegationResponse = await queryStakingDelegation(
            lsdTokenChainConfig,
            sender.bech32Address,
            validatorAddr
          );
        } catch {}

        if (
          queryDelegationResponse?.delegationResponse?.delegation
            ?.validatorBond === true
        ) {
          throw new Error("Validator bond is not allowed for TokenizeShare.");
        }
      }

      const redeemMessages: { typeUrl: any; value: any }[] = [];
      const tokenizeSharesMessages: { typeUrl: any; value: any }[] = [];
      const transferMessages: { typeUrl: any; value: any }[] = [];

      const poolInfo = await getNeutronPoolInfo();
      const rValidatorList = poolInfo?.validator_addrs || [];

      let tokenizeShareCount = 0;
      const reqs = sendItems.map((item) => {
        return (async () => {
          if (rValidatorList.indexOf(item.validator) < 0) {
            const validatorResponse = await queryStakingValidator(
              lsdTokenChainConfig,
              item.validator
            );
            const oldValidator = validatorResponse?.validator;
            if (!oldValidator) {
              throw new Error("Validator info not found");
              return;
            }

            tokenizeShareCount++;

            redeemMessages.push({
              typeUrl: "/cosmos.staking.v1beta1.MsgRedeemTokensForShares",
              value: {
                delegatorAddress: sender.bech32Address,
                amount: {
                  denom: `${item.validator}/${item.recordId}`,
                  amount: amountToChain(item.amount),
                },
              },
            });

            const receiveStakedTokenAmount = amountToChain(
              formatNumber(
                (Number(item.amount) * Number(oldValidator.tokens)) /
                  (Number(oldValidator.delegatorShares) /
                    Number("1000000000000000000")),
                {
                  toReadable: false,
                  withSplit: false,
                  decimals: 6,
                }
              )
            );
            // console.log({ oldValidator });
            // console.log({ receiveStakedTokenAmount });

            const txReceiveAmount =
              Number(receiveStakedTokenAmount) > 1
                ? Number(receiveStakedTokenAmount) - 1
                : receiveStakedTokenAmount;

            tokenizeSharesMessages.push({
              typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
              value: {
                delegatorAddress: sender.bech32Address,
                validatorSrcAddress: item.validator,
                validatorDstAddress: validatorAddr,
                amount: {
                  denom: "uatom",
                  amount: receiveStakedTokenAmount,
                },
              },
            });

            tokenizeSharesMessages.push({
              typeUrl: "/cosmos.staking.v1beta1.MsgTokenizeShares",
              value: {
                delegatorAddress: sender.bech32Address,
                validatorAddress: validatorAddr,
                tokenizedShareOwner: sender.bech32Address,
                amount: {
                  denom: "uatom",
                  amount: txReceiveAmount + "",
                },
              },
            });
          }
        })();
      });

      await Promise.all(reqs);

      // const redeemTxResponse = await sendCosmosClientTx(
      //   stafiHubChains[chainId],
      //   userAddress,
      //   redeemMessages,
      //   "",
      //   1.5
      // );
      // console.log({ redeemTxResponse });
      // if (redeemTxResponse?.code !== 0) {
      //   throw new Error(redeemTxResponse?.rawLog);
      // }

      // const tokenizeSharesTxResponse = await sendCosmosClientTx(
      //   stafiHubChains[chainId],
      //   userAddress,
      //   tokenizeSharesMessages,
      //   "",
      //   1.5
      // );
      // console.log({ tokenizeSharesTxResponse });
      // if (tokenizeSharesTxResponse?.code !== 0) {
      //   throw new Error(tokenizeSharesTxResponse?.rawLog);
      // }

      let prepareTxHash;
      let needTokenizeShares = false;
      if (redeemMessages.length > 0 && tokenizeSharesMessages.length > 0) {
        // console.log("prepareTxMessages:", [
        //   ...redeemMessages,
        //   ...tokenizeSharesMessages,
        // ]);
        needTokenizeShares = true;
        dispatch(
          updateRedelegateLoadingParams({
            customMsg:
              "Please approve the TokenizeShares transaction in your wallet",
            steps: ["tokenizeShares", "sending"],
            progressDetail: {
              tokenizeShares: {
                totalStatus: "loading",
              },
            },
          })
        );

        const prepareTxResponse = await sendCosmosClientTx(
          lsdTokenChainConfig,
          sender.bech32Address,
          [...redeemMessages, ...tokenizeSharesMessages],
          "",
          1.8
        );
        // console.log({ prepareTxResponse });
        if (prepareTxResponse?.code !== 0) {
          throw new Error(prepareTxResponse?.rawLog);
        }
        prepareTxHash = prepareTxResponse.transactionHash;
        directCancel = false;
      } else {
        dispatch(
          updateRedelegateLoadingParams({
            steps: ["sending"],
            progressDetail: {
              sending: {
                totalStatus: "loading",
              },
            },
          })
        );
      }

      // Transfer tx
      const userBalances = await queryAccountBalances(
        lsdTokenChainConfig,
        sender.bech32Address
      );
      // console.log({ userBalances });

      const result = await queryTokenizeShareRecords(
        lsdTokenChainConfig,
        sender.bech32Address
      );
      // const balanceTransferAmounts: Coin[] = [];
      if (result?.records && result.records.length >= tokenizeShareCount) {
        for (
          let recordIndex = result.records.length - 1;
          recordIndex > result.records.length - 1 - tokenizeShareCount;
          recordIndex--
        ) {
          const tokenizeSharesRecord = result.records[recordIndex];
          const tokenizeShareDenom = `${
            tokenizeSharesRecord.validator
          }/${tokenizeSharesRecord.id.toString()}`;
          const tokenizeShareBalance = userBalances.find((item) => {
            return item.denom === tokenizeShareDenom;
          });
          if (!tokenizeShareBalance) {
            throw new Error("TokenizeShare Balance not found");
          }

          const memo = JSON.stringify({
            wasm: {
              contract: getStakeManagerContract(),
              msg: {
                stake_lsm: {
                  neutron_address: neutronAccount.bech32Address,
                  pool_addr: getPoolAddress(),
                },
              },
            },
          });

          const ibcTransferMessage = await getWasmIbcTransferMessage(
            lsdTokenChainConfig,
            sender.bech32Address,
            getStakeManagerContract(),
            tokenizeShareBalance.amount,
            "transfer",
            lsdTokenChainConfig.stakeIbcChannel || "",
            tokenizeShareBalance.denom,
            memo
          );

          transferMessages.push(ibcTransferMessage);
        }

        const filterSendItems = sendItems.filter(
          (item) => rValidatorList.indexOf(item.validator) >= 0
        );

        for (let i = 0; i < filterSendItems.length; i++) {
          const sendItem = filterSendItems[i];
          const tokenizeShareDenom = `${sendItem.validator}/${sendItem.recordId}`;
          const tokenizeShareBalance = userBalances.find((item) => {
            return item.denom === tokenizeShareDenom;
          });

          // balanceTransferAmounts.push({
          //   denom: tokenizeShareDenom,
          //   amount: humanToAtomic(sendItem.amount),
          // });

          const memo = JSON.stringify({
            wasm: {
              contract: getStakeManagerContract(),
              msg: {
                stake_lsm: {
                  neutron_address: neutronAccount.bech32Address,
                  pool_addr: getPoolAddress(),
                },
              },
            },
          });

          const ibcTransferMessage = await getWasmIbcTransferMessage(
            lsdTokenChainConfig,
            sender.bech32Address,
            getStakeManagerContract(),
            amountToChain(sendItem.amount),
            "transfer",
            lsdTokenChainConfig.stakeIbcChannel || "",
            tokenizeShareDenom,
            memo
          );

          transferMessages.push(ibcTransferMessage);
        }
      } else {
        throw new Error("TokenizeShares records not match");
      }

      // balanceTransferAmounts.sort((item1, item2) => {
      //   return item1.denom.localeCompare(item2.denom);
      // });

      // transferMessages.push({
      //   typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      //   value: {
      //     fromAddress: userAddress,
      //     toAddress: poolAddress,
      //     amount: balanceTransferAmounts,
      //   },
      // });

      // console.log({ transferMessages });

      const txMessages = [...transferMessages];

      dispatch(
        updateRedelegateLoadingParams(
          {
            customMsg:
              "Please approve the token transfer transaction in your wallet",
            currentStep: "sending",
            cosmosTxMessagesJSON: JSON.stringify(txMessages),
            prepareTxHash: prepareTxHash,
          },
          (newParams) => {
            const newNotice: LocalNotice = {
              id: noticeUuid || uuid(),
              type: "Redelegate",
              data: {
                amount: Number(delegateAmount) + "",
                willReceiveAmount: Number(willReceiveAmount) + "",
              },
              status: "Pending",
              redelegateLoadingParams: newParams,
            };
            dispatch(addNotice(newNotice));
          }
        )
      );

      dispatch(
        redelegateStakedTokenSendAction(
          noticeUuid || "",
          neutronAccount.bech32Address,
          txMessages,
          (success) => {
            callback && callback(success);
          },
          directCancel
        )
      );
    } catch (err: any) {
      console.log({ err });
      let displayMsg = err.message || COMMON_ERROR_MESSAGE;

      if (isKeplrCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(resetRedelegateLoadingParams(undefined));
        return;
      }
      dispatch(
        updateRedelegateLoadingParams(
          {
            status: "error",
            customMsg: displayMsg,
            progressDetail: {
              tokenizeShares: {
                totalStatus: "error",
                broadcastStatus: "error",
              },
            },
          },
          (newParams) => {
            dispatch(
              updateNotice(noticeUuid, {
                status: "Error",
                redelegateLoadingParams: newParams,
              })
            );
          }
        )
      );
    } finally {
      dispatch(setStakeLoading(false));
    }
  };

export const redelegateStakedTokenSendAction =
  (
    noticeUuid: string,
    neutronAddress: string,
    transferMessages: any[],
    callback?: (success: boolean) => void,
    directCancel?: boolean
  ): AppThunk =>
  async (dispatch, getState) => {
    // console.log({ transferMessages });
    try {
      dispatch(setStakeLoading(true));
      dispatch(
        updateRedelegateLoadingParams(
          {
            status: "loading",
            progressDetail: {
              tokenizeShares: {
                totalStatus: "success",
              },
              sending: {
                totalStatus: "loading",
              },
            },
            customMsg:
              "Please approve the token transfer transaction in your wallet",
            currentStep: "sending",
          },
          (newParams) => {
            dispatch(
              updateNotice(noticeUuid, {
                status: "Pending",
                redelegateLoadingParams: newParams,
              })
            );
          }
        )
      );

      const userAddress =
        getState().wallet.cosmosAccounts[lsdTokenChainConfig.chainId]
          ?.bech32Address;

      if (!userAddress) {
        throw new Error("Wallet not connected");
      }

      const cosmWasmClient = await getNeutronWasmClient();
      const poolInfo = await getNeutronPoolInfo();

      const lsdTokenClient = new LsdToken.Client(
        cosmWasmClient,
        poolInfo?.lsd_token || ""
      );
      const userOldBalanceInChain = await lsdTokenClient.queryBalance({
        address: neutronAddress,
      });
      const oldRAtomBalance = chainAmountToHuman(userOldBalanceInChain.balance);

      const transferTxResponse = await sendCosmosClientTx(
        lsdTokenChainConfig,
        userAddress,
        transferMessages,
        "",
        1.8,
        true
      );
      // console.log({ transferTxResponse });

      let success = false;

      if (transferTxResponse?.code === 0) {
        let newRAtomBalance;
        let count = 0;
        while (true) {
          await timeout(3000);
          count++;
          const userNewBalanceInChain = await lsdTokenClient.queryBalance({
            address: neutronAddress,
          });
          newRAtomBalance = chainAmountToHuman(userNewBalanceInChain.balance);
          if (newRAtomBalance > oldRAtomBalance || count > 20) {
            break;
          }
        }

        dispatch(
          updateRedelegateLoadingParams(
            {
              customMsg: "",
              transferTxHash: transferTxResponse.transactionHash,
              status: "success",
              progressDetail: {
                sending: {
                  totalStatus: "success",
                },
              },
            },
            (newParams) => {
              const newNotice = {
                txDetail: {
                  transactionHash: transferTxResponse.transactionHash,
                  sender: userAddress,
                },
                scanUrl: getExplorerTxUrl(
                  transferTxResponse.transactionHash,
                  lsdTokenChainConfig.chainId
                ),
                status: "Confirmed" as NoticeStatus,
                redelegateLoadingParams: newParams,
              };
              dispatch(updateNotice(noticeUuid, newNotice));
            }
          )
        );

        dispatch(updateCosmosTokenBalances());
      } else {
        // snackbarUtil.warning(TOAST_MESSAGE_INCREASE_GAS);
        throw new Error(
          transferTxResponse?.rawLog || TOAST_MESSAGE_INCREASE_GAS
        );
      }

      callback && callback(success);
    } catch (err: any) {
      console.log({ err });
      let displayMsg = err.message || COMMON_ERROR_MESSAGE;

      if (isKeplrCancelError(err)) {
        const redelegateLoadingParams = cloneDeep(
          getState().app.redelegateLoadingParams
        );
        dispatch(
          updateNotice(noticeUuid, {
            status: "Cancelled",
            redelegateLoadingParams: {
              ...redelegateLoadingParams,
              status: "error",
              customMsg: displayMsg,
              progressDetail: {
                sending: {
                  totalStatus: "error",
                  broadcastStatus: "error",
                },
              },
            },
          })
        );
        dispatch(resetRedelegateLoadingParams(undefined));
        snackbarUtil.error(CANCELLED_MESSAGE);
        return;
      }

      dispatch(
        updateRedelegateLoadingParams(
          {
            status: "error",
            customMsg: displayMsg,
            progressDetail: {
              sending: {
                totalStatus: "error",
                broadcastStatus: "error",
              },
            },
          },
          (newParams) => {
            dispatch(
              updateNotice(noticeUuid, {
                status: "Error",
                redelegateLoadingParams: newParams,
              })
            );
          }
        )
      );
    } finally {
      dispatch(setStakeLoading(false));
    }
  };
