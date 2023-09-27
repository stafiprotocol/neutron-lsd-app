import Web3 from "web3";
import { getEvmRpc, getLsdTokenMetamaskParam } from "config/env";
import snackbarUtil from "./snackbarUtils";
import { AbiItem } from "web3-utils";
import { PublicClient } from "viem";
import { timeout } from "./commonUtils";
import {
  BLOCK_HASH_NOT_FOUND_MESSAGE,
  REJECTED_MESSAGE,
} from "constants/common";

declare const window: any;

export function createWeb3(provider?: any) {
  return new Web3(provider || Web3.givenProvider);
}

let ethWeb3: Web3 | undefined = undefined;

/**
 * get evm web3 instance singleton
 */
export function getWeb3() {
  const rpcLink = getEvmRpc();
  if (!ethWeb3) {
    const useWebsocket = rpcLink.startsWith("wss");
    ethWeb3 = createWeb3(
      useWebsocket
        ? new Web3.providers.WebsocketProvider(rpcLink)
        : new Web3.providers.HttpProvider(rpcLink)
    );
  }
  return ethWeb3;
}

export async function getErc20AssetBalance(
  userAddress: string | undefined,
  tokenAbi: AbiItem | AbiItem[],
  tokenAddress: string | undefined
) {
  if (!userAddress || !tokenAbi || !tokenAddress) {
    return undefined;
  }
  try {
    let web3 = getWeb3();
    let contract = new web3.eth.Contract(tokenAbi, tokenAddress, {
      from: userAddress,
    });
    const result = await contract.methods.balanceOf(userAddress).call();
    let balance = web3.utils.fromWei(result + "", "ether");

    return balance;
  } catch (err: any) {
    return undefined;
  }
}

/**
 * add lsdToken to metamask
 */
export async function addLsdTokenToMetaMask() {
  if (!window.ethereum) {
    return;
  }

  const params = getLsdTokenMetamaskParam();

  try {
    window.ethereum
      .request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20", // Initially only supports ERC20, but eventually more!
          options: {
            address: params.tokenAddress, // The address that the token is at.
            symbol: params.tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: params.tokenDecimals, // The number of decimals in the token
            image: params.tokenImage, // A string url of the token logo
          },
        },
      })
      .then((wasAdded: boolean) => {
        if (wasAdded) {
          snackbarUtil.success("Add token success");
        }
      });
  } catch (err: any) {}
}

/**
 * decode BalancesUpdated event log data
 * @param data event data
 * @param topics event topics
 * @returns decoded log values
 */
export function decodeBalancesUpdatedLog(data: string, topics: string[]) {
  const web3 = getWeb3();
  const values = web3.eth.abi.decodeLog(
    [
      {
        name: "block",
        type: "uint256",
      },
      {
        name: "totalEth",
        type: "uint256",
      },
      {
        name: "lsdTokenSupply",
        type: "uint256",
      },
      {
        name: "time",
        type: "uint256",
      },
    ],
    data,
    topics
  );
  return values;
}

export async function fetchTransactionReceipt(
  publicClient: PublicClient,
  hash: `0x${string}`
) {
  if (!hash) {
    return undefined;
  }
  for (let i = 0; i < 10; i++) {
    let transactionReceipt;
    try {
      transactionReceipt = await publicClient.waitForTransactionReceipt({
        hash,
      });
    } catch {}

    if (transactionReceipt) {
      return transactionReceipt;
    } else {
      await timeout(6000);
    }
  }

  return undefined;
}

export function getMetaMaskTxErrorMsg(result: any) {
  if (Number(result.code) === 4001) {
    return REJECTED_MESSAGE;
  } else if (Number(result.code) === 4100) {
    return "The requested action has not been authorized by user";
  } else if (Number(result.code) === 4200) {
    return "The requested method is not supported by this Ethereum provider";
  } else if (Number(result.code) === 4900) {
    return "The provider is disconnected from all chains";
  } else if (Number(result.code) === 32700 || Number(result.code) === 32600) {
    return "Invalid JSON params";
  } else if (result && !result.blockHash) {
    return BLOCK_HASH_NOT_FOUND_MESSAGE;
  }

  return result.message || "Transaction failed";
}
