import {
  ExecuteInstruction,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  getOfflineSigner,
  queryAccountBalances,
  queryrTokenBalance,
  sendIBCTransferTx,
} from "@stafihub/apps-wallet";
import { LsdToken, StakeManager } from "codegen/neutron";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { getPoolAddress, getStakeManagerContract } from "config/contract";
import {
  getBridgeTargetChainExplorerTxUrl,
  getExplorerTxUrl,
} from "config/explorer";
import {
  CANCELLED_MESSAGE,
  TRANSACTION_FAILED_MESSAGE,
} from "constants/common";
import {
  ChainConfig,
  CosmosAccount,
  CosmosAccountMap,
} from "interfaces/common";
import { AppThunk } from "redux/store";
import { isKeplrCancelError, timeout, uuid } from "utils/commonUtils";
import { getTokenName } from "utils/configUtils";
import {
  getBridgeChainDenom,
  getCosmosTxErrorMsg,
  getNeutronLsdTokenBalance,
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
  setBridgeLoading,
  setBridgeLoadingParams,
} from "./AppSlice";
import { KeplrChainParams } from "@stafihub/apps-wallet/dist/src/interface";
import {
  bridgeTargetsChainConfig,
  bridgeNeutronChainConfig,
  cw20Ics20Contract,
} from "config/bridge";
import { getSigningStafihubClient } from "@stafihub/types";
import { updateCosmosTokenBalances } from "./TokenSlice";

export interface BridgeLsdTokenBalance {
  [key: string]: string | undefined;
}

export interface BridgeState {
  balances: BridgeLsdTokenBalance;
}

const initialState: BridgeState = {
  balances: {},
};

export const bridgeSlice = createSlice({
  name: "bridge",
  initialState,
  reducers: {
    setBalances: (
      state: BridgeState,
      action: PayloadAction<BridgeLsdTokenBalance>
    ) => {
      state.balances = action.payload;
    },
  },
});

export const { setBalances } = bridgeSlice.actions;

export default bridgeSlice.reducer;

/**
 * update cosmos token balances
 */
export const updateTargetsChainTokenBalances =
  (): AppThunk => async (dispatch, getState) => {
    // const bridgeDstChains: KeplrChainParams[] = bridgeDstChainConfig.map(async (config) => {

    // const poolInfo = await getNeutronPoolInfo();
    // const lsdTokenAddress = poolInfo?.lsd_token;

    // const hash = createHash("sha256");
    // hash.update(
    //   `transfer/${config.bridgeChannel}/cw20:${}`
    // );
    // const denom = hash.digest("hex").toUpperCase();

    //   return {
    //   chainId: config.chainId,
    //   chainName: config.chainName,
    //   rpc: config.rpc,
    //   denom: config.denom,
    //   decimals: config.decimals
    // }})
    // const chainConfigs = [neutronChainConfig, lsdTokenChainConfig, ...bridgeDstChains];

    // const hash = createHash("sha256");
    // hash.update(
    //   "transfer/channel-71/cw20:neutron1lkm4v3kkyp4lt6jr4ccs2w8n4gve6ynh53af6wtzp6ws0uqpnycsshuz30"
    // );
    // const denom = hash.digest("hex").toUpperCase();
    // const b = await queryrTokenBalance(
    //   custom,
    //   "cosmos19tged0js3eepyk0rplsjgd4pxu3qx5zt78r4w8",
    //   `ibc/${denom}`
    // );

    const requests = bridgeTargetsChainConfig.map((chainConfig) => {
      return (async () => {
        try {
          // todo:
          const account = getState().wallet.cosmosAccounts[chainConfig.chainId];
          if (!account || !chainConfig.bridgeChannel) {
            return;
          }
          const newAccount = { ...account };
          const userAddress = newAccount.bech32Address;

          const poolInfo = await getNeutronPoolInfo();
          const lsdTokenAddress = poolInfo?.lsd_token;

          if (!lsdTokenAddress) return;

          const denom = getBridgeChainDenom(
            chainConfig.bridgeChannel,
            lsdTokenAddress
          );
          const balance = await queryrTokenBalance(
            chainConfig,
            userAddress,
            denom
          );
          // console.log({
          //   chainName: chainConfig.chainName,
          //   balance: balances,
          // });

          // Prevent disconnect conflict.
          // if (
          //   !getState().wallet.cosmosAccounts[chainConfig.chainId] ||
          //   getState().wallet.cosmosAccounts[chainConfig.chainId]
          //     ?.bech32Address !== userAddress
          // ) {
          //   return;
          // }
          return { chainId: chainConfig.chainId, balance };
        } catch (err: any) {
          console.log(err);
          return null;
        }
      })();
    });

    const _balances: BridgeLsdTokenBalance = {};
    const results = await Promise.all(requests);
    results
      .filter((r) => !!r)
      .forEach((r) => {
        _balances[r.chainId] = r.balance;
      });
    dispatch(setBalances(_balances));
  };

export const bridgeFromNeutron =
  (
    amount: string,
    srcChain: ChainConfig,
    dstChain: ChainConfig,
    receiver: string,
    cb?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    const neutronAccount =
      getState().wallet.cosmosAccounts[neutronChainConfig.chainId];
    const offlineSigner = await getOfflineSigner(neutronChainConfig.chainId);
    if (!neutronAccount || !offlineSigner) {
      snackbarUtil.error("Please connect wallet account first");
      dispatch(setBridgeLoading(false));
      return;
    }

    dispatch(setBridgeLoading(true));
    const noticeUuid = uuid();
    const amountInChain = amountToChain(amount);

    try {
      dispatch(
        setBridgeLoadingParams({
          modalVisible: true,
          status: "loading",
          tokenAmount: amount,
          srcChain,
          dstChain,
        })
      );
      const channelMsg = JSON.stringify({
        channel: "channel-1551",
        remote_address: receiver,
      });
      const base64Msg = Buffer.from(channelMsg, "utf-8").toString("base64");

      const signingCosmWasmClient =
        await SigningCosmWasmClient.connectWithSigner(
          neutronChainConfig.restEndpoint,
          offlineSigner
        );

      const poolInfo = await getNeutronPoolInfo();
      const lsdTokenContract = poolInfo?.lsd_token;
      if (!lsdTokenContract) {
        throw new Error("Lsd Token Contract Address not found");
      }
      const lsdTokenClient = new LsdToken.Client(
        signingCosmWasmClient,
        lsdTokenContract
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

      const oldBalance = await getNeutronLsdTokenBalance(
        neutronAccount?.bech32Address
      );

      const executeResult = await lsdTokenClient.send(
        neutronAccount.bech32Address,
        {
          amount: amountInChain,
          contract: cw20Ics20Contract,
          msg: base64Msg,
        },
        fee
      );
      if (!executeResult?.transactionHash) {
        throw new Error(getCosmosTxErrorMsg(executeResult));
      }

      let newBalance;
      let count = 0;
      while (true) {
        await timeout(3000);
        count++;
        newBalance = await getNeutronLsdTokenBalance(
          neutronAccount?.bech32Address
        );
        if (Number(newBalance) < Number(oldBalance) || count > 20) {
          break;
        }
      }
      dispatch(updateTargetsChainTokenBalances());
      dispatch(updateCosmosTokenBalances());

      const txHash = executeResult.transactionHash;
      dispatch(
        setBridgeLoadingParams({
          status: "success",
          txHash,
          scanUrl: getExplorerTxUrl(txHash, srcChain.chainId),
        })
      );
      const newNotice: LocalNotice = {
        id: noticeUuid || uuid(),
        type: "Bridge",
        txDetail: {
          transactionHash: txHash,
          sender: neutronAccount.bech32Address,
        },
        data: {
          amount,
          srcChain,
          dstChain,
          receiver,
        },
        scanUrl: getExplorerTxUrl(txHash, srcChain.chainId),
        status: "Confirmed",
      };
      dispatch(addNotice(newNotice));
      dispatch(setBridgeLoading(false));
      cb && cb(true);
    } catch (err: any) {
      console.log(err);
      cb && cb(false);
      dispatch(setBridgeLoading(false));
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (isKeplrCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setBridgeLoadingParams(undefined));
        return;
      }
      dispatch(
        setBridgeLoadingParams({
          status: "error",
          displayMsg,
        })
      );
      dispatch(
        addNotice({
          id: uuid(),
          type: "Bridge",
          data: {
            amount,
            srcChain,
            dstChain,
            receiver,
          },
          status: "Error",
        })
      );
    } finally {
    }
  };

export const bridgeToNeutron =
  (
    amount: string,
    sender: CosmosAccount,
    receiver: string,
    srcChain: ChainConfig,
    dstChain: ChainConfig,
    cb?: (success: boolean) => void
  ): AppThunk =>
  async (dispatch, getState) => {
    if (!srcChain.bridgeChannel) {
      throw new Error("Chain channel not configured");
    }
    const offlineSigner = await getOfflineSigner(srcChain.chainId);
    if (!offlineSigner) {
      snackbarUtil.error("Please connect wallet account first");
      dispatch(setBridgeLoading(false));
      return;
    }
    const neutronAccount = getState().wallet.cosmosAccounts[dstChain.chainId];

    dispatch(setBridgeLoading(true));
    try {
      dispatch(
        setBridgeLoadingParams({
          modalVisible: true,
          status: "loading",
          tokenAmount: amount,
          srcChain,
          dstChain,
        })
      );
      const amountInChain = amountToChain(amount);
      const poolInfo = await getNeutronPoolInfo();
      const lsdTokenContract = poolInfo?.lsd_token;
      if (!lsdTokenContract) {
        throw new Error("Lsd Token Contract Address not found");
      }

      const ibcTokenDenom = getBridgeChainDenom(
        srcChain.bridgeChannel,
        lsdTokenContract
      );
      const chainConfig: KeplrChainParams = {
        chainId: srcChain.chainId,
        chainName: srcChain.chainName,
        rpc: srcChain.rpc,
        denom: ibcTokenDenom,
        decimals: srcChain.decimals,
      };

      const oldBalance = await getNeutronLsdTokenBalance(
        neutronAccount?.bech32Address
      );

      const response = await sendIBCTransferTx(
        chainConfig,
        sender.bech32Address,
        receiver,
        amountInChain,
        "transfer",
        srcChain.bridgeChannel,
        ibcTokenDenom
      );

      if (!response || response.code !== 0) {
        throw new Error(getCosmosTxErrorMsg(response));
      }

      let newBalance;
      let count = 0;
      while (true) {
        await timeout(3000);
        count++;
        newBalance = await getNeutronLsdTokenBalance(
          neutronAccount?.bech32Address
        );
        if (Number(newBalance) > Number(oldBalance) || count > 20) {
          break;
        }
      }
      dispatch(updateTargetsChainTokenBalances());
      dispatch(updateCosmosTokenBalances());

      const txHash = response.transactionHash;
      dispatch(
        setBridgeLoadingParams({
          status: "success",
          txHash,
          scanUrl: getBridgeTargetChainExplorerTxUrl(srcChain.chainId, txHash),
        })
      );
      const newNotice: LocalNotice = {
        id: uuid(),
        type: "Bridge",
        txDetail: {
          transactionHash: txHash,
          sender: sender.bech32Address,
        },
        data: {
          amount,
          srcChain,
          dstChain,
          receiver,
        },
        scanUrl: getBridgeTargetChainExplorerTxUrl(srcChain.chainId, txHash),
        status: "Confirmed",
      };
      dispatch(addNotice(newNotice));
      dispatch(setBridgeLoading(false));
      cb && cb(true);
    } catch (err: any) {
      console.log(err);
      cb && cb(false);
      dispatch(setBridgeLoading(false));
      let displayMsg = err.message || TRANSACTION_FAILED_MESSAGE;
      if (isKeplrCancelError(err)) {
        snackbarUtil.error(CANCELLED_MESSAGE);
        dispatch(setBridgeLoadingParams(undefined));
        return;
      }
      dispatch(
        setBridgeLoadingParams({
          status: "error",
          displayMsg: displayMsg,
        })
      );
      dispatch(
        addNotice({
          id: uuid(),
          type: "Bridge",
          data: {
            amount,
            srcChain,
            dstChain,
            receiver,
          },
          status: "Error",
        })
      );
    } finally {
    }
  };
