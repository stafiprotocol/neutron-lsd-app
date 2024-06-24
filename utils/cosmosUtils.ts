import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import {
  connectAtomjs,
  getKeplrAccount,
  queryAccountBalances,
  queryChannelClientState,
  queryLatestBlock,
} from "@stafihub/apps-wallet";
import { LsdToken, StakeManager } from "codegen/neutron";
import { neutronChainConfig } from "config/chain";
import { getPoolAddress, getStakeManagerContract } from "config/contract";
import { COMMON_ERROR_MESSAGE } from "constants/common";
import { ChainConfig, Coin, CosmosAccount } from "interfaces/common";
import { chainAmountToHuman } from "./numberUtils";
import { saveCosmosNetworkAllowedFlag } from "./storageUtils";
import { Client as StakeManagerClient } from "codegen/neutron/stakeManager";

let neutronWasmClient: CosmWasmClient;
let stakeManagerClient: StakeManagerClient;

export async function getNeutronWasmClient() {
  try {
    if (!neutronWasmClient) {
      neutronWasmClient = await CosmWasmClient.connect(
        neutronChainConfig.restEndpoint
      );
    }
  } catch (err: any) {
    console.error(err);
  }

  return neutronWasmClient;
}

export async function getStakeManagerClient() {
  try {
    if (!stakeManagerClient) {
      const wasmClient = await getNeutronWasmClient();
      stakeManagerClient = new StakeManager.Client(
        wasmClient,
        getStakeManagerContract()
      );
    }
  } catch (err: any) {
    console.error(err);
  }

  return stakeManagerClient;
}

export const _connectKeplr = async (chainConfig: ChainConfig) => {
  try {
    await connectAtomjs(chainConfig);
    const accountResult = await getKeplrAccount(chainConfig.chainId);

    if (!accountResult) {
      return null;
    }

    const account: CosmosAccount = {
      name: accountResult.name,
      isNanoLedger: accountResult.isNanoLedger,
      bech32Address: accountResult.bech32Address,
    };
    // console.log("account", account);

    const balances = await queryAccountBalances(
      chainConfig,
      account.bech32Address
    );
    account.allBalances = balances;

    saveCosmosNetworkAllowedFlag(chainConfig.chainId);
    return account;
  } catch (err: any) {}
  return null;
};

export function getTokenBalance(
  balances: Coin[] | undefined,
  denom: string | undefined
): string {
  // console.log("balances", balances);
  if (!balances || !denom) {
    return "--";
  }
  const target = balances.find((coin) => coin.denom === denom);
  return target?.amount || "0";
}

export async function getNeutronLsdTokenBalance(
  neutronAddress: string | undefined
) {
  if (!neutronAddress) {
    return undefined;
  }
  try {
    const wasmClient = await getNeutronWasmClient();

    const poolInfo = await getNeutronPoolInfo();

    const lsdTokenClient = new LsdToken.Client(
      wasmClient,
      poolInfo?.lsd_token || ""
    );
    const userBalanceInChain = await lsdTokenClient.queryBalance({
      address: neutronAddress,
    });
    // console.log({ userBalanceInChain });

    return chainAmountToHuman(userBalanceInChain.balance);
  } catch (err: any) {
    // console.log(err);
    return undefined;
  }
}

export async function getNeutronPoolInfo() {
  try {
    const stakeManagerClient = await getStakeManagerClient();

    const poolInfo = await stakeManagerClient.queryPoolInfo({
      pool_addr: getPoolAddress(),
    });
    // console.log({ poolInfo });

    return poolInfo;
  } catch (err: any) {
    // console.log(err);
    return undefined;
  }
}

export function getCosmosTxErrorMsg(response: any) {
  if (!response?.events) {
    return COMMON_ERROR_MESSAGE;
  }
  return JSON.stringify(response.events);
}

export async function getWasmIbcTransferMessage(
  srcChainConfig: ChainConfig,
  sender: string,
  receiver: string,
  amount: string,
  sourcePort: string,
  sourceChannel: string,
  denom: string,
  memo?: string
) {
  console.log({ srcChainConfig });

  const clientState = await queryChannelClientState(
    srcChainConfig,
    sourceChannel
  );

  const latestBlockResult = await queryLatestBlock(srcChainConfig);
  const latestBlockNanoSeconds = (
    Number(latestBlockResult?.block?.header?.time?.getTime()) * 1000000
  ).toFixed(0);

  const message = {
    typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
    value: {
      sourcePort,
      sourceChannel,
      token: {
        denom,
        amount,
      },
      sender,
      receiver,
      timeoutHeight: {
        revisionNumber: clientState?.latestHeight?.revisionNumber,
        revisionHeight: clientState?.latestHeight?.revisionHeight?.add(100000),
      },
      timeoutTimestamp: Number(latestBlockNanoSeconds) + 600000000000000 + "",
      memo,
    },
  };

  return message;
}

export async function getNeutronWithdrawFeeAmount() {
  let fundAmount = 0;

  const refundResponse = await fetch(
    "https://rest-falcron.pion-1.ntrn.tech/neutron-org/neutron/feerefunder/params",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const refundResponseJson = await refundResponse.json();
  if (
    refundResponseJson.params.min_fee.recv_fee &&
    refundResponseJson.params.min_fee.recv_fee.length > 0
  ) {
    const recvFee = refundResponseJson.params.min_fee.recv_fee[0];
    fundAmount += Number(recvFee.amount);
  }
  if (
    refundResponseJson.params.min_fee.ack_fee &&
    refundResponseJson.params.min_fee.ack_fee.length > 0
  ) {
    const ackFee = refundResponseJson.params.min_fee.ack_fee[0];
    fundAmount += Number(ackFee.amount);
  }
  if (
    refundResponseJson.params.min_fee.timeout_fee &&
    refundResponseJson.params.min_fee.timeout_fee.length > 0
  ) {
    const timeoutFee = refundResponseJson.params.min_fee.timeout_fee[0];
    fundAmount += Number(timeoutFee.amount);
  }

  return fundAmount;
}
