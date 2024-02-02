import { isDev } from "./env";
import appDevConfig from "./appConf/dev.json";
import appProdConfig from "./appConf/prod.json";
import { lsdTokenChainConfig, neutronChainConfig } from "./chain";

export function getExplorerUrl(chainId?: string) {
  if (chainId === lsdTokenChainConfig.chainId) {
    return lsdTokenChainConfig.explorerUrl;
  }
  return neutronChainConfig.explorerUrl;
}

export function getExplorerTxUrl(txHash: string | undefined, chainId?: string) {
  if (isDev()) {
    return `${getExplorerUrl(chainId)}/tx/${txHash}`;
  }
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
}

export function getExplorerAccountUrl(account: string, chainId?: string) {
  if (isDev()) {
    return `${getExplorerUrl(chainId)}/address/${account}`;
  }
  return `${getExplorerUrl(chainId)}/address/${account}`;
}

export function getExplorerTokenTxUrl(address: any, chainId?: string) {
  if (isDev()) {
    return `${getExplorerUrl(chainId)}/address/${address}#tokentxns`;
  }
  return `${getExplorerUrl(chainId)}/address/${address}#tokentxns`;
}
