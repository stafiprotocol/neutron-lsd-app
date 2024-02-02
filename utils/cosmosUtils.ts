import { ChainConfig, Coin, CosmosAccount } from "interfaces/common";
import { saveCosmosNetworkAllowedFlag } from "./storageUtils";
import { timeout } from "./commonUtils";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { neutronChainConfig } from "config/chain";
import { StargateClient } from "@cosmjs/stargate";
import {
  connectAtomjs,
  getKeplrAccount,
  queryAccountBalances,
} from "@stafihub/apps-wallet";
import { LsdToken, StakeManager } from "codegen/neutron";
import {
  getLsdTokenContract,
  getPoolAddress,
  getStakeManagerContract,
} from "config/contract";
import { chainAmountToHuman } from "./numberUtils";
import { COMMON_ERROR_MESSAGE } from "constants/common";

let neutronWasmClient: CosmWasmClient;

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

    const lsdTokenClient = new LsdToken.Client(
      wasmClient,
      getLsdTokenContract()
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
    const cosmWasmClient = await getNeutronWasmClient();

    const stakeManagerClient = new StakeManager.Client(
      cosmWasmClient,
      getStakeManagerContract()
    );

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
