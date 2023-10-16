import { isDev } from "./env";
import appDevConfig from "./appConf/dev.json";
import appProdConfig from "./appConf/prod.json";
import lsdTokenContractAbi from "./abi/lsdTokenContractAbi.json";
import stakeManagerContractAbi from "./abi/stakeManagerContractAbi.json";
import { AbiItem } from "web3-utils";

/**
 * get lsdToken contract address
 */
export function getLsdTokenContract() {
  if (isDev()) {
    return appDevConfig.contracts.lsdToken.address;
  }
  return appProdConfig.contracts.lsdToken.address;
}

/**
 * get evm token stakeManager contract address
 */
export function getStakeManagerContract() {
  if (isDev()) {
    return appDevConfig.contracts.stakeManager.address;
  }
  return appProdConfig.contracts.stakeManager.address;
}

/**
 * get lsdToken token contract ABI
 */
export function getLsdTokenContractAbi() {
  return lsdTokenContractAbi as AbiItem[];
}

/**
 * get evm token stakeManager contract ABI
 */
export function getStakeManagerContractAbi() {
  return stakeManagerContractAbi as AbiItem[];
}
